<script lang="ts">
    import { loadBootstrap } from "$lib/script/lib/loadClientModule";
    import type { Modal } from "bootstrap";
    import { onDestroy, onMount, tick } from "svelte";
    import { v4 } from "uuid";

    export let title: string = '';
    export let footerSlot:boolean = false;
    export let id:string = v4();
    export let bodyClass:string = 'p-2';
    export let contentClass:string = '';
    export let fullscreen:boolean = false;
    export let noFooter:boolean = false;
    export let noHeader:boolean = false;
    export let backdrop:boolean | 'static' = 'static';
    export let scrollable: boolean = true;
    export let fade: boolean = true;
    export let onShow: Function | null  = null;
    export let onHide: Function | null = null;
    export let alwaysRender: boolean = false;

    let modalInst: Modal;
    let modalBind: HTMLDivElement;
    let showState: boolean = false;
    let opacity: string = '1';
    let backdropElement: HTMLElement | null = null;

    onMount(async () => {
        const bootstrap = await loadBootstrap();

        await tick();

        modalInst = new bootstrap.Modal(modalBind);
    });

    onDestroy(() => {
        if (modalInst) modalInst.hide();
    });

    export async function show() {
        if(modalInst){
            if (onShow) onShow();
            showState = true;
            modalInst.show();

            // 모달이 표시된 후에 backdrop 요소를 찾아내기
            await tick(); // DOM이 업데이트된 후 실행되도록 보장
            backdropElement = document.querySelector('body > .modal-backdrop:last-child');

            if (fade) await new Promise(resolve => setTimeout(() => resolve(null), 350));
        } 
    }

    export async function hide() {
        if(modalInst) {
            modalInst.hide();
            showState = false;
            if (onHide) onHide();

            if (fade) await new Promise(resolve => setTimeout(() => resolve(null), 350));
        } 
    }

    export function invisible() {
        opacity = '0';
        if (backdropElement) {
            backdropElement.style.opacity = '0';
        }
    }

    export function visible() {
        opacity = '1';
        if (backdropElement) {
            backdropElement.style.opacity = '0.5';
        }
    }


    /*
        <div slot="footer" class="modal-footer">
            <button type="button" class="btn btn-secondary btn-height w-100" data-bs-dismiss="modal"
                on:click={() => {}}>커스텀 푸터 버튼 예시</button>
        </div>
    */

</script>


     
<div bind:this={modalBind} {id} class="modal {fade ? 'fade' : ''}" data-bs-backdrop={backdrop} data-bs-keyboard="false" tabindex="-1"  style="opacity: {opacity};">
    
    <div class="modal-dialog modal-dialog-centered {scrollable ? 'modal-dialog-scrollable' : ''} {fullscreen ? 'modal-fullscreen' : ''}">
    <div class="modal-content {contentClass}">
        <!-- 강제 포커스 방해를 없애기 위한 더미요소 -->
        <input type="text" style="position: absolute; top: -9999px; left: -9999px;" readonly>

        {#if alwaysRender || showState}

            {#if !noHeader}
            <div class="modal-header p-0">
                {#if title}
                    <h1 class="modal-title fs-5 user-select-none p-3">{title}</h1>
                {:else}
                    <slot name="header"/>
                {/if}
            </div>
            {/if}
            <div class="modal-body {bodyClass}">
                <slot />
            </div>
            {#if !noFooter}
                {#if footerSlot}
                <div class="modal-footer px-1">
                    <slot name="footer"/>
                </div>
                {:else}
                <div class="modal-footer px-1">
                    <button type="button" class="btn btn-secondary btn-height w-100" on:click={hide}>닫기</button>
                </div>
                {/if}     
            {/if}
        
        {/if}
    </div>
    </div>
</div>

<style lang="scss">


</style>