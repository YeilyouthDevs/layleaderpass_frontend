<script lang="ts">
	import FormField from "$lib/components/FormField.svelte";
	import Modal from "$lib/components/Modal.svelte";
	import { formatDatetime } from "$lib/script/lib/formatDatetime";
	import { validate, Validation } from "$lib/script/lib/validation";
	import { notEmptyValidation } from "$lib/script/lib/validationSchemas";
	import axios from "axios";
	import { createEventDispatcher } from "svelte";

    let modal: Modal;
    let formBind: HTMLElement;

    let searchByBind: HTMLSelectElement;
    let searchStringBind: HTMLInputElement;
    let userName: string | undefined;
    let foundUsers: any[] | undefined = undefined;

    const dispatch = createEventDispatcher();

    async function searchTraining() {
        const values = Validation.checkAndGetValues(formBind)!;
        if (!values) return;

        let searchString = searchStringBind.value;
        let searchBy = searchByBind.value;

        console.log(searchBy, searchString);

        try {
            const response = await axios.get(`/api/user/selector?searchBy=${searchBy}&searchString=${searchString}`);
            console.log(response);

            foundUsers = response.data;
        } catch (error) {
            console.log(error);
        }
    }

    function reset() {
        searchStringBind.value = '';
        validate(searchStringBind, notEmptyValidation);
        dispatch('set');
    }

</script>

<FormField floating readonly noEditMark>
    <input id="user" name="사용자" class="form-control" bind:value={userName} on:click={() => {
        modal.show();
    }}/>
</FormField>

<Modal bind:this={modal} title="사용자 선택" alwaysRender>

    <div class="d-flex flex-column gap-2" bind:this={formBind}>
        <div class="row gx-1">
            <div class="col-4">
                <div class="form-floating">
                    <select id="searchBy" class="form-select" name="검색기준" bind:this={searchByBind}>
                        <option value="name">이름</option>
                        <option value="email">이메일</option>
                    </select>
                    <label for="searchBy">검색기준</label>
                </div>
            </div>
            <div class="col-8">
                <FormField floating noEditMark clazz="w-100" validation={notEmptyValidation} let:validate>
                    <input id="searchString" name="검색" class="form-control" bind:this={searchStringBind} on:input={e => validate(e.currentTarget)} />
                </FormField>
            </div>
            {#if foundUsers}
                <div class="col-12">
                {#if foundUsers.length > 0}
                    <select>
                        {#each foundUsers as user}
                            <option value={user.email}>{user.name} {formatDatetime(user.birthday, { includeTime: false, includeWeekDay: false })}</option>
                        {/each}
                    </select>
                {:else if foundUsers.length <= 0}
                    <p class="text-center text-secondary">검색 결과가 없습니다</p>
                {/if}
                </div>
            {/if}
        </div>

        <div class="d-flex gap-1">
            <button class="btn btn-danger w-100" on:click={reset}>초기화</button>
            <button class="btn btn-light w-100" on:click={searchTraining}>검색</button>
        </div>
    </div>
</Modal>

<style lang="scss">
</style>