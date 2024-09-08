<!-- DataViewer.svelte -->
<script lang="ts">
	import { page } from '$app/stores';
	import FormField from '$lib/components/FormField.svelte';
	import SlidingBox from '$lib/components/SlidingBox.svelte';
	import { alertStore } from "$lib/stores/alertStore";
	import { loadingStore } from "$lib/stores/loadingStore";
	import axios from "axios";
	import { createEventDispatcher, onMount, tick } from "svelte";
	import { get } from 'svelte/store';
	import Modal from "../Modal.svelte";
	import MultiClickDiv from "../MultiClickDiv.svelte";
	import PageNavigator from "./PageNavigator.svelte";
	import { WorkType, type FetchRequest, type LimitSchema, type Meta, type ResultSet, type SearchSchema, type SortSchema, type TabSchema, type WorkDefinition, type WorkSchema } from "./script";
    
    /** 아이템 필드 중 id값에 해당하는 이름*/
    export let idName: string;
    /** 아이템 목록을 가져올 URL */
    export let fetchURL: string;
    /** 상세보기 데이터를 가져올 URL */
    export let specURL: string | undefined = undefined;
    /** 정렬종류를 정의하는 스키마 */
    export let sortSchema: SortSchema;

    /** 검색종류를 정의하는 스키마 */
    export let searchSchema: SearchSchema;
    /** 보기 수를 정의하는 스키마 */
    export let limitSchema: LimitSchema;
    /** 작업메서드를 정의하는 스키마 */
    export let workSchema: WorkSchema;
    /** 아이템 바로 겉을 감싸는 클래스 */
    export let itemWrapClass: string = '';
    /** 아이템 & 체크박스 & 범위선택표시 모두 감싸는 클래스 */
    export let itemOuterClass: string = '';
    /** 작업용 UI를 사용할지의 여부 */
    export let useWorkUI = false;
    /** 설명 모달을 사용할지의 여부 */

    /** fetch 시에 각 아이템에 적용되는 맵퍼 메소드 */
    export let fetchMapper: ((item: any) => any) | undefined = undefined;

    export let onClickItem: ((item: any) => void) | undefined = undefined

    export let tabSchema: TabSchema | undefined = undefined;
    let selectedTab: number;
    
    $: if(tabSchema) { //꼭 필요함
        if (selectedTab === undefined) {
            selectedTab = tabSchema.findIndex(item => item.select)
        }
        
        const tab = tabSchema[selectedTab];
        tab?.onClick();
    }
    
    export let fetchPayload:Record<string, any> = {}
    export let fetchSpecPayload:Record<string, any> | undefined = undefined;


    /** 현재 정렬 */
    let sortSelect: HTMLSelectElement;
    let currentSort: string;
    /** 현재 검색조건 */
    let searchSelect: HTMLSelectElement;

    let currentSearchBy: string;
    /** 현재 보기 수 */
    let limitSelect: HTMLSelectElement;
    let currentLimit: string;
    /** 전체 페이지 수 */
    let totalPage: number = 1;
    /** 현재 페이지 번호 */
    let currentPage: number = 1;
    /** 첫 페이지 요청 시간 */
    let startAt: string | undefined;
    /** 검색 Div 바인딩 */
    // let searchBind: HTMLInputElement;
    let searchString: string;
    /** 현재 페이지 데이터를 담는 Map */
    let pageItems = new Map();

    /** 검색창에 표시될 placeholder */
    let searchPlaceholder: string | null = null;

    async function extractSearchPlaceholder() {
        searchPlaceholder = null;
        await tick();
        searchPlaceholder = searchSelect?.selectedOptions?.[0]?.innerText;
    }

    function clearAll(options: {clearPageContext?:boolean; clearStartAt?:boolean, skipSelectMode?: boolean} = {}){
        if (!options.skipSelectMode) {
            selectMode = false;
            selectedItems = new Map();
        }
        
        rangeSelectMode = false;
        rangeSelectedItems = new Set();

        if (options.clearPageContext){
            pageItems.clear();
            specItem = null;
            totalPage = 1;
            currentPage = 1;
        }

        if (options.clearStartAt){
            startAt = undefined;
        }
    }

    export function getFetchStartAt() {
        return startAt;
    }

    /**
     * 현재 페이지에 해당하는 목록을 불러옴
     */
    export async function fetch(){

        try {
            loadingStore.showRightNow();

            clearAll({ skipSelectMode: true });

            const fetchRequest: FetchRequest = {
                sort: sortSelect?.value,
                page: currentPage,
                limit: limitSelect.value,
                ...fetchPayload
            };

            //검색어가 있는경우
            const searchBy = currentSearchBy;
            
            if(searchBy && searchString?.length > 0){
                fetchRequest.page = currentPage;
                fetchRequest.searchBy = searchBy;
                fetchRequest.searchString = searchString.trim();
            }

            //두번째 페이지부터는 서버에서 받은 시간 전송
            if(startAt) fetchRequest.startAt = startAt;

            const queryString = new URLSearchParams(fetchRequest as any).toString();
            const response = await axios.get(fetchURL + '?' + queryString);

            //메타 데이터 추출
            const meta = response.data.meta as Meta;
            totalPage = meta.totalPages;
            startAt = meta.startAt;
            currentPage = meta.currentPage;

            //페이지 데이터 초기화 & 할당
            pageItems.clear()

            response.data.data.forEach((item: any) => {
                pageItems.set(item[idName], fetchMapper?.(item) || item);
            })

            pageItems = pageItems;

            saveFetchDataToLocalStorage(fetchRequest);
        } catch (error) {
            console.error(error);
        } finally {
            loadingStore.hide();
        }
    }

    /** 상세보기 아이템 */
    let specItem:any;

    /**
     * 상세보기 아이템 정보를 가져옴
     * @param item 아이템 인스턴스
     */
    export async function fetchSpec(item: any){
        if (!item) return;

        try {
            loadingStore.showRightNow();
            
            const queryString = new URLSearchParams({
                id: item[idName],
                ...(fetchSpecPayload || fetchPayload)
            }).toString();

            const response = await axios.get(specURL + "?" + queryString);

            specItem = response.data;
        } catch (error) {
            await specModal.hide();
            await fetch()
            throw error;
        } finally {
            loadingStore.hide();
        }
    }

    /** 상세보기 모달 인스턴스 */
    let specModal: Modal;
    let specModalTitle: string = '상세 보기';

    /**
     * 상세보기 모달을 엶
     * @param item 아이템 인스턴스
     */
    export async function openSpec(args: {item?: any, title?: string, skipFetch?: boolean} = {}) {
        if (!specURL) return;

        if (onClickItem) {  //onClickItem이 정의된경우 실행
            onClickItem(args.item);
            return;
        }

        specItem = null; //specItem 초기화
        await tick();

        try {
            specModalTitle = args.title ? args.title : '상세 보기';
            if (args.item){
                if (args.skipFetch){
                    specItem = args.item;
                }else{  
                    await fetchSpec(args.item) //데이터 가져오기
                }
            } 

            await specModal.show();
            dispatch('show-spec');

        } catch (error) {
            console.log(error);
        }
        
    }

    /**
     * 상세보기 모달을 닫고 상세보기 아이템을 정리함
     */
    export async function closeSpec(forceFetch=false){
        specItem = null;

        if (forceFetch){
            clearAll({ clearStartAt: true })
            fetch();
        } 
        
        dispatch('hide-spec');
        await specModal?.hide();
    }

    export function getSpecModal() {
        return specModal;
    }

    /**
     * 상세보기 아이템을 가져옴
     */
    export function getSpecItem(){
        return specItem;
    }

    export function getSelectedItems() {
        return selectedItems;
    }

    /** 선택모드 토글 */
    let selectMode = false;
    /** 범위 선택모드 토글 */
    let rangeSelectMode = false;
    /** 선택된 아이템들의 집합 */
    let selectedItems: Map<any, object> = new Map();
    /** 범위 선택된 아이템들의 집합(시작아이템과 끝아이템) */
    let rangeSelectedItems = new Set();

    /**
     * 선택모드를 토글함
     */
    function toggleSelectMode(){
        // specItem = null;
        selectMode = !selectMode;

        if (!selectMode) { //범위선택은 선택모드의 하위기능이므로 상태 동기화
            rangeSelectedItems = new Set();
            rangeSelectMode = false;
        }
    }

    function resetSelectedItem() {
        selectedItems = new Map()
        rangeSelectedItems = new Set();
        rangeSelectMode = false;
    }

    async function extractSelectedItems() {
        return [...selectedItems.values()] as any[]
    }

    /**
     * 범위선택모드를 토글함
     */
    function togogleRangeSelectMode(){
        rangeSelectMode = !rangeSelectMode

        if(rangeSelectMode){
            if (!selectMode) toggleSelectMode()
        } else {
            rangeSelectedItems.clear();
            rangeSelectedItems = rangeSelectedItems;
        }
    }

    /**
     * 아이템의 선택 상태를 토글함
     * @param item 아이템 인스턴스
     */
    async function toggleSelectState(item: any){
        const id = item[idName]

        if (rangeSelectMode){ //범위선택 모드의 경우 2개가 모이면 그 사이를 모두선택함
            rangeSelectedItems.add(id);
            rangeSelectedItems = rangeSelectedItems;

            if (rangeSelectedItems.size >= 2) processRangeSelect();
        } else if(selectMode){  //선택모드의 경우 단순히 선택상태를 토글함
            if (selectedItems!.has(id)){
                selectedItems!.delete(id)
            } else {
                selectedItems!.set(id, item)
            }

            selectedItems = selectedItems; //반응성 트리거
        }
    }

    /**
     * 두 범위선택 아이템 사이를 모두 선택함
     */
    function processRangeSelect(){
        let inRange = false;
        
        for (const id of pageItems.keys()){ //TODO 좀더 최적화 가능할지도?

            if (inRange) {
                selectedItems.set(id, pageItems.get(id));
                if (rangeSelectedItems.has(id)) break; //두번째 범위선택 아이템 발견 시
            }

            if (rangeSelectedItems.has(id)) {
                selectedItems.set(id, pageItems.get(id));
                inRange = true; //첫 범위선택 아이템을 발견하면 inRange를 켬
            }
        }

        //사용자가 인지할 시간 200ms 이후 범위선택 아이템을 초기화함
        setTimeout(() => {
            rangeSelectedItems.clear();
            rangeSelectMode = false;
            rangeSelectedItems = rangeSelectedItems
        }, 200);

        selectedItems = selectedItems
    }

    /** 작업메뉴 모달 인스턴스 */
    let workMenuModal: Modal;

    /**
     * 선택된 아이템의 갯수에 따라 실행가능한 작업인지 판단함
     * @param work WorkDefinition 인스턴스
     */
    function isAvailableWork(work: WorkDefinition){
        const selectedSize = selectedItems.size;

        if (work.min && selectedSize < work.min){ //최소
            alertStore.warn({
                title: `최소 ${work.min} 개 필요`,
                content: `${work.name} 작업은 선택한 항목 수가 최소 ${work.min} 개여야 합니다.`,
                duration: 3000
            });
            return false;
        }

        if ((work.exact && selectedSize !== work.exact)){ //정확히 n개
            alertStore.warn({
                title: `정확히 ${work.exact} 개 필요`,
                content: `${work.name} 작업은 선택한 항목 수가 ${work.exact} 개여야 합니다.`,
                duration: 3000
            });
            return false;
        }

        if (work.max && selectedSize > work.max){ //최대
            alertStore.warn({
                title: `최대 ${work.max} 개 필요`,
                content: `${work.name} 작업은 선택한 항목 수가 최대 ${work.max} 개여야 합니다.`,
                duration: 3000
            });
            return false;
        }

        return true;
    }

    /**
     * 작업메뉴 모달을 닫음
     */
    export async function closeWorkMenu() {
        await workMenuModal?.hide();
    }

    export function getWorkMenuModal() {
        return workMenuModal;
    }

    function buildWorkSet(specItem?: any){
        if (specItem) {
            const singleItem = new Map();
            singleItem.set(specItem[idName], specItem)
            return {selectedItems: singleItem, pageItems, specItem};
        }
        else return { selectedItems, pageItems, specItem };
    }

    export function getWorkSet() {
        return buildWorkSet(specItem);
    }

    /**
     * 정의된 작업을 실행함
     * @param work WorkDefinition 객체
     * @param workSet WorkSet 객체
     */
    export async function doSomeWork(work: WorkDefinition) {
        let workSet = buildWorkSet(specItem);
        
        const resultSet: ResultSet = (await work.onClick?.(workSet))!;
        if (!resultSet) return;

        const results = resultSet.results;
        const result = results?.[0] || results;

        if (specItem){  // 상세보기를 통한 단일작업
            // const result = resultSet.results[0];
            if (result.status) closeSpec(true);
        } else { // 작업메뉴를 통한 다중작업
            closeWorkMenu();

            if (results?.length > 1){
                closeSpec();

                workResultSet = resultSet;
                workResultCountUp = countUpWorkResults();

                //작업결과로 ResultSet을 받으면 결과모달을 띄움
                workResultsModal.show();
            } else if (result?.status === true) {
                closeSpec(true);
            }
        }
    }

    /** 현재 작업 결과 인스턴스 */
    let workResultSet: ResultSet | null;
    /** 작업결과 모달 인스턴스 */
    let workResultsModal: Modal;
    /** 현재 작업 결과 성공/실패 갯수 캐싱 */
    let workResultCountUp: { success: number, fail: number } = { success: 0, fail: 0 }

    /**
     * 작업결과 모달을 닫으면서 lazy하게 새로고침함
     */
    async function closeWorkResultModal() {
        /*
        fetch전에 workResultSet모달을 null로 바꿔서 렌더링을 해제해줘야함,
        workResultSet에 렌더링하는 내용이 pageItems를 참조하기때문
        */
        workResultSet = null; //TODO 그냥 fetch의 첫 초기화부분에 옮겨도 될듯?
        clearAll({ clearStartAt: true })
        fetch();
        workResultsModal?.hide();
    }

    /**
     * 작업 결과 갯수를 카운트하는 메소드
     */
    function countUpWorkResults(){
        let success = 0, fail = 0;

        workResultSet?.results.forEach(workResult => {
            if(workResult.status) success++;
            else fail++;
        })

        return { success, fail }
    }

    /** 검색옵션 영역 숨김/보기 상태 */
    export let showSearchOption = false;

    /** 검색옵션 영역을 토글하는 메서드  */
    function toggleSearchOption() {
        showSearchOption = !showSearchOption

        if (showSearchOption) {
            searchSlidingBox.open();
        } else {
            searchSlidingBox.close();
        }
    }

    /* 마지막 탐색 파라미터 저장하는 코드 */
    let sessionStorageKey = 'dv:' + (get(page).url.pathname || 'defaultPage');

    function saveFetchDataToLocalStorage(fetchRequest: FetchRequest) {
        const dataToStore = {
            fetchRequest,
            selectedTab,
            searchString,
            searchBy: currentSearchBy
        }

        sessionStorage.setItem(sessionStorageKey, JSON.stringify(dataToStore));
    }

    let storedData: any;

    async function loadFetchDataFromLocalStorage() {
        const rawHistory = sessionStorage.getItem('history')
        if (!rawHistory) return;

        // sessionStorage에서 이전 경로 가져오기
        const history = JSON.parse(rawHistory);

        // 이전 페이지와 현재 페이지가 다른 경우에만 로컬 스토리지에서 데이터 불러오기
        if (history[0].startsWith(history[1])) {
            storedData = sessionStorage.getItem(sessionStorageKey);

            if (storedData) {
                const stored = JSON.parse(storedData);

                currentPage = stored.fetchRequest.page || 1;
                startAt = stored.fetchRequest.startAt || undefined;
                sortSelect.value = stored.fetchRequest.sort || '';
                limitSelect.value = stored.fetchRequest.limit || '';
                currentSearchBy = stored.searchBy
                searchString = stored.searchString
                selectedTab = stored.selectedTab
            }
        }

    }

    let searchSlidingBox: SlidingBox;

    async function onClickTab(tab: any, index: any) {
        selectedTab = index;

        clearAll({ clearPageContext: true, clearStartAt: true })
        tab.onClick()
        await tick();

        searchSlidingBox.resize()

        if (!sortSelect.value) currentSort = sortSchema[0].value;
        if (!searchSelect.value) currentSearchBy = searchSchema[0].value;

        fetch();
    }

    /* --- */

    const dispatch = createEventDispatcher();

    onMount(async () => {
        await tick();
        await loadFetchDataFromLocalStorage();

        await extractSearchPlaceholder();
        await fetch();

        if (showSearchOption === true) {
            searchSlidingBox.open();
        }
    })

</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="container-fluid g-0">

    <div class="row g-2 mt-2">
        <SlidingBox clazz="col-12" bind:this={searchSlidingBox} bind:show={showSearchOption}>
            <div class="d-flex gap-1 pb-1">
                <!-- 보기 수 -->
                <FormField floating dataScope="dataviewer" noEditMark style="width:25%">
                    <select id="limit" name="보기 수" class="form-select" bind:this={limitSelect} on:change={() => fetch()} bind:value={currentLimit}>
                        {#each limitSchema as item}
                        <option value="{item}">{item}</option>     
                        {/each}
                    </select>
                </FormField>
                <!-- 정렬 -->
                 <div class="d-flex gap-1 flex-grow-1">
                    <FormField floating dataScope="dataviewer" noEditMark style="width:50%">
                        <select id="sort" name="정렬" class="form-select" on:change={() => fetch()} bind:this={sortSelect} bind:value={currentSort}>
                            {#each sortSchema as item}
                                <option value="{item.value}">{item.name}</option>
                            {/each}
                        </select>
                    </FormField>
                    <!-- 검색기준 -->
                    <FormField floating dataScope="dataviewer" noEditMark style="width:50%">
                        <select id="search" name="검색기준" class="form-select" on:change={() => extractSearchPlaceholder()} bind:this={searchSelect} bind:value={currentSearchBy}>
                            {#if searchSchema}
                            {#each searchSchema as item}
                                <option value="{item.value}">{item.name}</option>
                            {/each}
                            {/if}
                        </select>
                    </FormField>
                </div>
            </div>

            <slot name="searchOption" {currentSearchBy} {currentSort}></slot>

            {#if searchSchema && searchPlaceholder}
            <!-- <div class="col-12"> -->
            <div class="d-flex gap-1 pb-1">
                <!-- 검색 -->
                <FormField floating dataScope="dataviewer" clazz="w-100" noEditMark>
                    <input id="search" name="{searchPlaceholder} 검색" class="form-control" bind:value={searchString}>
                </FormField>
                <div class="search-button" on:click={async () => {
                    dispatch('beforeSearch')
                    clearAll({ clearPageContext: true, clearStartAt: true })
                    await tick();
                    fetch()
                }}>
                    <img src="/images/search_icon.png" alt="검색">
                </div>
            </div>
            <!-- </div> -->
            {/if}

            <slot name="underSearch" {currentSearchBy} {currentSort}></slot>

        </SlidingBox>

        <div class="row g-0">
            <!-- 검색옵션 토글 버튼 -->
            <div class="col-12 g-1">
                <button class="btn btn-light w-100 text-secondary" on:click={toggleSearchOption}>{showSearchOption ? '▲' : '검색옵션'}</button>
            </div>

            {#if useWorkUI}
                <div class="col-4 g-1">
                    <!-- 범위선택 버튼 -->
                    <button class="btn w-100 btn-height"
                        class:btn-success={rangeSelectMode}
                        class:btn-secondary={!rangeSelectMode}
                        on:click={togogleRangeSelectMode}
                    >범위선택</button>
                </div>
                <div class="col-4 g-1">
                    <!-- 선택모드 버튼 -->
                    <button class="btn w-100 btn-height"
                        class:btn-success={selectMode}
                        class:btn-secondary={!selectMode}
                        on:click={toggleSelectMode}
                    >선택모드</button>
                </div>
                <div class="col-4 g-1">
                    <!-- 작업메뉴 버튼 -->
                    <button class="btn btn-primary w-100 btn-height" on:click={() => workMenuModal?.show()} >작업메뉴</button>
                </div>
            {:else}
                <slot name="work"></slot>
            {/if}
        </div>
    </div>

    <div class="row g-0 mt-2">

        {#if tabSchema}
            <div class="row g-0">
                {#each tabSchema as tab, index}
                <div class="col">
                    <button class="tab-button {index === selectedTab ? 'tab-button-active' : ''}" on:click={() => onClickTab(tab, index)}>
                        {tab.name}
                    </button>
                </div>
                {/each}
            </div>
        {/if}


        <!-- 아이템 목록 표시영역 -->
        <div class="{itemWrapClass}">
            {#each pageItems.entries() as [id, item], idx}
            <div class="{itemOuterClass} col-12 d-flex position-relative" on:click={() => (selectMode) ? toggleSelectState(item) : openSpec({item})}
                class:range-selected={rangeSelectedItems.has(id)}>
                
                {#if selectMode}
                    <!-- 선택모드 시 보이는 체크박스 -->
                    <input type="checkbox" class="" style="" checked={selectedItems.has(id)}>
                {/if}
                
                <slot name="item" {item} {idx} sort={currentSort} page={currentPage} limit={currentLimit}></slot>
                
            </div>

            {:else}
                <p class="text-center small text-secondary p-2">표시할 데이터가 없습니다</p>
            {/each}
        </div>
    </div>

</div>

<!-- 페이지 번호 표시기 -->
<PageNavigator bind:totalPage={totalPage} bind:currentPage={currentPage} on:select-page={() => fetch()}/>


<!-- 작업 메뉴 모달 (다중작업) -->
<Modal title="작업 메뉴" bind:this={workMenuModal} footerSlot>
    <div class="container g-0 py-2">
        {#if selectedItems.size > 0}
        <div class="border rounded row g-0 selected-item-container mb-1 overflow-auto" style="max-height: 20rem;">
            {#await extractSelectedItems() then values}
                {#each values as item}
                    <slot name="selectedItem" item={item}></slot>
                {/each}
            {/await}

        </div>
        <p class="small text-secondary mb-1">{selectedItems.size} 개 선택됨</p>
        {/if}

        <div class="row g-1 d-flex justify-content-center align-items-center">
            {#each Object.values(workSchema) as work}
            {#if work.render(buildWorkSet(specItem)) && work.workType !== WorkType.ONLY_SPEC }
            <div class="{work.grid ? work.grid : 'col-6 col-sm-5'}">
                <MultiClickDiv clazz={work.class} clickCount={work.clickCount} callback={() => doSomeWork(work)}
                    beforeExecute={() => isAvailableWork(work)}
                >{work.name}</MultiClickDiv>
            </div>    
            {/if}
            {/each}
        </div>
    </div>
    <div slot="footer" class="w-100 d-flex gap-1">
        <button class="btn btn-secondary btn-height w-100" on:click={resetSelectedItem}>선택 해제</button>
        <button class="btn btn-secondary btn-height w-100" on:click={closeWorkMenu}>닫기</button>
    </div>
</Modal>

<!-- 상세보기 모달 (단일 작업) -->
<Modal title={specModalTitle} bind:this={specModal} footerSlot>
    {#await (async () => specItem)() then specItem}
    <slot name="spec" {specItem}></slot>     
    {/await}
    
    <div class="container g-0 pt-2">
        <div class="row g-1 d-flex justify-content-center align-items-center">
            {#each Object.values(workSchema) as work}
            {#if work.render(buildWorkSet(specItem)) && work.workType !== WorkType.ONLY_WORK}
            <div class="{work.grid ? work.grid : 'col-6 col-sm-5'}">
                <MultiClickDiv clazz={work.class} clickCount={work.clickCount} callback={() => doSomeWork(work)}>{work.name}</MultiClickDiv>
            </div>    
            {/if}
            {/each}
        </div>

        <slot name="underButtons" {specItem}></slot>
    </div>

    <div slot="footer" class="container-fluid g-0">
        <div class="row g-1">
            <div class="col-6">
                <button class="btn btn-light btn-height w-100" on:click={() => {
                    dispatch('spec-refresh')
                    fetchSpec(specItem)
                }}>새로고침</button>
            </div>
            <div class="col-6">
                <button class="btn btn-secondary btn-height w-100" on:click={() => closeSpec()}>닫기</button>
            </div>
        </div>
    </div>
</Modal>

<!-- 작업 결과 모달 -->
<Modal title="작업 결과" bind:this={workResultsModal} footerSlot>
    {#if workResultSet}
    <div class="overflow-auto" style="max-height: 50vh;">
        <!-- workResultSet에서 결과와 toString메서드를 참조해 표시함 -->
        {#each workResultSet.results as item}
            <div class="d-flex flex-column border-top border-bottom">
                <p class="ps-1 small text-secondary">ID: {item.id}</p>
                <div class="d-flex gap-1 align-items-center">
                    <img class="result-icon" src="/images/{`work_${item.status === true ? 'success' : 'fail'}_icon.png`}" alt="결과아이콘">
                    <p class="fw-bold">{workResultSet.toString(selectedItems.get(item.id))}</p>
                </div>
                <p class="small ps-4">{item.message}</p>
            </div>
        {/each}
    </div>
    <!-- 성공/실패 카운트 표시 -->
    <div class="my-2 py-2 border-top d-flex gap-2 justify-content-center align-items-center small">
        <div class="d-flex gap-1">
            <img class="result-icon" src="/images/work_success_icon.png" alt="성공아이콘">
            <p>{workResultCountUp.success}</p>
        </div>

        <div class="d-flex gap-1">
            <img class="result-icon" src="/images/work_fail_icon.png" alt="실패아이콘">
            <p>{workResultCountUp.fail}</p>
        </div>
    </div>
    {/if}

    <div slot="footer" class="w-100">
        <button class="btn btn-secondary btn-height w-100" on:click={closeWorkResultModal}>닫기</button>
    </div>
</Modal>


<!-- 설명 모달 -->
<!-- {#if !noDesc}
    <Modal title="페이지 설명" bind:this={descModal}>
        <slot name="desc"></slot>
    </Modal>     
{/if} -->





<style lang="scss">

//검색버튼 스타일
.search-button {
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid lightgray;
    border-radius: 0.5rem;

    width: 3.6rem;
    min-width: 3.6rem;
    height: 3.6rem;
    min-height: 3.6rem;
    padding: 0.25rem;

    img {
        width: 100%;
        height: 100%;
    }
}

// 설명과 더보기 스타일
.desc-indicator {
    border: 1px solid rgb(201, 201, 201); 
    border-radius: 0.25rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 3.6rem;
    font-size: 0.9rem;
    color: rgb(109, 109, 109);
    text-align: center;

    .desc {
        text-overflow: ellipsis;
        text-wrap: nowrap;
        width: 100%;
        overflow: hidden;
        height: 1.3rem;
        padding: 0 0.5rem;
    }
}

//범위선택 시 색상변경
.range-selected {
    background-color: rgba(255, 0, 0, 0.1);
}

//결과 (체크, x) 아이콘 스타일
.result-icon {
    width: 1rem;
    height: 1rem;
}

.slide-in {
  animation: slideIn 200ms forwards;
}

.slide-out {
  animation: slideOut 200ms forwards;
}

@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-100%);
  }
}

.tab-button {
    width: 100%;
    height: 100%;
    border: 2px solid rgb(212, 212, 212);
    border-top-left-radius: 0.5rem;
    border-top-right-radius: 0.5rem;

    min-height: 2.5rem;
    background-color: transparent;
    border-bottom: none;
    color: rgb(139, 139, 139);
    font-size: 0.9rem;
    text-wrap: pretty;
}

.tab-button-active {
    border-color: rgb(136, 189, 139);
    border-width: 3px;
    color: black;
}


</style>