

<script lang="ts">
	import { alertStore } from '$lib/stores/alertStore';
	import { fly } from 'svelte/transition';

    let show: boolean;
    let title: string;
    let content: string;
    let type: string;
    let progress: number;

    alertStore.subscribe(value => {
        ({ show, title, content, type, progress } = value);
    });

</script>

<svg xmlns="httprt-www.w3.org/2000/svg" class="d-none">
    <symbol id="success-icon" viewBox="0 0 16 16">
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
    </symbol>
    <symbol id="info-icon" viewBox="0 0 16 16">
        <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
    </symbol>
    <symbol id="warn-icon" viewBox="0 0 16 16">
        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
        </symbol>
    <symbol id="fail-icon" viewBox="0 0 16 16">
        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
    </symbol>
    <symbol id="error-icon" viewBox="0 0 16 16">
        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
    </symbol>
</svg>


<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->

{#if show}
<div class="alert-wrap" on:click={alertStore.pauseProgress} transition:fly={{y: -50, duration: 400}}>
    <div class="alert"
    class:alert-light={type==='info'}
    class:alert-secondary={type==='error'}
    class:alert-success={type==='success'}
    class:alert-warning={type==='warn'}
    class:alert-danger={type==='fail'}
    role="alert">
        <div class="content-wrap d-flex align-items-center">

            <svg class="bi me-2" role="img" ><use xlink:href="#{type}-icon"/></svg>
            <div class="flex-grow-1 pt-1">

                <!-- 타이틀과 내용 -->
                {#if title.length > 0 }
                <p class="fw-bold" style="font-size: 1.05rem;">{title}</p>
                {/if}
                <p class="pb-1" style="font-size: 0.95rem;">{content}</p>

                <!-- 일시정지 안내 -->
                {#if progress > 0}
                    <p class="text-center" style="font-size: 0.7rem; opacity: 0.6;"
                    >눌러서 타이머 정지</p>
                {/if}
            </div>
            
            <!-- 닫기버튼 -->
            <div class="close-btn d-flex align-items-center ms-1 me-2" on:click={alertStore.close} >
                <img class="img-fluid" src="/images/close_icon.png" alt="">
            </div>
        </div>
        
        <!-- 프로그레스 바 표시 -->
        {#if progress > 0}
        <div class="progressBarWrap">
            <div class="progressBar" style="width: {progress}%;"></div>
        </div>
        {/if}
        
    </div>
</div>
{/if}

<style lang="scss">
    .progressBarWrap{
        width: 100%;
        height: 0.175rem;
        background-color: rgb(194, 194, 194);
    }

    .progressBar{
        height: 100%;
        background-color: rgb(143, 143, 143);
    }

    svg {
        width: 1.75rem;
        height: 1.75rem;
        min-width: 1.75rem;
    }

    .alert {
        margin: 0;
        font-size: 1rem;
        padding: 0;
        overflow: hidden;
    }

    .alert-light {
        background-color: rgba(197, 229, 255);
        color: black;
    }

    .content-wrap {
        min-height: 3rem;
        padding: 0.25rem 0.5rem;
    }


    .alert-wrap {
        position: fixed !important;
        top: 0.25rem;
        left: 0.25rem;
        width: calc(100% - 0.5rem);
        z-index: var(--z-orders-alert);
        opacity: 0.9;
    }

    //sm 사이즈
    @media (min-width: 576px) { 
        .alert-wrap {
            left: calc(25%);
            width: 50%;
        }
    }

    .close-btn {
        width: 1.3rem;
        height: 1.3rem;
        opacity: 0.4;
        min-width: 1.3rem;
    }

</style>
