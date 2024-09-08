<script lang="ts">
    export let style:string  = '';
    export let clazz:string  = '';
</script>

<div class="d-flex flex-column gap-2 px-2 py-3 sgrid-card {clazz}" style={style}>
    <slot></slot>
</div>

<style lang="scss">
    .sgrid-card {
        border: 2px solid rgb(204, 204, 204);
        border-radius: 0.5rem;
    }
</style>