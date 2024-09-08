<script lang="ts">
	import { goto } from "$app/navigation";
	import PageContainer from "$lib/components/PageContainer.svelte";
	import { credentialStore } from "$lib/stores/credentialStore";
	import { headerStore } from "$lib/stores/headerStore";
	import { onDestroy, onMount } from "svelte";

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

</script>

{#if !$credentialStore.email}

<PageContainer title="홈">
    <div class="row g-2 mt-2">
        <div class="col-12">
            <button class="btn btn-secondary btn-height w-100" on:click={() => goto('/login')}>로그인</button>
        </div>
        <div class="col-12">
            <button class="btn btn-secondary btn-height w-100" on:click={() => goto('/register')}>회원가입</button>
        </div>
        <div class="col-12">
            <button class="btn btn-secondary btn-height w-100" on:click={() => goto('/findAccount')}>계정 찾기</button>
        </div>
    </div>
</PageContainer>

{/if}

<style lang="scss">

</style>
