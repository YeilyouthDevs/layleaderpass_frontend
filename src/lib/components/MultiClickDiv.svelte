<script lang="ts">
	import { alertStore } from "$lib/stores/alertStore";
	import { onMount } from "svelte";

    // Props
    export let callback: CallableFunction = async () => {};
    export let clickCount = 3;
    export let timeLimit = 1000;
    export let indicatorPosition = 'top: -5px; left: -5px;';
    export let beforeExecute: CallableFunction = () => true;

    export let clazz = '';
    export let style = '';

    let clicks = 0;
    let timer: number | null = null;

    function handleClick() {
        if (clicks >= clickCount) return;

        clicks += 1;

        if (timer) {
            clearTimeout(timer);
        }

        timer = setTimeout(() => {
            clicks = 0;
            alertStore.warn({
                content: `실행하려면 ${clickCount}번 연속으로 눌러주세요.`,
                duration: 1500,
            })
        }, timeLimit) as unknown as number;

        if (clicks >= clickCount) {
            clearTimeout(timer as number);
            callback();
            setTimeout(() => {
                clicks = 0;    
            }, 250);
        }
    }

    onMount(() => {
        return () => {
            if (timer) {
                clearTimeout(timer); // 컴포넌트가 언마운트될 때 타이머 정리
            }
        };
    });
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div>
    <div class="wrap {clazz}" style="{style}" on:click={() => { if(beforeExecute()) handleClick() }}>
        <slot></slot> 
        {#if clickCount > 1}
        <div class="indicator"
            class:indicator-pending={clicks > 0}
            class:indicator-operating={clicks >= clickCount}
            style="{indicatorPosition}">{(clicks == 0)? clickCount : clicks}</div>     
        {/if}
    </div>
</div>

<style lang="scss">
    .wrap {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .indicator {
        position: absolute;
        width: 1.7rem;
        height: 1.7rem;
        background-color: white;
        font-weight: bold;
        color: rgb(121, 121, 121);
        text-align: center;
        line-height: 1.2rem;
        border: 4px solid rgb(175, 175, 175);
        border-radius: 100%;
    }

    .indicator-pending {
        border-color: rgb(119, 216, 216);
        color: rgb(59, 59, 59);
    }

    .indicator-operating {
        border-color: rgb(248, 123, 65);
    }
</style>
