<script lang="ts">
import { alertStore } from '$lib/stores/alertStore';
import { debounce } from 'lodash-es';
import { createEventDispatcher, onMount, tick } from 'svelte';

export let clazz='';
export let style='';

export let totalPage: number;
export let currentPage: number;
let surroundingPages = 4; // 현재 페이지 주변으로 표시할 페이지 수
let buttonsContainer: HTMLDivElement;
let displayedPages: number[];

onMount(() => {
//   calculateDisplayedPages();
});

const dispatch = createEventDispatcher();

// 전체페이지 수가 계산되면 필요한 페이지버튼을 계산
$: if(totalPage || currentPage) calculateDisplayedPages()

async function selectPage(pageNum: number) {
  currentPage = pageNum;
  scrollToSelectedPage();
  dispatch("select-page")
}

/**
 * 선택된 페이지로 스크롤하는 함수입니다.
 */
async function scrollToSelectedPage() {
    if(!buttonsContainer) return;

    await tick();

    const selectedButton = buttonsContainer.querySelector('.Selected');
    if (selectedButton) {
        // buttonsContainer의 실제 보이는 너비를 계산합니다.
        const containerRect = buttonsContainer.getBoundingClientRect();
        const visibleWidth = containerRect.width;
        
        // selectedButton과 buttonsContainer의 좌표를 기준으로 스크롤 양을 계산합니다.
        const buttonRect = selectedButton.getBoundingClientRect();
        const scrollAmount = (buttonRect.left + buttonRect.width / 2) - (containerRect.left + visibleWidth / 2);
        
        buttonsContainer.scrollTo({ left: buttonsContainer.scrollLeft + scrollAmount, behavior: 'smooth' });
    }
}


/**
 * 표시될 페이지를 계산하는 함수입니다. 현재 페이지를 중심으로 주변 페이지를 표시합니다.
 */
const calculateDisplayedPages = debounce(async () => {
  const pages = [1]; // 첫 페이지는 항상 포함
  const start = Math.max(currentPage - surroundingPages, 2); // 현재 페이지 앞의 시작 페이지
  const end = Math.min(currentPage + surroundingPages, totalPage - 1); // 현재 페이지 뒤의 끝 페이지

  let addFrontElipsis = false;
  let addRearElipsis = false;

  if (start > 2) addFrontElipsis = true;
  if (end < totalPage - 1) addRearElipsis = true;


  if(addFrontElipsis) {
    pages.push(-1) //-1은 ... 으로 표시됨
  }

  // 현재 페이지 주변 페이지 추가
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if(addRearElipsis) {
    pages.push(-1)
  }

  if (totalPage > 1) pages.push(totalPage); // 마지막 페이지 추가

  displayedPages = pages;
  scrollToSelectedPage();
}, 25)

export function nextPage() {
  const targetPage = currentPage + 1;

  if(targetPage > totalPage){
    alertStore.info({
      content: '마지막 페이지입니다.',
      duration: 1000,
    })
  }else{
    selectPage(targetPage)
  }
}


export function prevPage() {
  const targetPage = currentPage - 1;

  if(targetPage <= 0){
    alertStore.info({
      content: '처음 페이지입니다.',
      duration: 1000,
    })
  }else{
    selectPage(targetPage)
  }
}
</script>

<!-- 페이지 버튼 영역 -->
<div class="user-select-none {clazz}" style="{style}">
	<div class="buttons-container overflow-auto w-100" bind:this={buttonsContainer}>
    {#if displayedPages}
    {#each displayedPages as item}
        <button
        class="divify PageButton {item === currentPage ? 'Selected' : ''}"
        class:PageElipse={item === -1}
        on:click={() => {(item === -1) ? '' : selectPage(item)}}>
        {item === -1 ? '...' : item}
        </button>
    {/each}
    {/if}
	</div>
</div>


<style lang="scss">
  $button-unit-size: 3.2rem;

  .buttons-container {
    display: flex; /* 이 부분을 추가 */
    gap: 4px; /* 버튼 사이의 간격 조정 */
    padding-left: 50%;
    padding-right: 50%;
  }

  .buttons-container::-webkit-scrollbar {
    display: none;
  }

  .PageButton{
    border: 2px solid var(--color-theme);
    border-radius: 0.25rem;
    height: $button-unit-size;
    min-width: $button-unit-size;
    text-align: center;
    font-weight: bold;
    color: rgb(65, 65, 65);
    background-color: white;

    display: inline-flex; /* 수정됨: inline 대신 inline-flex 사용 */
    justify-content: center;
    align-items: center;
  }

  .PageElipse{
    border: none;
    padding-top: 1rem;
    font-size: 1.2rem;
    color: gray;
  }

  .Selected{
    color: white;
    background-color: var(--color-theme);
  }
</style>
