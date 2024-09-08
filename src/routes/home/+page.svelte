<script lang="ts">
	import { goto } from "$app/navigation";
	import GridCard from "$lib/components/GridCard.svelte";
	import PageContainer from "$lib/components/PageContainer.svelte";
	import SimpleDesc from "$lib/components/SimpleDesc.svelte";
	import { alertStore } from "$lib/stores/alertStore";
	import { credentialStore, handleDeletedAccount } from "$lib/stores/credentialStore";
	import { headerStore } from "$lib/stores/headerStore";
	import { loadingStore } from "$lib/stores/loadingStore";
	import { UserRole, userStore, type UserData } from "$lib/stores/userStore";
	import axios from "axios";
	import { debounce } from "lodash-es";
	import { onDestroy, onMount } from "svelte";
	import { get } from "svelte/store";
	import DashBoard from "./DashBoard.svelte";

    onMount(() => {
        headerStore.update({
            backButton: false
        })
    })

    onDestroy(() => {
        headerStore.update({
            backButton: true
        })
    })

    const checkApproveResultDeb = debounce(async () => {
        try {
            loadingStore.showRightNow()
            const response = await axios.get('/api/register/checkAcceptState?email=' + get(credentialStore).email);

            const user = response.data as UserData & { deletedAt: Date, deleteConfirmAt: Date };

            if(handleDeletedAccount(user)) return;
            
            userStore.update({
                name: user.name,
                talent: user.talent,
                role: user.role
            })

            if(user.role !== UserRole.GUEST){
                alertStore.success({
                    content: '🎉 가입이 승인되었습니다!',
                    duration: 3000
                })

                goto('/home', { replaceState: true });
            } else {
                alertStore.info({
                    content: '아직 가입 승인을 기다리는 중입니다.',
                    duration: 3000
                })
            }
        } catch (error) {
            console.error(error)
        }

    }, 1000, {leading: true, trailing: false, maxWait: 2000})

</script>

<PageContainer title="홈 화면">

    {#if $userStore.role === UserRole.GUEST}

        <div class="row g-0 mt-2">

            <div class="col-12">
                <GridCard>
                        <div class="text-center">
                            <p class="fs-5 fw-bold">가입 승인 필요</p>
                            <p class="small">관리자의 승인을 기다리고 있습니다.<br>처리가 완료되면 알림메일을 발송하겠습니다.</p>
                        </div>
                        <div class="small text-secondary">
                            <ul class="m-0">
                                <li>회원가입 승인 시 약 5일 정도 시간이 소요될 수 있습니다.</li>
                                <li>일주일이 지나도 승인이 되지 않는다면 운영팀으로 문의 바랍니다.</li>
                                <li>예일 청년국 멤버가 아닐 경우 회원가입이 제한 될 수 있습니다.</li>
                            </ul>
                        </div>
                        <hr class="my-1">
                        <button class="btn btn-secondary btn-height" on:click={checkApproveResultDeb}>승인결과 확인하기</button>
                        <SimpleDesc>로그인 중 승인완료 이메일을 받았다면 위 버튼을 눌러 결과를 확인해주세요. 다른 방법으로는 로그아웃 후 다시 로그인해도 됩니다.</SimpleDesc>
                </GridCard>
            </div>
            
        </div>


    {:else if $userStore.role}
    <div class="row g-1 mt-2">
        <div class="col-12">
            <DashBoard />
        </div>
        <div class="col-12">
            <button class="btn btn-secondary btn-height w-100" on:click={() => goto('/home/myTalentAssignments')}>달란트 지급내역</button>
        </div>
        <div class="col-12">
            <button class="btn btn-secondary btn-height w-100" on:click={() => goto('/home/mySubmissionManage')}>자료제출 관리</button>
        </div>
    </div>

    {/if}

</PageContainer>



<style lang="scss">
    
</style>

