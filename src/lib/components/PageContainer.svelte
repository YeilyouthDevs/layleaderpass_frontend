<script lang="ts">
	import { onMount } from "svelte";
	import { fly } from "svelte/transition";

    export let element: HTMLDivElement | null = null;
    export let title: string | null = null;

    export let fluid: boolean = true;

    let show = false;

    onMount(() => {
        setTimeout(() => {
            show = true;
        }, 5);
    })
</script>

{#if title}
    <p class="fs-4 fw-bold border-bottom border-secondary mx-2 pt-2 pe-4 text-secondary">{title}</p>
{/if}

{#if show}
<div class="position-relative container{fluid ? '-fluid': ''} g-0 px-2" bind:this={element} transition:fly={{ y: 20, duration: 1000}}>
    <slot></slot>
</div>     
{/if}
