<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import { v4 } from "uuid";

    export let id: string = 'flta-' + v4();
    export let name: string = "내용";
    export let clazz: string = '';
    export let style: string = '';
    export let height: string = '12rem'; // 기본 높이 설정
    export let foldable: boolean = false;
    export let editMode: boolean = false;
    let defaultHeight: number; // 외부에서 입력받을 기본 높이

    let element: HTMLTextAreaElement;
    let initialHeightValue: number;
    let adjustedHeightValue: number;
    let heightUnit: string;
    let isExpanded: boolean = false;
    let text = '';

    onMount(() => {
        const heightRegex = /(\d+\.?\d*)(\D+)/; // 숫자와 단위를 추출하는 정규 표현식
        const matches = height.match(heightRegex);
        if (matches) {
            adjustedHeightValue = initialHeightValue = parseFloat(matches[1]);
            heightUnit = matches[2];
            defaultHeight = defaultHeight || initialHeightValue; // 외부에서 주어지지 않은 경우 초기 높이 값 사용
            element.style.height = `${initialHeightValue}${heightUnit}`;
        }
    });

    // function adjustHeight(element: HTMLTextAreaElement) { // 여기서 HTMLElement 대신 HTMLTextAreaElement 사용
    //     if (!element) return;

    //     const currentScrollTop = element.scrollTop; // 현재 스크롤 위치 저장
    //     const currentCursorPos = element.selectionStart; // 현재 커서 위치 저장

    //     element.style.height = 'auto';
    //     const newHeight = Math.max(element.scrollHeight, initialHeightValue * 16); // 최소 높이를 보장하기 위해 16px 단위로 환산
    //     element.style.height = `${newHeight}px`;

    //     // 스크롤 및 커서 위치 복원
    //     element.scrollTop = currentScrollTop;
    //     element.setSelectionRange(currentCursorPos, currentCursorPos);
    // }

    function adjustHeight(element: HTMLTextAreaElement) {
        if (!element) return;

        const currentScrollTop = element.scrollTop; // 현재 스크롤 위치 저장

        element.style.height = 'auto';
        const newHeight = Math.max(element.scrollHeight, initialHeightValue * 16); // 최소 높이를 보장하기 위해 16px 단위로 환산
        element.style.height = `${newHeight}px` ;

        // 스크롤 위치 복원
        setTimeout(() => {
            element.scrollTop = currentScrollTop;
        }, 0);
    }

    function toggleExpand() {
        isExpanded = !isExpanded;
        if (isExpanded) {
            element.style.height = `${element.scrollHeight}px`;
        } else {
            element.style.height = `${defaultHeight}${heightUnit}`;
        }
    }

    const dispatch = createEventDispatcher();
</script>

<textarea 
    bind:this={element} 
    bind:value={text} 
    {id} {name} 
    class="{clazz}" 
    style="{style} height: {height}; transition: height 0.3s ease-in-out;" 
    on:input="{e => { adjustHeight(e.currentTarget); dispatch('input', e.currentTarget); }}" 
></textarea>

{#if foldable}
<div class="d-flex gap-1 w-100">
    <button class="btn btn-light w-100 btn-sm" on:click={toggleExpand}>
        {isExpanded ? '▲' : '전체보기'}
    </button>
</div>
{/if}

{#if editMode}
<div class="d-flex gap-1 w-100">
    <button class="btn btn-light w-100 btn-sm" on:click={() => adjustHeight(element)}>
        높이 재조정
    </button>
</div>
{/if}

<style lang="scss">
    textarea {
        width: 100%;
        color: rgb(41, 41, 41);
        font-size: 0.9rem;
        overflow: hidden; /* 수직 스크롤바 기본값 */
        resize: none;
        box-sizing: border-box;
        transition: height 0.3s ease-in-out; /* 높이 전환 애니메이션 추가 */
    }

    .toggle-button {
        margin-top: 10px;
    }

    .textarea-readonly {
        height: auto !important;
        overflow: auto;
        text-wrap: pretty !important;
    }
</style>