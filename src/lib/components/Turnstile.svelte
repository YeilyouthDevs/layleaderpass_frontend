<svelte:head>
    <!-- Turnstile 스크립트를 명시적 렌더링 모드로 로드 -->
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onloadTurnstileCallback" defer></script>
</svelte:head>

<script lang="ts">
    import { alertStore } from "$lib/stores/alertStore";
    import { onMount } from "svelte";

    // Turnstile 사이트 키
    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
    export let containerId: string = "turnstile-container";

    // Turnstile 응답 토큰
    let turnstileToken: string | null = null;

    export function getToken() {
        if (!turnstileToken) {
            alertStore.warn({
                title: '캡챠 인증 필요',
                content: '체크박스에 체크해주세요.',
                duration: 2000
            });
            return null;
        }
        return turnstileToken;
    }

    export function resetToken() {
        // Turnstile 인스턴스를 찾아 리셋
        (window as any).turnstile.reset(`#${containerId}`);
        turnstileToken = null;
    }

    onMount(() => {
        // Turnstile 스크립트가 로드된 후 초기화 콜백 등록
        (window as any).onloadTurnstileCallback = () => {
            (window as any).turnstile.render(`#${containerId}`, {
                sitekey: siteKey,
                callback: (token: string) => {
                    turnstileToken = token;
                },
            });
        };
    });
</script>

<div id={containerId}></div>
