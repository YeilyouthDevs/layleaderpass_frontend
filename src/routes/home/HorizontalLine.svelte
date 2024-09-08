<!-- HorizontalLine.svelte -->

<script lang="ts">
	
    export let maxValue: number;
    export let ticks: number[] = []; // 눈금을 위한 배열
    export let value: number; // 현재 값을 표시하기 위한 값
    export let flagImage: string = ""; // 깃발 이미지 URL
    export let clazz: string | undefined = undefined;

    // maxValue가 0이 아닌 경우에만 percent 계산
    let percent: number;
    $: if (maxValue && value) percent = maxValue ? (Math.min((value * 100) / maxValue)) : 0;
</script>

<div class={clazz}>
    <div class="horizontal-line-container">
        <!-- <div class="line"></div> -->
        <!-- 윗 라벨 -->
        {#each ticks as tick}
            <div class="tick" style="left: {(tick * 100) / maxValue}%;">
                <span class="tick-label" class:gift-label={tick !== 0}>
                    {#if tick !== 0}
                        <img src="/images/present_icon.png" alt="선물">
                    {/if}
                    {tick}
                </span>
            </div>
        {/each}
        <!-- 아래 라벨 -->
        <div class="tick" style="left: {percent}%;"> 
            <span class="tick-label current-value fw-bold">{value}</span>
        </div>
        <div class="running-kid" style="left: {percent}%; transform: translateX(-50%) translateY(-50%);" >
            <img src={flagImage} alt="달리는 소년"/>
        </div>
        <img src="/images/waving_flag.gif" class="flag" alt="깃발">
    </div>
</div>

<style lang="scss">
    .horizontal-line-container {
        display: flex;
        position: relative;
        width: 95%;
        height: 2px;
        background-color: black;
        margin: 0 auto;
        margin-top: 3rem;
        margin-bottom: 1rem;
    }
    .tick {
        position: absolute;
        height: 10px;
        width: 1px;
        background-color: black;
        bottom: -4px;
    }
    .tick-label {
        position: absolute;
        bottom: 2.3rem;
        transform: translateX(-50%);
        font-size: 0.75rem;
        display: flex;
        align-items: center;
        gap: 0.2rem; /* 숫자와 선물상자 사이의 간격을 조정할 수 있습니다 */

        img { 
            width: 1rem;
            height: 1rem;
        }        
    }
    .gift-label {
        transform: translateX(-75%);
    }
    .current-value {
        bottom: -1.15rem;
        color: rgb(230, 76, 76);
        transform: translateX(-50%);
    }
    .running-kid {
        position: absolute;
        bottom: -1.5rem;
        overflow: hidden;

        display: flex;
        justify-content: center;
        align-items: center;

        img {
            margin-left: 0.35rem;
            height: 2.5rem;
        }
    }

    .flag {
        position: absolute;
        height: 2.3rem;
        right: -1.79rem;
        top: -2.3rem;
    }
</style>
