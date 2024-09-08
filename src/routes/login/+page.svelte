<script lang="ts">
import { goto } from "$app/navigation";
import FormField from "$lib/components/FormField.svelte";
import GridCard from "$lib/components/GridCard.svelte";
import PageContainer from "$lib/components/PageContainer.svelte";
import Turnstile from "$lib/components/Turnstile.svelte";
import { Validation, type ValidationSchema } from "$lib/script/lib/validation";
import { credentialStore, signin } from "$lib/stores/credentialStore";
import { emailSchema, passwordSchema } from "llp-validator";

let formArea: HTMLDivElement;
let turnstile: Turnstile;

let savedEmail: string = localStorage.getItem("savedEmail") as string;

const emailValidation: ValidationSchema = {
    hideOnValid: true,
    handler: (el) => {
        const { error } = emailSchema.validate(el.value.trim());
        return error?.message;
    }
}

const passwordValidation: ValidationSchema = {
    hideOnValid: true,
    handler: (el) => {
        const { error } = passwordSchema.validate(el.value.trim());
        return error?.message;
    }
}

// 로그인 요청 함수
async function requestSignIn() {
    const values = Validation.checkAndGetValues(formArea);
    if (!values) return;

    const turnstileToken = turnstile.getToken();
    if (!turnstileToken) return;


    try {
        // 로그인 API 호출
        await signin({
            isAutoLogin: false,
            data: {
                ...values,
                turnstileToken
            }
        });

        // 자동로그인 체크 시 아이디 저장
        if (values['autologin']) {
            localStorage.setItem('savedEmail', values['email'])
        } else {
            localStorage.removeItem('savedEmail')
        }
    } catch (error) {
        turnstile.resetToken();
    }

}

</script>

{#if !$credentialStore.email}
<PageContainer title="로그인">
    <div class="row g-2 my-1" bind:this={formArea}>
        <div class="col-12">
            <GridCard>
                <FormField floating validation={emailValidation} from={savedEmail} let:validate noEditMark>
                    <input id="email" name="이메일" class="form-control" on:input={e => validate(e.currentTarget)}>
                </FormField>
                <FormField floating validation={passwordValidation} let:validate noEditMark>
                    <input type="password" id="password" name="비밀번호" class="form-control" on:input={e => validate(e.currentTarget)}>
                </FormField>
                <div class="form-check form-switch d-flex align-items-center" data-collectable>
                    <input id="autologin" name="자동로그인" class="form-check-input" type="checkbox" role="switch" checked={savedEmail !== null}>
                    <label class="form-check-label" for="autologin">자동 로그인</label>
                </div>
            </GridCard>
        </div>
        <div class="col-12">
            <Turnstile bind:this={turnstile} />
        </div>
        <div class="col-12">
            <GridCard>
                <button class="btn btn-primary btn-height w-100" on:click={requestSignIn}>로그인</button>
                <div class="d-flex gap-1">
                    <button class="btn btn-secondary btn-height w-100" on:click={() => goto('/findAccount')}>계정찾기</button>
                    <button class="btn btn-secondary btn-height w-100" on:click={() => goto('/register')}>회원가입</button>
                </div>
            </GridCard>
        </div>
    </div>
</PageContainer>
{/if}

<style lang="scss">
#autologin {
    width: 3rem;
    height: 1.5rem;
    margin: 0.5rem 0.4rem;
}

.form-switch {
    padding: 0;
}
</style>
