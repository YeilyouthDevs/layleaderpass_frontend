<script lang="ts">
	import PageContainer from "$lib/components/PageContainer.svelte";
	import { fly } from 'svelte/transition';
    import { onMount } from 'svelte'
	import { loadingStore } from "$lib/stores/loadingStore";

    onMount(() => {
        loadingStore.showRightNow();
    })

</script>

<PageContainer title="중직자PASS란?">

    <div class="row gx-0 gy-3 mt-0 mb-5 mx-1" transition:fly={{ y: 20, duration: 1000 }}>
        <div class="col-12">
            <p class="fw-bold">중직자PASS란?</p>
            <p class="ps-2">미래 중직자인 예일교회 청년들이 중직자의 축복을 5가지로 나누어 체험하고 도전해, 세계복음화를 위한 교회 세우는 중직자로 세워지도록 돕는 예일교회 청년국만의 자체 미래 중직자 훈련 프로그램입니다.</p>
        </div>

        <div class="col-12">
            <div class="d-flex align-items-center" id="what-is-layleaderpass">
                <img class="w-100 h-100" src="/images/what_is_layleaderpass.png" alt="중직자PASS란?"
                    on:load={() => loadingStore.hide()}
                >
            </div>
        </div>

        <div class="col-12">
            <p class="fw-bold">어떻게 진행되나요?</p>
            <ul style="w-100">
                <li>복음가진 중직자</li>
                <li>전도하는 중직자</li>
                <li>선교하는 중직자</li>
                <li>후대세우는 중직자</li>
                <li>교회세우는 중직자</li>
            </ul>
            <p class="ps-2">위 5가지 카테고리별로 세부 훈련 내용이 있으며 그 훈련들을 PASS 하면 달란트를 얻게 됩니다. 237국가 5천 종족 살리는 중직자로서 237 달란트를 얻는 것이 목표입니다.</p>
            <p class="ps-2 mt-1 small text-secondary text-pretty">자세한 내용은 우측상단 [메뉴 → 참여방법] 을 참고해주세요.</p>
        </div>

        <div class="col-12">
            <p class="fw-bold">중직자PASS를 시작하며</p>
            <p class="ps-2">각 카테고리별 세부 훈련 내용은 새로 만든 것들이 아닙니다. 하나님이 이미 교회라는 공동체 안에 축복으로 주신 것들입니다. 이 훈련 프로그램을 통해 예일 청년들이 교회 공동체 안에 하나님이 주신 축복들을 마음껏 찾아 누리며, 이 시대 최고 축복 중의 축복인 '중직자'로 세워지길 소망합니다.</p>
            <p class="text-center mt-3">청년국 미래분과 중직자팀 드림</p>
        </div>
    </div>

</PageContainer>

<style lang="scss">
li {
    font-size: 0.95rem;
}

#what-is-layleaderpass {
    width: 100%;
    max-width: 30rem;
    margin: 0 auto;
}
</style>

