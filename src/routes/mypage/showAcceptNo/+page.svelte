<script lang="ts">
	import SimpleDesc from './../../../lib/components/SimpleDesc.svelte';
	import PageContainer from "$lib/components/PageContainer.svelte";
	import axios from "axios";
	import { onMount } from "svelte";

    let acceptNo: number;

    async function requestAcceptNo() {
        try {
            const response = await axios.get('/api/user/getAcceptNo');
            console.log(response);

            if (!response?.data) throw new Error('acceptNo 없음');
            acceptNo = Number(response.data);
        } catch (error) {
            console.error(error);
        }
    }

    onMount(() => {
        requestAcceptNo();
    })

</script>

<PageContainer title="가입승인번호 확인">
        
    <div class="row g-2 gy-5 my-1 ">
        {#if acceptNo}
        <div class="col-12">
            <div class="circle">
                {acceptNo}
            </div>
        </div>
        <div class="col-12">
            <SimpleDesc><b>가입승인번호란?</b><br>사용자의 가입이 승인된 순서를 나타내는 고유한 번호입니다. 이벤트나 사용자 식별에 사용됩니다.</SimpleDesc>
        </div>
        {/if}
    </div>

</PageContainer>

<style lang="scss">
    .circle {
        margin: 0 auto;
        border: 10px solid rgb(171, 209, 153);
        border-radius: 100%;
        width: 10rem;
        height: 10rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 3rem;
        color: rgb(65, 65, 65);
        
    }
</style>

