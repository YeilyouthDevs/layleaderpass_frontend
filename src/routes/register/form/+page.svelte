<script lang="ts">
	import DateSelector from "$lib/components/DateSelector/DateSelector.svelte";
	import { DateMode } from "$lib/components/DateSelector/script";
	import FormField from "$lib/components/FormField.svelte";
	import GridCard from "$lib/components/GridCard.svelte";
	import PDFViewer from "$lib/components/PDFViewer.svelte";
	import PageContainer from "$lib/components/PageContainer.svelte";
	import SimpleDesc from "$lib/components/SimpleDesc.svelte";
	import { Validation } from "$lib/script/lib/validation";
	import { notEmptyValidation } from "$lib/script/lib/validationSchemas";
	import { alertStore } from "$lib/stores/alertStore";
	import { countDownStore, secondsToTimeString } from "$lib/stores/countdownStore";
	import { headerStore } from "$lib/stores/headerStore";
	import { loadingStore } from "$lib/stores/loadingStore";
	import axios from "axios";
	import { onDestroy, onMount } from "svelte";
	import { getPasswordCheckValidation, getPasswordEditValidation, nameEditValidation, phoneValidation } from "./script";

    headerStore.update({ backButton:false, useMenu: false })

    let email: string;
    let token: string;
    const countDownId = 'registerForm'
    let formArea: HTMLDivElement;
    let pdfViewer: PDFViewer;
    let policyWatched: boolean = false;
    let complete: boolean = false;

    let dateSelector:DateSelector ;

    onMount(async () => {
        // URL에서 토큰 파싱
        const urlParams = new URLSearchParams(window.location.search);
        token = urlParams.get('token')!;

        // 토큰 유효성 확인
        if (token) await checkMailToken(token);

        // 토큰이 유효하면 email도 유효
        if (email){
            // pdf 뷰어 초기화
            await pdfViewer.init();

            // 약관 불러오기
            await pdfViewer.load('/privacy_policy.pdf');
        }
    })

    onDestroy(() => {
        countDownStore.stop(countDownId);
    })

    /**
     * 약관 Pdf Viewer를 띄우면서 policyWatched를 캐싱함
     */
    function showPolicyViewer(){
        pdfViewer.toggleVisibility()
        policyWatched = true;
    }

    /**
     * 지정된 토큰이 유효한지 확인하는 요청을 보냄
     * @param token 회원가입 토큰
     */
    async function checkMailToken(token: string) {
        try {
            const response = await axios.post('/api/register/checkMailToken', { token });    

            email = response.data.email;

            const expireAt = new Date(parseInt(response.data.expireAt) * 1000)
            countDownStore.start(countDownId, expireAt);    
        } catch (error) {
            console.error(error)
        }
    }

    /**
     * 회원가입 양식을 제출함
     */
    async function submit(){

        // 이용약관 강제 확인
        if (!policyWatched) {
            alertStore.info({
                content: '아직 약관을 읽지 않았습니다.',
                duration: 2000
            })

            showPolicyViewer();
            return;
        }

        try {
            const values = Validation.checkAndGetValues(formArea, { findOrder: ['value'] });

            console.log(values)
            if(values){
                loadingStore.showRightNow();
                const response = await axios.post('/api/register/submit', values);
                const result = response.data;

                if (result.status){
                    alertStore.success({
                        content: '회원가입이 완료되었습니다.',
                        duration: 4000
                    })

                    complete = true;
                } else {
                    alertStore.warn({
                        content: result.message,
                        duration: 5000,
                    })
                }
            }
        } catch (error) {
            console.error(error)
        }
    }

</script>


<PageContainer title="회원가입 제출" bind:element={formArea}>
    <div class="row g-2 my-1">
        {#if complete}
        <div class="col-12">
            <GridCard>
                <div class="text-center">
                    <p class="h2">가입 완료</p>
                    <p class="small">회원가입이 완료되었습니다. 페이지를 닫아도 됩니다.</p>
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
                <FormField floating from={email} noValidate>
                    <input id="email" name="이메일" class="form-control is-valid">
                </FormField>

                <FormField floating validation={getPasswordEditValidation()} let:validate>
                    <input type="password" id="password" name="비밀번호" class="form-control"
                        on:input={e => validate(e.currentTarget)}>
                </FormField>
                <FormField floating validation={getPasswordCheckValidation(formArea)} let:validate>
                    <input type="password" id="passwordCheck" name="비밀번호 확인" class="form-control"
                        on:input={e => validate(e.currentTarget)}>
                </FormField>

                <FormField floating validation={nameEditValidation} let:validate>
                    <input id="name" name="이름" class="form-control"
                        on:input={e => validate(e.currentTarget)}>
                </FormField>

                <div>
                    <FormField floating validation={notEmptyValidation} let:validate readonly>
                        <input id="birthday" name="생년월일" class="form-control" on:input={(e) => validate(e.currentTarget)}
                            on:click={(e) => dateSelector?.open(e.currentTarget, '생년월일을 선택해주세요', DateMode.DATE)}>
                    </FormField>
                    <SimpleDesc>원활한 달란트 지급과 동명이인 식별을 위해 이름과 생년월일을 정확히 입력해주시길 바랍니다.</SimpleDesc>
                </div>

                <FormField floating validation={phoneValidation} let:validate>
                    <input id="phone" name="연락처" class="form-control is-valid"
                        on:input={e => validate(e.currentTarget)}>
                </FormField>
            </GridCard>
        </div>

        <div class="col-12">
            <GridCard>
                <button class="btn btn-light btn-height w-100" on:click={showPolicyViewer}>개인정보 처리방침 및 이용 약관</button>
                <button class="btn btn-primary btn-height w-100" on:click={submit}>약관 동의 및 가입완료</button>
            </GridCard>
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

<PDFViewer bind:this={pdfViewer}/>

<DateSelector bind:this={dateSelector} />



<style lang="scss">
   
</style>