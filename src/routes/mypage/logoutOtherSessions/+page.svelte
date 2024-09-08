<script lang="ts">
	import PageContainer from "$lib/components/PageContainer.svelte";
	import SimpleDesc from "$lib/components/SimpleDesc.svelte";
	import { alertStore } from "$lib/stores/alertStore";
	import axios from "axios";
	import { debounce } from "lodash-es";

    const requestDebounced = debounce(async () => {
        await requestLogoutAllOtherSession();
    }, 1000, {leading: true, trailing: false, maxWait: 2000})

    async function requestLogoutAllOtherSession() {
        const response = await axios.post('/api/session/deleteAllOtherSession');

        if (!response || !response?.data) return;

        const data = response.data;

        if (data.deletedCount <= 0) {
            alertStore.success({
                content: `로그아웃 가능한 다른 세션이 없습니다.`,
                duration: 3000
            })    
        } else {
            alertStore.success({
                content: `총 ${data.totalCount}개 중 ${data.deletedCount}개 세션을 삭제했습니다.${(data.protectedCount) ? ` ${data.protectedCount}개 는 보호중입니다.` : ''}`,
                duration: 4000
            })
        }
    }

</script>

<PageContainer title="다른기기 모두 로그아웃">

    <div class="row g-2 mt-2">
        
        <div class="col-12">
            <p class="small">다른 모든 기기(브라우저)에서 로그아웃합니다. 공공장소 또는 타인의 기기에서 로그아웃 하지 않았다면 아래 버튼을 눌러 로그아웃 할 수 있습니다.</p>
        </div>

        <div class="col-12">
            <button class="btn btn-primary btn-height w-100" on:click={requestDebounced}>다른기기 모두 로그아웃</button>
        </div>

        <div class="col-12">
            <SimpleDesc>새로 로그인하는 경우 로그인 세션이 5분간 보호받습니다. 현재 기기와 보호받는 세션을 제외한 나머지 세션을 모두 로그아웃합니다.</SimpleDesc>
        </div>

        <div class="col-12">
            <SimpleDesc>한 계정 당 최대 3개 세션이 존재할 수 있으며, 오래된 순 부터 자동 로그아웃 됩니다. 만약 이메일과 비밀번호가 노출된 상황이라면 신속히 비밀번호를 변경해야합니다.</SimpleDesc>
        </div>

    </div>

</PageContainer>


<style lang="scss">
    
</style>

