<script lang="ts">
	import FormField from "$lib/components/FormField.svelte";
	import GridCard from "$lib/components/GridCard.svelte";
	import PageContainer from "$lib/components/PageContainer.svelte";
	import { Validation, type ValidationSchema } from "$lib/script/lib/validation";
	import { alertStore } from "$lib/stores/alertStore";
	import { countDownStore, secondsToTimeString } from "$lib/stores/countdownStore";
	import { headerStore } from "$lib/stores/headerStore";
	import { loadingStore } from "$lib/stores/loadingStore";
	import axios from "axios";
	import { passwordSchemaEdit } from 'llp-validator';
	import { onDestroy, onMount } from "svelte";

    headerStore.update({ backButton:false, useMenu: false })

    let email: string;
    let token: string;
    const countDownId = 'passwordReset'
    let formArea: HTMLDivElement;
    let complete: boolean = false;

    onMount(async () => {
        // URL에서 토큰 파싱
        const urlParams = new URLSearchParams(window.location.search);
        token = urlParams.get('token')!;

        // 토큰 유효성 확인
        if (token) await checkMailToken(token);
    })

    onDestroy(() => {
        countDownStore.stop(countDownId);
    })


    async function checkMailToken(token: string) {
        try {
            const response = await axios.post('/api/findAccount/checkPasswordResetToken', { token });    
            const payload = response.data.payload;

            email = payload.email;

            const remainSeconds = parseInt(payload.expireAt);

            const expireAt = new Date();
            expireAt.setSeconds(expireAt.getSeconds() + remainSeconds)
            countDownStore.start(countDownId, expireAt);    
        } catch (error) {
            console.error(error)
        }
    }

    /**
     * 비밀번호 재설정 양식을 제출함
     */
    async function submit(){

        try {
            const values = Validation.checkAndGetValues(formArea);
            console.log(values)

            if(values){
                loadingStore.showRightNow();
                const response = await axios.post('/api/findAccount/submitPasswordResetForm', {
                    email, password: values.password
                });

                const data = response.data;

                if (data.status){
                    alertStore.success({
                        content: data.message,
                        duration: 4000
                    })

                    complete = true;
                }
            }
        } catch (error) {
            console.error(error)
        }
    }

    const passwordEditValidation: ValidationSchema = {
        displayOnEmpty: true,
        handler: (el) => {
            const { error } = passwordSchemaEdit.validate(el.value.trim());
            return error?.message;
        }
    }

    const passwordCheckValidation: ValidationSchema = {
        handler: () => {
            const values = Validation.getValues(formArea);
            if (values && values.password !== values.passwordCheck) return '비밀번호가 서로 다릅니다.'
        }
    }

</script>


<PageContainer title="비밀번호 재설정" bind:element={formArea}>
    <div class="row g-2 my-1">
        {#if complete}
        <div class="col-12">
            <GridCard>
                <div class="text-center">
                    <p class="h2">비밀번호 재설정 완료</p>
                    <p class="small">비밀번호 재설정이 완료되었습니다. 페이지를 닫아도 됩니다.</p>
                    <button class="mt-2 btn btn-secondary btn-height w-100" on:click={() => window.close()}>페이지 닫기</button>
                </div>
            </GridCard>
        </div>
        {:else if $countDownStore[countDownId]}
        <div class="col-12">
            <GridCard>
                <p class="p-1 text-center">남은시간 <span class="text-danger">{secondsToTimeString($countDownStore[countDownId])}</span></p>
            </GridCard>
        </div>
        <div class="col-12">
            <GridCard>

                <FormField floating validation={passwordEditValidation} let:validate>
                    <input type="password" id="password" name="비밀번호" class="form-control"
                        on:input={e => validate(e.currentTarget)}>
                </FormField>
                <FormField floating validation={passwordCheckValidation} let:validate>
                    <input type="password" id="passwordCheck" name="비밀번호 확인" class="form-control"
                        on:input={e => validate(e.currentTarget)}>
                </FormField>
                
            </GridCard>
        </div>

        <div class="col-12">
            <button class="btn btn-primary btn-height w-100" on:click={submit}>비밀번호 재설정</button>
        </div>
     
        {:else if $countDownStore[countDownId] == 0}
        <div class="col-12">
            <GridCard>
                <div class="text-center">
                    <p class="h2">SORRY</p>
                    <p class="small">유효기간이 만료되었습니다. 다시 시도해주세요.</p>
                </div>
            </GridCard>
        </div>
        {/if}
    </div>

</PageContainer>

<style lang="scss">
   
</style>