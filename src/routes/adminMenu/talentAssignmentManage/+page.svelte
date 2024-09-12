<script lang="ts">
	import DataViewer from '$lib/components/DataViewer/DataViewer.svelte';
	import type { LimitSchema, SearchSchema, TabSchema, WorkDefinition, WorkSchema, WorkSet } from '$lib/components/DataViewer/script';
	import {WorkType, type SortSchema } from '$lib/components/DataViewer/script';
	import DateSelector from '$lib/components/DateSelector/DateSelector.svelte';
	import { DateMode } from '$lib/components/DateSelector/script';
	import FormField from '$lib/components/FormField.svelte';
	import PageContainer from "$lib/components/PageContainer.svelte";
	import TrainingTypeIndicator from '$lib/components/TrainingTypeIndicator.svelte';
	import UserContact from '$lib/components/UserContact.svelte';
	import { convertDate, formatDatetime } from '$lib/script/lib/formatDatetime';
	import { Validation } from '$lib/script/lib/validation';
	import { UserRole, userStore } from '$lib/stores/userStore';
	import TrainingSelector from '../../home/TrainingSelector.svelte';

    const pageTitle = "달란트 지급 관리";
        
    let dataViewer: DataViewer;
    let formBind: Element;
    let searchBind: HTMLElement;
    
    const grantSortSchema: SortSchema = [
        { name: '이름순', value: 'name' },
        { name: '달란트순', value: 'talent' },
    ]

    const revokeSortSchema: SortSchema = [
        { name: '최신순', value: 'latest' },
        { name: '오래된순', value: 'oldest' },
        { name: '지급대상자 이름순', value: 'userName' },
        { name: '훈련 이름순', value: 'trainingName' },
    ]

    const grantSearchSchema: SearchSchema = [
        { name: '이름', value: 'userName' }
    ]

    const revokeSearchSchema: SearchSchema = [
        { name: '지급대상 이름', value: 'userName' },
        { name: '지급대상 이메일', value: 'userEmail' },
        { name: '지급자 이름', value: 'granterName' },
        { name: '지급자 이메일', value: 'granterEmail' }
    ]

    // const grant: WorkDefinition = {
    //     name: '지급',
    //     class: 'btn btn-primary btn-height w-100',
    //     grid: 'col-6',
    //     workType: WorkType.ONLY_WORK,
    //     clickCount: 1,
    //     render: (workSet?: WorkSet) => true,
    //     onClick: async (workSet: WorkSet) => {

    //     }
    // }

    // const revokeWork: WorkDefinition = {
    //     name: '회수',
    //     class: 'btn btn-danger btn-height w-100',
    //     grid: 'col-6',
    //     workType: WorkType.ONLY_WORK,
    //     clickCount: 3,
    //     render: (workSet?: WorkSet) => true,
    //     onClick: async (workSet: WorkSet) => {

    //     }
    // }

    // const revokeSpec: WorkDefinition = {
    //     name: '회수',
    //     class: 'btn btn-danger btn-height w-100',
    //     grid: 'col-12',
    //     workType: WorkType.ONLY_SPEC,
    //     clickCount: 3,
    //     render: (workSet?: WorkSet) => true,
    //     onClick: async (workSet: WorkSet) => {

    //     },
    // }

    const onPrepare: WorkDefinition = {
        name: '작업메뉴는 준비중입니다',
        class: 'btn btn-secondary btn-height w-100',
        grid: 'col-12',
        workType: WorkType.BOTH,
        clickCount: 1,
        render: (workSet?: WorkSet) => true,
        onClick: async (workSet: WorkSet) => {

        },
    }

    let idName:string = 'id';
    let fetchURL: string;
    let specURL: string | undefined;
    let limitSchema: LimitSchema = [ 10, 20, 30, 40, 50 ]
    let sortSchema: SortSchema = grantSortSchema;
    // let workSchema: WorkSchema = { grant, revokeSpec, revokeWork };
    let workSchema: WorkSchema = { onPrepare };
    let searchSchema: SearchSchema = grantSearchSchema;
	let dateSelector: DateSelector;
    let trainingId: string | undefined;
    let fetchPayload: any = {}

    enum DataTab { GRANT, REVOKE };
    let dataTab: DataTab = DataTab.GRANT;

    const tabSchema: TabSchema = [
        {
            name: '지급',
            select: true,
            onClick: () => {
                dataTab = DataTab.GRANT
            }
        },
        {
            name: '조회/회수',
            onClick: () => {
                dataTab = DataTab.REVOKE
            }
        },
    ]

    $: if (dataTab === DataTab.GRANT) {
        idName = 'email';
        fetchURL = '/api/talentAssignmentManage/list/grant';
        specURL = undefined;
        sortSchema = grantSortSchema;
        searchSchema = grantSearchSchema;
        // workSchema = { grant }
    }
     else if(dataTab === DataTab.REVOKE){
        idName = 'id';
        fetchURL = '/api/talentAssignmentManage/list/revoke';
        // specURL = '/api/talentAssignmentManage/spec';
        specURL = undefined;
        sortSchema = revokeSortSchema;
        searchSchema = revokeSearchSchema;
        // workSchema = { revokeSpec, revokeWork }
    }

</script>

<PageContainer title={pageTitle}>
    <p class="text-center small text-secondary mt-2">개발중인 기능입니다</p>

    <DataViewer bind:this={dataViewer} 
        bind:sortSchema
        bind:limitSchema
        bind:workSchema
        bind:searchSchema
        bind:idName
        bind:fetchPayload
        {tabSchema}
        {fetchURL}
        {specURL}
        itemWrapClass="row gx-0 mb-2 border-top border-bottom"
        useWorkUI={$userStore.role === UserRole.ADMIN}
        showSearchOption={true}
        on:beforeSearch={() => {
            const values = Validation.getValues(searchBind);
            convertDate(values, 'searchStartDate', { toISOString: true })
            convertDate(values, 'searchEndDate', { setTimeEnd: true, toISOString: true })
            fetchPayload = values;

            if(trainingId) fetchPayload['trainingId'] = trainingId;
        }}
        on:beforeTabChange={() => {
            trainingId = undefined;
        }}
    >
        <div slot="item" class="w-100" let:item>
            <div class="border-top border-bottom p-2" style="min-height: 3rem;">
                {#if dataTab === DataTab.GRANT}
                <div class="d-flex">
                    <div class="flex-grow-1 d-flex flex-column justify-content-center">
                        <p class="name">{item.name}</p>
                        <p class="small text-secondary">{formatDatetime(item.birthday, { includeTime: false })} 생</p>
                    </div>
                    <div class="d-flex gap-1 align-items-center justify-content-between">
                        <p class="small text-secondary text-nowrap">총 획득</p>
                        <img class="talent-icon" src="/images/talent_icon.png" alt="달란트아이콘">
                        <p class="talent-amount">{item.talent || 0}</p>
                    </div>
                </div>
                {:else if dataTab === DataTab.REVOKE}
                <div class="d-flex position-relative">
                    <div class="flex-grow-1 d-flex flex-column justify-content-center">
                        <p class="text-primary small">{item.training.title}</p>
                        <div class="d-flex flex-column justify-content-center">
                            <p class="name">{item.user.name}</p>
                        </div>
                        <p class="small text-secondary">{formatDatetime(item.createdAt, { includeSeconds: false })}</p>
                    </div>
                    <div class="position-absolute approve-stamp-wrap">
                        <img src="/images/approved_stamp.png" alt="승인도장" class="w-100 h-100">
                    </div>
                    <div class="d-flex flex-column gap-1 justify-content-center align-items-end">
                        <div class="d-flex gap-1 align-items-center justify-content-between">
                            <img class="talent-icon" src="/images/talent_icon.png" alt="달란트아이콘">
                            <p class="talent-amount">{item.amount}</p>
                        </div>
                        <div class="small d-flex gap-1 align-items-center justify-content-end">
                            
                            
                            {#if item?.creater}
                                <p class="text-secondary" style="font-size: 0.6rem;">지급자</p>
                                <p>{item?.creater?.name}</p>
                            {:else}
                                <p class="text-danger text-nowrap" style="font-size: 0.6rem;">탈퇴함</p>
                                <p class="text-secondary" style="word-break: break-all; text-decoration: line-through;">{item?.createdBy}</p>
                            {/if}
                        </div>
                    </div>

                </div>
                {/if}
            </div>
        </div>

        <div slot="spec" let:specItem class="container-fluid g-0">
            <div class="row g-2 m-auto">

                <div class="col-12">
                    <FormField floating from={specItem} noValidate>
                        <input id="training.title" name="훈련 제목" class="form-control">
                    </FormField>
                </div>

                <div class="col-12">
                    <TrainingTypeIndicator trainingType={specItem.training.trainingType} />
                </div>

                <div class="col-12">
                    <FormField floating from={specItem} noValidate>
                        <input id="amount" name="지급량" class="form-control">
                    </FormField>
                </div>

                <div class="col-12">
                    <div class="border rounded p-2">
                        <div class="label-and-value">
                            <p class="label">지급자</p>
                            <UserContact email={specItem.createdBy} />
                        </div>
                        <div class="label-and-value">
                            <p class="label">지급일시</p>
                            <p class="value">{formatDatetime(specItem.createdAt, { includeSeconds: false })}</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <!-- <div slot="selectedItem" class="p-1 small border col-12 col-sm-6 d-flex align-items-center gap-2" let:item>
            <p class="text-secondary">{item.training.title}</p>
            <div class="d-flex gap-2 justify-space-between">
                <p>{item.user.name}</p>
                <p>+{item.amount}</p>
            </div>
        </div> -->

        <div slot="searchOption" bind:this={searchBind}>
            {#if dataTab === DataTab.REVOKE}
            <div class="d-flex gap-1 align-items-center pb-1">
                <FormField floating readonly noEditMark clazz="w-100">
                    <input id="searchStartDate" name="기간 시작" class="form-control"
                    on:click={(e) => {
                        dateSelector?.open(
                            e.currentTarget,
                            '시작 날짜를 선택해주세요',
                            DateMode.DATE
                        )}
                    }
                    />
                </FormField>

                <p>~</p>

                <FormField floating readonly noEditMark clazz="w-100">
                    <input id="searchEndDate" name="기간 끝" class="form-control"
                    on:click={(e) => {
                        dateSelector?.open(
                            e.currentTarget,
                            '끝 날짜를 선택해주세요',
                            DateMode.DATE
                        )}
                    }
                    />
                </FormField>
            </div>
            <div class="pb-1">
                <TrainingSelector bind:trainingId />
            </div>
            {/if}
        </div>

    </DataViewer>
</PageContainer>

<DateSelector bind:this={dateSelector} />

<style lang="scss">

.talent-icon {
    width: 1.3rem;
    height: 1.3rem;
    opacity: 0.8;
}

.talent-amount {
    min-width: 1.2rem;
    text-align: right;
    font-weight: bold;
}

.approve-stamp-wrap {
    right: 0; 
    top: 0.3rem; 
    width: 3.5rem; 
    height: 3.5rem; 
    opacity: 0.1;
}

</style>
