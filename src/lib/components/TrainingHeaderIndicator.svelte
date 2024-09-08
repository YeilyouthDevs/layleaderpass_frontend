<script lang="ts">
	import { formatDatetime } from "$lib/script/lib/formatDatetime";
	
    export let clazz = '';
    export let style = '';

    export let trainingHeader: {
        title: string;
        startAt: string;   
        endAt: string;
    };

</script>



<div class='{clazz}' style="{style}">

    {#if trainingHeader}
    <div class="text-center">
        <p class="fs-5">{trainingHeader.title}</p>
        <p class="text-balance small text-secondary">
            {#if !trainingHeader.startAt && !trainingHeader.endAt}
                기한 없음
            {:else}
                {formatDatetime(trainingHeader.startAt, { includeSeconds: false })} ~ {formatDatetime(trainingHeader.endAt, { includeSeconds: false })}
            {/if}
        </p>
        
    </div>
    
    {:else}
    <p class="text-center small text-secondary border rounded">훈련정보를 불러올 수 없습니다.</p>
    {/if}
</div>

<style lang="scss">

</style>

