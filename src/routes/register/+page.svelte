<script lang="ts">
	import { goto } from "$app/navigation";
	import FormField from "$lib/components/FormField.svelte";
	import GridCard from "$lib/components/GridCard.svelte";
	import PageContainer from "$lib/components/PageContainer.svelte";
	import Turnstile from "$lib/components/Turnstile.svelte";
	import { Validation, type ValidationSchema } from "$lib/script/lib/validation";
	import { alertStore } from "$lib/stores/alertStore";
	import { countDownStore, secondsToTimeString } from '$lib/stores/countdownStore';
	import { credentialStore } from "$lib/stores/credentialStore";
	import axios from "axios";
	import { emailSchema } from "llp-validator";
	import { onDestroy } from "svelte";
	import { slide } from 'svelte/transition';
	import SimpleDesc from './../../lib/components/SimpleDesc.svelte';

    let formArea: HTMLDivElement;
    let isEmailAvailable: boolean = false;
    let isEmailSent: boolean = false;
    let emailValue: string;
    let turnstile: Turnstile;

    const countDownId = 'register';

    onDestroy(() => {
        countDownStore.stop(countDownId);
    })

    async function fetchUserExists(email: string){
        if (!turnstile.getToken()) return;

        try {
            const response = await axios.get(`/api/user/isExists?email=${email}`);
            isEmailAvailable = !response.data;

            if (!isEmailAvailable) alertStore.fail({ content: '이미 사용중인 이메일입니다.', duration: 2000 });
        } catch (error: any) {
            console.error(error.message);
        }
    }

    async function submit(){
        const turnstileToken = turnstile.getToken();
        if (!turnstileToken) return;

        const values = Validation.checkAndGetValues(formArea, { scopeNames: ['emailCheck'] })
        if (!values) return;

        try {
            const response = await axios.post('/api/register/sendEmail', { email: values.emailCheck, turnstileToken })
            isEmailSent = true;

            alertStore.success({ content: response.data.message, duration: 2000 })

            const expireAt = new Date(response.data.expireAt * 1000);
            countDownStore.start(countDownId, expireAt);
        } catch (error) {
            turnstile.resetToken()
            console.error(error);
        }
    }
    
    const emailValidation: ValidationSchema = {
        hideOnValid: true,
        handler: (el) => {
            const { error } = emailSchema.validate(el.value.trim());
            return error?.message;
        }
    }

    const emailCheckValidation: ValidationSchema = {
        handler: () => {
            const values = Validation.getValues(formArea, { scopeNames: ['email', 'emailCheck'] });
            if (values && values.email !== values.emailCheck) return '이메일이 서로 다릅니다.'
        }
    }

</script>

{#if !$credentialStore.email}

<PageContainer title="회원가입" bind:element={formArea}>
    <div class="row g-2 my-1">
        <div class="col-12">
            <GridCard>
                <FormField floating validation={emailValidation} let:validate dataScope="email" noEditMark>
                    <input id="email" name="이메일" class="form-control"
                        on:input={e => {
                            validate(e.currentTarget)
                            emailValue = e.currentTarget.value;

                            if (isEmailAvailable) {
                                isEmailAvailable = false;
                                isEmailSent = false;
                                countDownStore.stop(countDownId);
                            }
                        }}>
                </FormField>
                <div>
                    <SimpleDesc>이메일 중복확인 후 회원가입 메일을 보내드립니다.</SimpleDesc>
                    <button class="btn btn-light btn-height w-100" on:click={() => {
                        const values = Validation.checkAndGetValues(formArea, { scopeNames: ['email']});
                        if (values) fetchUserExists(values.email);
                    }}>중복 확인</button>
                </div>
            </GridCard>
        </div>

        <div class="col-12 order-4">
            <Turnstile bind:this={turnstile} />
        </div>

        {#if isEmailAvailable}

        <div class="col-12 order-2" transition:slide={{ delay: 100 }}>
            <GridCard>
                <p class="text-center"><span class="text-success">사용 가능</span>한 이메일입니다.</p>
                <p class="small">정확히 입력했는지 확인하기 위해 이메일을 <span class="text-danger">한번 더</span> 입력해주세요.</p>

                <FormField floating validation={emailCheckValidation} let:validate dataScope="emailCheck" noEditMark>
                    <input id="emailCheck" name="이메일 확인" class="form-control"
                        on:input={e => validate(e.currentTarget)}>
                </FormField>
                <div class="small text-center text-secondary">
                    {#if $countDownStore[countDownId]}
                    <p>회원가입 메일의 유효기간이 <span class="text-danger">{secondsToTimeString($countDownStore[countDownId])}</span> 남았습니다.</p>
                    {:else if $countDownStore[countDownId] == 0}
                    <p>회원가입 메일의 유효기간이 <span class="text-danger">만료</span>되었습니다. 다시 전송해주세요.</p>
                    {/if}
                </div>
                <button class="btn btn-primary btn-height w-100" on:click={submit}>회원가입 메일 전송</button>
            </GridCard>
        </div>

        {#if isEmailSent}
            <div class="col-12 order-3" transition:slide={{ delay: 100 }}>
                <GridCard>
                    <p class="small text-center">가입이 완료되면 로그인으로 이동해주세요.</p>
                    <button class="btn btn-secondary btn-height w-100" on:click={() => goto('/login')}>로그인</button>
                </GridCard>
            </div>
        {/if}
        {/if}

    </div>
</PageContainer>

{/if}

<style lang="scss">
    
</style>

