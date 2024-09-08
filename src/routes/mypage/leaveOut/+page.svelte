<script lang="ts">
	import { goto } from "$app/navigation";
	import MultiClickDiv from "$lib/components/MultiClickDiv.svelte";
	import PageContainer from "$lib/components/PageContainer.svelte";
	import SimpleDesc from "$lib/components/SimpleDesc.svelte";
	import { alertStore } from "$lib/stores/alertStore";
	import { signout } from "$lib/stores/credentialStore";
	import axios from "axios";


    async function requestLeaveOut() {
        const response = await axios.post('/api/user/leaveOut');

        if (!response || !response?.data) return;

        const data = response.data;

        if (data.status) {
            //로그아웃 처리
            await signout();
            goto('/', { replaceState: true })

            alertStore.success({
                title: '회원 탈퇴 완료',
                content: `탈퇴되었습니다.`,
                duration: 3000
            })
        } else {
            alertStore.fail({
                title: '회원 탈퇴 불가능',
                content: data.message,
                duration: 3000
            })
        }

        
    }

</script>

<PageContainer title="회원 탈퇴">

    <div class="row g-2 mt-2">
        <div class="col-12">
            <p class="small">회원 탈퇴를 진행하는 경우 사용자 데이터(생년월일, 연락처)가 삭제됩니다.</p>
        </div>
        <div class="col-12">
            <p class="small">집계를 위한 최소한의 사용자 정보(이메일, 비밀번호, 이름), 훈련 데이터(달란트, 훈련참여 정보, 제출된 자료)는 개인정보 보호 및 처리 방침 • 가입 약관에 명시됨과 같이, 진행중인 기수가 끝날때까지 보존되며 기간은 최대 2년까지 입니다. 이후 기수가 종료되면 자동 삭제됩니다.</p>
        </div>

        <div class="col-12">
            <MultiClickDiv clazz="btn btn-danger btn-height w-100" clickCount={9} callback={() => requestLeaveOut()}>회원 탈퇴</MultiClickDiv>
        </div>

        <div class="col-12">
            <SimpleDesc>훈련 데이터가 완전히 삭제되기 전이라면 획득한 달란트 그대로 다시 가입할 수 있습니다.</SimpleDesc>
        </div>
        <div class="col-12">
            <SimpleDesc>탈퇴 후 진행중인 기수가 끝나기 전에 훈련 데이터 삭제를 원하시는 경우 운영팀으로 문의바랍니다.</SimpleDesc>
        </div>
    </div>

</PageContainer>


<style lang="scss">
    
</style>

