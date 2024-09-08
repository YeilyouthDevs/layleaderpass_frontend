<script lang="ts">
    import { onMount } from "svelte";
    import SimpleDesc from './SimpleDesc.svelte';

    export let clazz = '';
    export let style = '';
    export let defaultHeight = '8rem';
    export let useExpand = true;
    
    let expanded = !useExpand;
    let contentElement: HTMLDivElement;

    export let trainingType: {
        name: string;
        desc: string;
        minTalent: number;
        maxTalent: number;
    };

    function nl2br(str: string) {
        if (!str) return '';

        const escapedStr = str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return escapedStr.replace(/\n/g, '<br>');
    }

    function toggleExpand() {
        expanded = !expanded;
        if (expanded) {
            contentElement.style.maxHeight = `${contentElement.scrollHeight}px`;
        } else {
            contentElement.style.maxHeight = defaultHeight;
        }
    }

    onMount(() => {
        if (useExpand) {
            contentElement.style.maxHeight = defaultHeight;
        }
    });
</script>

<div class='border rounded p-1 {clazz}' style="{style}">
    {#if trainingType}
        <SimpleDesc clazz="text-black fs-6 p-1" noWrap>{trainingType.name}</SimpleDesc>
        <div bind:this={contentElement} class:use-expand={useExpand} class:not-use-expand={!useExpand}
        >
            <hr class="m-0">
            <div class="small p-1">
                <div class="d-flex gap-2">
                    <p class="fw-bold">필수 획득</p>
                    {#if trainingType.minTalent}
                        <p>{trainingType.minTalent}</p>
                    {:else}
                        <p class="text-secondary">없음</p>
                    {/if}
                </div>
                <div class="d-flex gap-2">
                    <p class="fw-bold">최대 획득</p>
                    {#if trainingType.maxTalent}
                        <p>{trainingType.maxTalent}</p>
                    {:else}
                        <p class="text-secondary">없음</p>
                    {/if}
                </div>

                <p class="p-1 w-100 {trainingType.desc ? '' : 'text-secondary'}">{@html nl2br(trainingType.desc) || '설명 없음'}</p>
            </div>
            
        </div>
    {:else}
        <p class="text-center small text-secondary">삭제된 훈련타입입니다.</p>
    {/if}
</div>

{#if useExpand}
<button class="btn btn-light w-100 btn-sm" on:click={toggleExpand}>
    {expanded ? '▲' : '전체보기'}
</button>
{/if}

<style lang="scss">
    .use-expand {
        overflow: hidden;
        transition: max-height 0.3s ease-in-out;
    }
    
    .not-use-expand {
        height: auto;
    }

</style>
