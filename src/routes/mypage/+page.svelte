<script lang="ts">
	import { goto } from '$app/navigation';
	import PageContainer from "$lib/components/PageContainer.svelte";

</script>

<PageContainer title="마이페이지">

        <div class="row g-2 mt-2">
            <div class="col-12">
                <button class="btn btn-secondary btn-height w-100" on:click={() => goto('/mypage/editUser')}>사용자 정보 수정</button>
            </div>
            <div class="col-12">
                <button class="btn btn-secondary btn-height w-100" on:click={() => goto('/mypage/logoutOtherSessions')}>다른기기 모두 로그아웃</button>
            </div>
            <div class="col-12">
                <button class="btn btn-secondary btn-height w-100" on:click={() => goto('/mypage/leaveOut')} >회원 탈퇴</button>
            </div>
        </div>

</PageContainer>


<style lang="scss">
    
</style>

