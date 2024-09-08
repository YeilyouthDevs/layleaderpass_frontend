<script lang="ts">
	import { goto } from "$app/navigation";
	import PageContainer from "$lib/components/PageContainer.svelte";


</script>

<PageContainer title="관리자 메뉴">
    <div class="row g-2 mt-2">
        <div class="col-12">
            <button class="btn btn-secondary btn-height w-100" on:click={() => goto('/adminMenu/submissionManage')}>자료제출 관리</button>
        </div>
        <!-- <div class="col-12">
            <button class="btn btn-secondary btn-height w-100" on:click={() => goto('/adminMenu/talentAssignmentManage')}>달란트 지급 관리</button>
        </div> -->
        <div class="col-12">
            <button class="btn btn-secondary btn-height w-100" on:click={() => goto('/adminMenu/trainingTypeManage')}>훈련타입 관리</button>
        </div>
        <div class="col-12">
            <button class="btn btn-secondary btn-height w-100" on:click={() => goto('/adminMenu/registerAccept')}>회원가입 승인/거절</button>
        </div>
        <div class="col-12">
            <button class="btn btn-secondary btn-height w-100" on:click={() => goto('/adminMenu/accountManage')}>계정 관리</button>
        </div>
        <div class="col-12">
            <button class="btn btn-secondary btn-height w-100" on:click={() => goto('/adminMenu/seasonManage')}>시즌 관리</button>
        </div>
        <div class="col-12">
            <button class="btn btn-secondary btn-height w-100" on:click={() => goto('/adminMenu/adminLog')}>관리자로그 보기</button>
        </div>
    </div>
</PageContainer>

<style lang="scss">
    
</style>

