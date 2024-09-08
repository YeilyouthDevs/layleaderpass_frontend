<!-- GraphElement.svelte -->

<script lang="ts">
	import { createEventDispatcher, onMount } from "svelte";
	import { cubicInOut } from "svelte/easing";
	import { tweened } from "svelte/motion";

    export let label: string;
    export let value: number;
    export let maxValue: number;
    export let duration: number;
    export let clazz: string | undefined = undefined;
    

    let percent = (value * 0.9 / maxValue) * 100;
    let progress = tweened(0, {
        duration: duration * 150,
        easing: cubicInOut
    });

    onMount(() => {
        progress.set(percent);
    });

    const dispatch = createEventDispatcher();
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class={clazz} on:click={() => dispatch('click')}>
    <div class="progress-bar-container">
        <div class="label">{label}</div>
        <div class="progress-bar">
            <div class="progress" style="width: {$progress}%">
                <span class="value">{value}</span>
            </div>
        </div>
    </div>
</div>

<style lang="scss">
    .progress-bar-container {
        width: 100%;
        margin: 5px 0;
        position: relative; /* 라벨을 절대 위치로 이동시키기 위해 부모 컨테이너를 상대 위치로 설정 */
    }
    .progress-bar {
        background-color: #e0e0e0;
        border-radius: 5px;
        overflow: hidden;
        height: 40px;
        position: relative;
    }
    .progress {
        height: 100%;
        background-color: #94dff0;
        display: flex;
        align-items: center;
        transition: width 1s cubic-bezier(0.25, 0.1, 0.25, 1);
        padding-left: 10px;
        white-space: nowrap;
    }
    .label {
        position: absolute;
        left: 10px;
        top: 50%;
        z-index: 1;
        transform: translateY(-50%);
        color: rgb(32, 32, 32);
        font-weight: bold;
        font-size: 0.91rem;
    }
    .value {
        position: absolute;
        right: 10px;
        color: rgb(49, 49, 49);
        font-weight: bold;
    }
</style>

