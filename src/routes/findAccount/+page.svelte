<script lang="ts">
	import DateSelector from "$lib/components/DateSelector/DateSelector.svelte";
	import { DateMode } from "$lib/components/DateSelector/script";
	import FormField from "$lib/components/FormField.svelte";
	import PageContainer from "$lib/components/PageContainer.svelte";
	import Turnstile from "$lib/components/Turnstile.svelte";
	import { parseDate } from "$lib/script/lib/formatDatetime";
	import { Validation } from "$lib/script/lib/validation";
	import { notEmptyValidation } from "$lib/script/lib/validationSchemas";
	import { alertStore } from "$lib/stores/alertStore";
	import { countDownStore, secondsToTimeString } from "$lib/stores/countdownStore";
	import axios from "axios";
	import { onDestroy } from "svelte";
	import { slide } from 'svelte/transition';

    let formArea: HTMLDivElement;
    let turnstile: Turnstile;
    let mode: 'email' | 'password' | null = null;

    let dateSelector:DateSelector ;
    const countdownId = 'findAccount';

    async function request() {
        if (mode === 'email') requestFindEmail()
        else if (mode === 'password') requestFindPassword()
    }

    async function requestFindEmail() {
        const turnstileToken = turnstile.getToken();
        if (!turnstileToken) return;

        const values = Validation.checkAndGetValues(formArea)
        if (!values) return;

        if(values['birthday']) values['birthday'] = parseDate(values['birthday']).toISOString();

        try {
            const response = await axios.post('/api/findAccount/email', {
                ...values,
                turnstileToken
            });
            const payload = response?.data?.payload;

            if (payload?.email) {
                alertStore.success({
                    title: '이메일 찾음',
                    content: payload.email + ' 입니다.',
                })
            }
        } catch (error) {
            turnstile.resetToken();
        }
    }

    async function requestFindPassword() {
        const turnstileToken = turnstile.getToken();
        if (!turnstileToken) return;

        const values = Validation.checkAndGetValues(formArea);
        if (!values) return;

        try {
            const response = await axios.post('/api/findAccount/sendPasswordResetMail', {...values, turnstileToken});
            const result = response?.data;
            const payload = result?.payload;

            if (result.status) {
                alertStore.success({
                    title: '메일 전송됨',
                    content: result.message,
                })

                const expireAt = new Date(payload.expireAt * 1000);
                countDownStore.start(countdownId, expireAt);
            }
        } catch (error) {
            turnstile.resetToken()
        }
    }


    onDestroy(() => {
        countDownStore.stop(countdownId);
    })

</script>


<PageContainer title="계정 찾기" bind:element={formArea}>
   
        <div class="row d-flex justify-content-center g-2 mt-1">
            <div class="col-12 col-sm-8 col-lg-6">
                <div class="d-flex gap-2">
                    <button class="btn btn-height w-100 text-nowrap" on:click={() => mode = 'email'}
                        class:btn-success={mode === 'email'}
                        class:btn-secondary={mode !== 'email'}
                        >이메일 찾기</button>
                    <button class="btn btn-secondary btn-height w-100 text-nowrap" on:click={() => mode = 'password'}
                        class:btn-success={mode === 'password'}
                        class:btn-secondary={mode !== 'password'}
                        >비밀번호 찾기</button>
                </div>
            </div>
        </div>

        {#if mode === 'email'}
        <div class="row g-1 mt-1" transition:slide={{axis: 'y', duration: 200}}>
            <div class="col-12">
                <FormField floating validation={notEmptyValidation} let:validate>
                    <input id="name" name="이름" class="form-control"
                        on:input={e => validate(e.currentTarget)}>
                </FormField>
            </div>
            <div class="col-12">
                <FormField floating validation={notEmptyValidation} let:validate readonly>
                    <input id="birthday" name="생년월일" class="form-control" on:input={(e) => validate(e.currentTarget)}
                        on:click={(e) => dateSelector?.open(e.currentTarget, '생년월일을 선택해주세요', DateMode.DATE)}>
                </FormField>
            </div>
            <div class="col-12">
                <FormField floating>
                    <input id="phone" name="연락처" class="form-control is-valid">
                </FormField>
            </div>
        </div>
        {:else if mode === 'password'}
        <div class="row g-1 mt-1" transition:slide={{axis: 'y', duration: 200}}>
            
            {#if $countDownStore[countdownId]}
            <div class="col-12 small text-secondary text-center text-balance">
                <p>비밀번호 재설정 메일의 유효기간이 <span class="text-danger">{secondsToTimeString($countDownStore[countdownId])}</span> 남았습니다.</p>
            </div>
            {:else if $countDownStore[countdownId] == 0}
            <div class="col-12 small text-secondary text-center text-balance">
                <p>비밀번호 재설정 메일의 유효기간이 <span class="text-danger">만료</span>되었습니다. 다시 전송해주세요.</p>
            </div>  
            {/if}
            <div class="col-12">
                <FormField floating validation={notEmptyValidation} let:validate>
                    <input id="email" name="이메일" class="form-control"
                        on:input={e => validate(e.currentTarget)}>
                </FormField>
            </div>
        </div>
        {:else}
             <p class="text-secondary small text-center mt-2">위 버튼 중 하나를 눌러주세요</p>
        {/if}

        {#if mode}
        
        
        <div class="col-12">
            <hr class="my-2">
        </div>

        <div transition:slide={{axis: 'y', duration: 200, delay: 250}}>
            <div class="row g-1">
                <div class="col-12">
                    <Turnstile bind:this={turnstile} />
                </div>
                <div class="col-12">
                    <button class="btn btn-primary btn-height w-100" on:click={request}>
                        {mode === 'email' ? '찾기' : '재설정 메일 전송'}
                    </button>
                </div>
            </div>
        </div>
        {/if}
    

</PageContainer>

<DateSelector bind:this={dateSelector} />





<style lang="scss">

</style>