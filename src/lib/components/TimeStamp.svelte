<!-- TimeStamp.svelte -->

<script lang="ts">
	import { formatDatetime } from "$lib/script/lib/formatDatetime";
	import UserContact from "./UserContact.svelte";

    export let createdAt: string | Date | undefined = undefined;
    export let createdBy: string | undefined = undefined;
    export let updatedAt: string | undefined = undefined;
    export let updatedBy: string | undefined = undefined;

    export let createdByLabel = '작성자';
    export let createdAtLabel = '최초작성';
    export let updatedByLabel = '작업자';
    export let updatedAtLabel = '최종작업';
 
</script>

<div class="d-flex flex-column gap-1 border-top border-bottom px-1 py-2 small text-secondary">
    {#if createdBy}
    <div class="d-flex align-items-center gap-2">
        <p class="field">{createdByLabel}:</p><UserContact email={createdBy} />
    </div>
    {/if}

    {#if createdAt}
    <div class="d-flex align-items-center gap-2">
        <p class="field">{createdAtLabel}:</p><span>{formatDatetime(createdAt, { includeSeconds: false })}</span>
    </div>
    {/if}

    {#if updatedBy}
    <div class="d-flex align-items-center gap-2">
        <p class="field">{updatedByLabel}:</p><UserContact email={updatedBy} />
    </div>
    {/if}

    {#if updatedAt}
    <div class="d-flex align-items-center gap-2">
        <p class="field">{updatedAtLabel}:</p><span>{formatDatetime(updatedAt, { includeSeconds: false })}</span>
    </div>
    {/if}


</div>

<style>
    .field {
        text-wrap: nowrap;
    }
</style>

