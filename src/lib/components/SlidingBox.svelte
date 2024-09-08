<script lang="ts">
	import { onMount } from "svelte";

	
	
  export let show: boolean = false;
  export let clazz: string = '';
  export let style: string = '';

  let contentElement: HTMLElement;
  
  export async function open() {
    show = true;
    resize();
  }

  export function close() {
    show = false;
    resize();
  }

  export function resize() {
    if (contentElement) {

      if (show) {
        let heightSum = 0;

        for (const child of contentElement.children) {
          heightSum += child.scrollHeight;
        }

        contentElement.style.height = `${heightSum}px`;
      } else {
        contentElement.style.height = '0px';  
      }
    }
  }

  onMount(() => {
    if (show) open();
    else close();
  })

</script>

<style>
  .content {
    overflow: hidden;
    transition: height 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  }
</style>

<div bind:this={contentElement} class="content {clazz}" style="{style}">
  <slot></slot>
</div>