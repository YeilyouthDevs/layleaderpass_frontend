<script lang="ts">
	import FileManager from "$lib/components/FileManager/FileManager.svelte";
	import FileSender from "$lib/components/FileManager/FileSender";
	import PageContainer from "$lib/components/PageContainer.svelte";
	import { alertStore } from '$lib/stores/alertStore';
	import { credentialStore } from "$lib/stores/credentialStore";
	import { loadingStore } from "$lib/stores/loadingStore";
	import { onMount } from "svelte";
	import { fly } from 'svelte/transition';

    onMount(() => {
        loadingStore.showRightNow();
    })

    let fileManager: FileManager;
    const fileSetId = -1;

    // 개발자 계정만 파일을 수정할수있음. 백엔드에서 다시 검증함
    let developerEmail = 'layleaderpass.devs@gmail.com';

    async function editFiles() {
        const result = await FileSender.send('/api/static/uploadByDevs', fileSetId, fileManager.getFiles(), { })
        
        if (result.status) {
            alertStore.success({
                title: '첨부파일 수정 완료',
                content: result.message!,
                duration: 3000
            });
        } else {
            alertStore.fail({
                title: '첨부파일 수정 실패',
                content: result.message!,
                duration: 3000
            });
        }
    }

</script>

<PageContainer title="참여방법">

    <div class="row gx-0 gy-3 mt-0 mb-5 mx-1" transition:fly={{ y: 20, duration: 400 }}>
        <div class="col-12">
            <FileManager bind:this={fileManager} editMode={$credentialStore.email===developerEmail} hideImage={$credentialStore.email!==developerEmail} fileSetId={fileSetId} maxFileCount={null} />
            {#if $credentialStore.email === developerEmail}
            <button class="btn btn-primary btn-height w-100 mt-2" on:click={() => editFiles()}>첨부파일 수정</button>     
            {/if}
        </div>
        <div class="col-12">
            <hr class="my-1">
        </div>
        <div class="col-12">
            <p>1. 가입 완료 후 각 카테고리별로 배정된 훈련들을 보면, 훈련 PASS 방법과 달란트 획득 내용이 있습니다.</p>
            <p class="mt-2 small text-secondary text-pretty">[메뉴<span style="font-size: 0.75rem;">(우측상단 줄 3개 버튼)</span> → 훈련 → 훈련 이름 클릭] 또는 첨부한 <b style="text-decoration: underline;">중직자PASS표</b> 참고.</p>
        </div>

        <div class="col-12">
            <p>2. 달란트 지급방식</p>
            <div class="row gx-0 gy-2">
                <div class="col-12">
                    <p class="ps-2">1) 자동 달란트 반영</p>
                    <p class="ps-4">예배 출석, 교사 헌신 등 중직자팀에서 파악해 달란트를 반영할 수 있는 것은 자동 반영을 하지만, 혹시 누락 된 것이 있다면 개인이 문의해야하며 문의하지 않아 반영되지 못한 것은 개인 과실로 중직자팀의 책임이 아닙니다.</p>
                    <p class="ps-4 mt-1 small text-secondary text-pretty">지급 내역은 [메뉴 → 홈 → 내 달란트 지급내역] 에서 확인할 수 있습니다.</p>
                </div>
                <div class="col-12">
                    <p class="ps-2">2) 개인 인증 반영</p>
                    <p class="ps-4">수련회, 전도학교, 지교회 등 개인 인증 반영 훈련들은 본인 얼굴이 포함된 단체 사진, 개인 셀카를 제출하는 것을 원칙으로 하며 제출 가능한 사진이 없을 시 각 훈련 담당 교역자의 사인을 받아 제출해 개인 인증하도록 합니다. 역시 누락된 것이 있다면 개인이 문의해야 합니다.</p>
                </div>
                <div class="col-12">
                    <p class="ps-4 mt-1 text-pretty">* 달란트 지급 기간 : 중직자PASS타임 일주일 전 자정까지 획득 달란트가 반영됩니다.</p>
                </div>
            </div>
        </div>

        <div class="col-12">
            <p>3. 개인 인증 방법</p>
            <div class="row gx-0 gy-1">
                <div class="col-12">
                    <p class="ps-2">1) 자기 얼굴이 포함된 단체 사진, 개인 셀카를 중직자PASS UI에 업로드</p>
                </div>
                <div class="col-12">
                    <p class="ps-2">2) 훈련 참여 확인서에 각 담당 훈련 교역자 사인을 받아 중직자PASS UI에 업로드</p>
                </div>
            </div>
        </div>

        <div class="col-12">
            <p>4. 중직자PASS 훈련 기간</p>
            <p class="ps-2">☞ 기수당 훈련 기간은 2년으로 운영되며, 1기수가 끝나면 달란트는 0(초기화)이 됩니다.</p>
        </div>

        <div class="col-12">
            <p>5. 중직자PASS 필수 훈련</p>
            <div class="row gx-0 gy-1">
                <div class="col-12">
                    <p class="ps-2">1) 청년국 예배</p>
                </div>
                <div class="col-12">
                    <p class="ps-2">2) 중직자대학원</p>
                </div>
            </div>
            <p class="ps-2 my-1 small text-danger text-pretty">※ 237 달란트를 달성하더라도 위 두 개의 필수 훈련을 PASS하지 못하면 ‘중직자PASS 수료패’ 증정과 ‘청년국 단기선교 참가비’ 지원 대상에서 제외됩니다.</p>
        </div>

        <div class="col-12">
            <p>6. 훈련 참여 동기부여를 위한 시상식</p>
            <p class="ps-2 my-1 small text-secondary text-pretty">증정품은 중직자PASS타임 때 시상함</p>
            <div class="row gx-0 gy-2">
                <div class="col-12">
                    <p class="ps-2">1) 70 달란트 획득 시 도서 증정</p>
                    <p class="ps-4">☞ 세상 살리는 지혜를 위한 추천 도서(담임목사님, 담당교역자, 국장님, 부국장님 중 랜덤)가 간단한 축하 문구와 함께 증정됩니다.</p>
                </div>
                <div class="col-12">
                    <p class="ps-2">2) 150 달란트 획득 시 신발 증정</p>
                    <p class="ps-4">☞ 세계복음화를 위해 성실하게 뛸 신발(5만원 상당의 신발 구매금액 지원)이 증정됩니다.</p>
                </div>
                <div class="col-12">
                    <p class="ps-2">3) 237 달란트 획득 시 중직자PASS 수료패 증정, 청년국 단기선교 참가비 일부 지원</p>
                    <p class="ps-4">☞ 중직자PASS 훈련 프로그램의 최종 목표인 237 달란트 달성 시 ‘중직자PASS 수료패’ 증정과 세계복음화를 가장 잘 느끼며 마음 담을 수 있는 ‘청년국 단기선교 참가비’ 일부(30만원)를 지원합니다.</p>
                </div>
            </div>
        </div>

        <div class="col-12">
            <p>* 문의 미래분과 중직자팀(서지아 팀장)</p>
        </div>
    </div>

</PageContainer>



<style lang="scss">

</style>

