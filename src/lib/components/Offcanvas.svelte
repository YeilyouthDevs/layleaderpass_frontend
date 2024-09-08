<script lang="ts">
    import { loadBootstrap } from '$lib/script/lib/loadClientModule';
    import { Offcanvas } from 'bootstrap';
    import { onDestroy, onMount } from 'svelte';
    import { v4 } from 'uuid';
  
    export let id = v4();
    export let show = false;
    export let toggle = () => {};
    export let placement = "start";
    export let clazz = "";
    export let style = "";
    
    export let backdrop: boolean | 'static' = true;
  
    let offcanvasElement: HTMLDivElement;
    
    let offcanvasInstance: Offcanvas;
  
    function onShown(){
      if (!show && toggle) toggle();
    }
  
    function onHidden() {
      if (show && toggle) toggle();
    }
  
    onMount(async () => {
        const bootstrap = await loadBootstrap();
        // @ts-ignore
        offcanvasInstance = new bootstrap.Offcanvas(offcanvasElement, {
          backdrop
        });

        offcanvasElement.addEventListener('shown.bs.offcanvas', onShown);
        offcanvasElement.addEventListener('hidden.bs.offcanvas', onHidden);
    });
  
    onDestroy(() => {
      offcanvasElement.removeEventListener('shown.bs.offcanvas', onShown);
      offcanvasElement.removeEventListener('hidden.bs.offcanvas', onHidden);

      if(offcanvasInstance) offcanvasInstance.hide();
    })
  
    $: if (show) {
        if (offcanvasInstance) offcanvasInstance.show();
    } else if (offcanvasInstance) {
        if (offcanvasInstance) offcanvasInstance.hide();
    }
  </script>
  
  <div bind:this={offcanvasElement} class={`offcanvas offcanvas-${placement} ${clazz}`} style={style} {id}>
    <slot></slot>
  </div>
  
  <style lang="scss">
  
  </style>