<!-- UserContact.svelte -->

<script lang="ts">
    import { loadBootstrap } from "$lib/script/lib/loadClientModule";
    import { loadingStore } from "$lib/stores/loadingStore";
    import axios from "axios";
    import { Tooltip } from "bootstrap";
    import { onDestroy, onMount } from "svelte";

    export let style: string = '';

    export let email: string;

    let element: HTMLElement;
    let toolTip: Tooltip;
    let tooltipMessage: string | null = null;

    export let buttonMessage: string | undefined = undefined

    onMount(async () => {
        const bootstrap = await loadBootstrap();
        toolTip = bootstrap.Tooltip.getOrCreateInstance(element);
    });

    onDestroy(() => {
        if (toolTip){
            toolTip.disable();
            toolTip.hide();
            
            setTimeout(() => {  //사라지는 애니메이션이 끝날 시간을 줘야 오류안남
                toolTip.dispose();    
            }, 250);
        } 
    });

    async function fetchUserContact() {
        try {
            loadingStore.show();

            if (email !== 'SYSTEM' && !tooltipMessage) {
                const response = await axios.get('/api/user/contact?id=' + email);
                const user = response.data;

                tooltipMessage = `${user.email}${(user.name && user.phone) ? ` (${user.name}, 연락처: ${user.phone})` : ''}`;
                
                element.setAttribute('data-bs-original-title', tooltipMessage);
                toolTip.show();
            }    

        } catch (error) {
            console.error('사용자 연락처 불러오기 실패', error)
        } finally {
            loadingStore.hide();
        }
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<span class="{style ? '' : 'btn btn-sm btn-light'} text-truncate" {style} bind:this={element} on:click={fetchUserContact}>
    {buttonMessage || email}
</span>

<style lang="scss">
    /* 스타일 정의 */
</style>
