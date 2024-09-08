<script lang="ts">
    export let noWrap = false;

    export let clazz = '';
    export let style = '';
</script>

{#if noWrap}
    <div class="small text-secondary d-flex align-items-center gap-1 {clazz}" style={style}>
        <img class="check-icon" src="/images/simple_desc_check.png" alt="체크아이콘"><slot/>
    </div>
{:else}
    <div class="border rounded p-1 {clazz}" style={style}>
        <p class="small text-secondary">
            <img class="check-icon me-1" style="margin-bottom: 0.15rem;" src="/images/simple_desc_check.png" alt="체크아이콘"><slot/>
        </p>
    </div>        
{/if}

<style lang="scss">
.check-icon {
    width: 1.1rem;
    height: 1.1rem;
    opacity: 0.8;
}
</style>


