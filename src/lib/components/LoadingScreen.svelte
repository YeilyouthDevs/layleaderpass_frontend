<script>
	import { loadingStore } from "$lib/stores/loadingStore";
	import { fade } from "svelte/transition";
</script>

{#if $loadingStore.state}
<div id="background" class="fixed-top top-0 w-100 h-100 d-flex justify-content-center align-items-center"
    transition:fade={{ duration:100 }}
>

    <div class="spinner-grow text-light" role="status">
    </div>

    <div class="spinner-grow text-light" role="status">
    </div>

    <div class="spinner-grow text-light" role="status">
    </div>

</div>
{/if}

<style lang="scss">
    #background {
        background-color: rgba(0, 0, 0, 0.5);
        z-index: var(--z-orders-loading);
    }

    .spinner-grow {
        margin: 0 0.5rem;
    }
</style>