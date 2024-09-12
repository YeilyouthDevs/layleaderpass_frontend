<script lang="ts">
	import FormField from "$lib/components/FormField.svelte";
	import Modal from "$lib/components/Modal.svelte";
	import { Validation } from "$lib/script/lib/validation";
	import { notEmptyValidation } from "$lib/script/lib/validationSchemas";
	import axios from "axios";

    let modal: Modal;
    let formBind: HTMLElement;

    let trainings: any[] | undefined;
    let trainingTitle: string | undefined;
    export let trainingId: string | undefined;

    async function searchTraining() {
        const values = Validation.checkAndGetValues(formBind)!;
        if (!values) return;

        const { searchTrainingTitle } = values;

        try {
            const response = await axios.get('/api/training/selector?trainingTitle=' + searchTrainingTitle);
            console.log(response);

            trainings = response.data;

            const firstTraining = trainings?.[0];

            if (firstTraining) {
                trainingId = firstTraining['id'];
                trainingTitle = firstTraining['title'];
            }
            
        } catch (error) {
            console.log(error);
        }
    }

    function reset() {
        trainings = undefined;
        trainingId = undefined;
        trainingTitle = undefined;
    }

</script>

<FormField floating readonly noEditMark>
    <input id="training" name="훈련" class="form-control" bind:value={trainingTitle} on:click={() => {
        modal.show();
    }}/>
</FormField>

<Modal bind:this={modal} title="훈련 선택" alwaysRender>

    <div class="d-flex flex-column gap-2" bind:this={formBind}>
        <FormField floating noEditMark clazz="w-100" validation={notEmptyValidation} let:validate>
            <input id="searchTrainingTitle" name="훈련 제목" class="form-control" on:input={e => validate(e.currentTarget)} />
        </FormField>

        <div class="d-flex gap-1">
            <button class="btn btn-danger w-100" on:click={reset}>초기화</button>
            <button class="btn btn-light w-100" on:click={searchTraining}>검색</button>
        </div>

        <div class="d-flex justify-content-center">
            {#if trainings}
            <hr class="my-1">
                {#if trainings.length > 0}
                    <div class="form-floating w-100">
                        <select id="trainingSelect" class="form-select" bind:value={trainingId} on:change={(e) => {
                            trainingTitle = e.currentTarget.selectedOptions[0].innerText;
                        }}>
                            {#each trainings as training}
                                <option value={training.id}>{training.title}</option>
                            {/each}
                        </select>
                        <label for="trainingSelect">훈련을 선택해주세요</label>
                    </div>
                {:else if trainings.length === 0}
                    <p class="text-secondary small">검색결과가 없습니다</p>
                {/if}
            {/if}

        </div>


        <!-- <button class="btn btn-light text-nowrap" style="max-height: 3.6rem;" on:click={() => {searchTraining()}}>검색</button> -->
    </div>
</Modal>

<style lang="scss">
</style>