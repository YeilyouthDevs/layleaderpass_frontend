<script lang="ts">
	import PageContainer from "$lib/components/PageContainer.svelte";
	import { alertStore } from "$lib/stores/alertStore";
	import { credentialStore } from "$lib/stores/credentialStore";
	import axios from "axios";
	import { onMount } from "svelte";

    const developerEmail = import.meta.env.VITE_DEVELOPER_EMAIL;

    onMount(() => {
        if ($credentialStore.email !== developerEmail) {
            alertStore.fail({
                content: '접근 권한이 없습니다.',
                duration: 2000
            })

            window.history.back();
        } 
    })

    async function execute(method: CallableFunction) {
        try {
            const result = await method();
            console.log(result);

            alertStore.success({
                title: '실행 완료',
                content: result?.data,
                duration: 2000
            })
        } catch (error) {
            console.error(error)

            alertStore.success({
                title: '오류 발생',
                content: (error as any).response?.data,
                duration: 2000
            })
        }
    }

    // async function syncTalent() {
    //     return await axios.get('/api/developer/syncTalent')
    // }

    // async function clearAlienFileSet() {
    //     return await axios.get('/api/developer/clearAlienFileSet')
    // }

</script>

<PageContainer title="개발자 메뉴">
    {#if developerEmail}
        <div class="row g-2 mt-2">
            <!-- <div class="col-12">
                <button class="btn btn-secondary btn-height w-100" on:click={() => execute(syncTalent)}>달란트 동기화</button>
            </div> -->
            <!-- <div class="col-12">
                <button class="btn btn-secondary btn-height w-100" on:click={() => execute(clearAlienFileSet)}>외계파일셋 제거</button>
            </div> -->
        </div>
    {/if}
</PageContainer>

<style lang="scss">
    
</style>

