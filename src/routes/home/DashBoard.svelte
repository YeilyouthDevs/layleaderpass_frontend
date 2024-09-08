<!-- AssignmentGraph.svelte -->

<script lang="ts">
	import { goto } from "$app/navigation";
	import { formatDatetime } from "$lib/script/lib/formatDatetime";
	import { loadingStore } from "$lib/stores/loadingStore";
	import axios from "axios";
	import { onMount } from "svelte";
	import GraphElement from "./GraphElement.svelte";
	import HorizontalLine from "./HorizontalLine.svelte";
	import { userStore } from "$lib/stores/userStore";

    let graphData: any;
    let currentSeason: any;

    let maxValue = 0;
    let sum = 0;
    let ticks = [0, 70, 150, 237]; // 눈금 위치 배열 (여기에 원하는 특정 지점 추가)
    let flagImage = "/images/running_kid.gif"; // 깃발 이미지 URL
    let mounted : boolean;

    onMount(async() => {
        await fetchData();
        mounted = true;
    });

    async function fetchData() {
        try {
            loadingStore.show();

            const response = await axios.get('/api/home/dashboard');
            const data = response.data;

            if (!data) return;
             
            graphData = data.graphData;
            graphData.sort((a: any, b: any) => (a.categoryId - b.categoryId)) //카테고리 순서대로 정렬

            currentSeason = data.currentSeason;

            sum = 0;
            for (const item of graphData) {
                if (item.totalAmount > maxValue) maxValue = item.totalAmount;
                sum += item.totalAmount;
            }

            //달란트 합계 업데이트
            userStore.update({
                talent: sum
            })

        } catch (error) {
            console.error("Error fetching graph data:", error);
        } finally {
            loadingStore.hide();
        }
    }
</script>

{#if mounted}

<div class="container g-0">
    <div class="row g-1">
        <div class="col-12">
            
                <div class="season-wrap">
                    <div class="d-flex align-items-center justify-content-center gap-1">
                        {#if currentSeason}
                        <p class="text-secondary small text-nowrap">진행중</p>
                        <p class="season-title">{currentSeason.name}</p>
                        {:else}
                        <p class="text-secondary small text-nowrap">진행중인 시즌 없음</p>
                        {/if}
                    </div>

                    {#if currentSeason}
                    <div class="d-flex justify-content-center gap-2 season-dates">
                        <p>{formatDatetime(currentSeason.startDate, { includeTime: false })}</p>
                        <p>~</p>
                        <p>{formatDatetime(currentSeason.endDate, { includeTime: false })}</p>
                    </div>
                    {/if}
                </div>
        </div>
        {#if currentSeason}
            <div class="col-12">
                {#if ticks}
                    <HorizontalLine clazz="px-3 pt-2" maxValue={237} {ticks} value={sum} {flagImage} />
                {/if}
            </div>
            <div class="col-12">
                <p class="sum-announce">
                    {#if sum > 0}
                        ✨ 지금까지 <span class="value">{sum}</span> 달란트를 모았어요! ✨
                    {:else}
                        아직 모은 달란트가 없어요 😢
                    {/if}
                </p>
            </div>
            <div class="col-12">
                {#each graphData as item}
                    <GraphElement label={item.categoryName} value={item.totalAmount} maxValue={maxValue} duration={1} on:click={() => goto('/home/myTalentAssignments?categoryId=' + item.categoryId)} />
                {/each}
            </div>
        {/if}
    </div>

</div>
{/if}



<style lang="scss">

    .season-wrap {
        border: 3px solid rgb(185, 185, 185);
        border-radius: 0.3rem;
        padding: 0.5rem;
        margin: 0 auto;
    }

    .season-title {
        text-align: center;
        font-size: 1.2rem;
        font-style: italic;
        font-weight: bold;
        color: rgb(85, 85, 85);
        text-wrap: balance;
    }

    .season-dates {
        font-size: 0.9rem;
        color: rgb(78, 78, 78);
    }

    .sum-announce {
        text-align: center;
        font-weight: bold;
        color: rgb(61, 61, 61);

        .value {
            color: rgb(243, 71, 71);
        }
    }
</style>
