<script lang="ts">
	import Modal from "./Modal.svelte";
	import MultiClickDiv from "./MultiClickDiv.svelte";

    let modal: Modal;

    interface Args {
        userEmail: string;
        trainingIds: number[];
    }
    
    export let args: Args | undefined = undefined;

    export function open() {
        modal?.show();
    }

    export function close() {
        modal?.hide();
    }

</script>

<Modal title="사용자 기준 지급" footerSlot bind:this={modal}>

    test

    <div slot="footer" class="row g-1 w-100">
        <div class="col-6">
            <MultiClickDiv callback={() => {console.log('click')}} clazz="btn btn-primary w-100 btn-height">지급</MultiClickDiv>
        </div>
        <div class="col-6">
            <button class="btn btn-secondary w-100 btn-height" on:click={modal.hide}>닫기</button>
        </div>
    </div>

</Modal>


<style lang="scss">

</style>