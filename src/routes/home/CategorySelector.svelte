<script lang="ts">
	import FormField from "$lib/components/FormField.svelte";
	
	let categorySelect: HTMLSelectElement;

    export let categoryId: any = undefined;
    export let fetchPayload: any;
    export let afterCallback: CallableFunction | undefined = undefined;
    export let clazz = '';
    export let style = '';

    if (categoryId) {
        fetchPayload['categoryId'] = categoryId;
    }

</script>

<FormField floating noEditMark {clazz} {style}>
    <select id="category" name="카테고리" class="form-select" on:change={async () => { 
        const currentCategoryId = +categorySelect.value;
        if (currentCategoryId) fetchPayload['categoryId'] = currentCategoryId
        else delete fetchPayload['categoryId']

        await afterCallback?.();
    }} bind:this={categorySelect} bind:value={categoryId}>
            <option value="0">전체</option>
            <option value="1">복음가진 중직자</option>
            <option value="2">전도하는 중직자</option>
            <option value="3">선교하는 중직자</option>
            <option value="4">후대 세우는 중직자</option>
            <option value="5">교회 세우는 중직자</option>
        </select>
    </FormField>

<style lang="scss">
</style>