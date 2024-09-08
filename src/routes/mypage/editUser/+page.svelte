<script lang="ts">
	import { goto } from "$app/navigation";
	import DateSelector from "$lib/components/DateSelector/DateSelector.svelte";
	import { DateMode } from "$lib/components/DateSelector/script";
	import FormField from "$lib/components/FormField.svelte";
	import GridCard from "$lib/components/GridCard.svelte";
	import PageContainer from "$lib/components/PageContainer.svelte";
	import SimpleDesc from "$lib/components/SimpleDesc.svelte";
	import { validate, Validation } from "$lib/script/lib/validation";
	import { notEmptyValidation } from "$lib/script/lib/validationSchemas";
	import { alertStore } from "$lib/stores/alertStore";
	import { credentialStore } from '$lib/stores/credentialStore';
	import { headerStore } from "$lib/stores/headerStore";
	import { userStore } from "$lib/stores/userStore";
	import axios from "axios";
	import { onMount } from "svelte";
	import { getPasswordCheckValidation, getPasswordEditValidation, nameEditValidation, phoneValidation } from "../../register/form/script";


    async function requestEdit() {
        const values = Validation.checkAndGetValues(formArea);
        if (!values) return;

        const response = await axios.post('/api/user/edit', {
            updated: values,
            isDeleted: $userStore.isDeleted
        });
        if (!response || !response?.data) return;

        const data = response.data;

        if (data.status) {

            alertStore.success({
                title: '사용자 정보 수정 완료',
                content: `수정되었습니다.`,
                duration: 3000
            })

            headerStore.update({
                useMenu: true,
                backButton: true
            })

            if ($userStore.isDeleted === true){
                userStore.update({
                    isDeleted: undefined
                })
            }

            goto('/mypage', { replaceState: true })

        } else {
            alertStore.fail({
                title: '사용자 정보 수정 불가능',
                content: data.message,
                duration: 3000
            })
        }
    }

    let formArea: HTMLDivElement;
    let dateSelector:DateSelector ;

    onMount(() => {
        if ($userStore.isDeleted === true) {
            alertStore.warn({
                title: '사용자 정보수정 필요',
                content: '서비스를 이용하시려면 사용자 정보 수정이 필요합니다.',
                duration: 3000,
            })
        }
    })

    // let originalPasswordInput: HTMLInputElement
    let passwordInput: HTMLInputElement;
    let passwordCheckInput: HTMLInputElement;
    function validatePassword() {

        validate(passwordInput, getPasswordEditValidation($userStore.isDeleted ? false : true))
        validate(passwordCheckInput, getPasswordCheckValidation(formArea, $userStore.isDeleted ? false : true))
    }

    async function fetchUserInfo() {
        const response = await axios.get(`/api/user/selfInfo?email=${$credentialStore.email}&forEdit=true`);
        return response?.data;
    }

</script>

<PageContainer title="사용자 정보 수정"  bind:element={formArea}>
    
    {#await fetchUserInfo() then user}
        
    <div class="row g-2 my-1">
        <div class="col-12">
            <GridCard>
                <!-- {#if !$userStore.isDeleted}
                <FormField floating validation={notEmptyValidation} let:validate>
                    <input type="password" id="originalPassword" name="현재 비밀번호" class="form-control" bind:this={originalPasswordInput} on:input={e => validate(e)}>
                </FormField>
                {/if} -->
                <FormField floating>
                    <input type="password" id="password" name="비밀번호" class="form-control {$userStore.isDeleted ? 'is-invalid' : 'is-valid'}" bind:this={passwordInput}
                        on:input={validatePassword}>
                </FormField>
                <FormField floating>
                    <input type="password" id="passwordCheck" name="비밀번호 확인" class="form-control {$userStore.isDeleted ? 'is-invalid' : 'is-valid'}" bind:this={passwordCheckInput}
                        on:input={validatePassword}>
                </FormField>

                {#if !$userStore.isDeleted}
                <SimpleDesc>비밀번호를 변경하려면 입력해주세요.</SimpleDesc>     
                {/if}
                

                <FormField floating from={user} validation={nameEditValidation} let:validate>
                    <input id="name" name="이름" class="form-control"
                        on:input={e => validate(e.currentTarget)}>
                </FormField>

                <div>
                    <FormField floating from={user} validation={notEmptyValidation} let:validate readonly>
                        <input id="birthday" name="생년월일" class="form-control" on:input={(e) => validate(e.currentTarget)}
                            on:click={(e) => dateSelector?.open(e.currentTarget, '생년월일을 선택해주세요', DateMode.DATE)}>
                    </FormField>
                </div>

                <FormField floating from={user} validation={phoneValidation} let:validate>
                    <input id="phone" name="연락처" class="form-control is-valid"
                        on:input={e => validate(e.currentTarget)}>
                </FormField>
            </GridCard>
        </div>

        <div class="col-12">
            <button class="btn btn-primary btn-height w-100" on:click={requestEdit}>수정 완료</button>
        </div>
    </div>

    {/await}

</PageContainer>

<DateSelector bind:this={dateSelector} />


<style lang="scss">
    
</style>

