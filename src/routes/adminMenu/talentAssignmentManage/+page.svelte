<script lang="ts">
	import DataViewer from '$lib/components/DataViewer/DataViewer.svelte';
	import type { LimitSchema, SearchSchema, TabSchema, WorkDefinition, WorkSchema, WorkSet } from '$lib/components/DataViewer/script';
	import {WorkType, type SortSchema } from '$lib/components/DataViewer/script';
	import DateSelector from '$lib/components/DateSelector/DateSelector.svelte';
	import { DateMode } from '$lib/components/DateSelector/script';
	import FormField from '$lib/components/FormField.svelte';
	import PageContainer from "$lib/components/PageContainer.svelte";
	import TrainingTypeIndicator from '$lib/components/TrainingTypeIndicator.svelte';
	import UserContact from '$lib/components/UserContact.svelte';
	import { convertDates, formatDatetime } from '$lib/script/lib/formatDatetime';
	import { Validation } from '$lib/script/lib/validation';
	import { UserRole, userStore } from '$lib/stores/userStore';
	import axios from 'axios';
	import TrainingSelector from '../../home/TrainingSelector.svelte';
	import TrainingHeaderIndicator from '$lib/components/TrainingHeaderIndicator.svelte';
	import UserSelector from '../../home/UserSelector.svelte';
	import UserTalentGranter from '$lib/components/UserTalentGranter.svelte';

    const pageTitle = "달란트 지급 관리";
        
    let dataViewer: DataViewer;
    let searchBind: HTMLElement;
    
    const byTrainingSortSchema: SortSchema = [
        { name: '이름순', value: 'name' },
        { name: '달란트순', value: 'talent' },
    ]

    const byTrainingSelectedSortSchema: SortSchema = [
        { name: '이름순', value: 'name' },
    ]

    const byTrainingSearchSchema: SearchSchema = [
        { name: '이름', value: 'userName' }
    ]

    const revokeSortSchema: SortSchema = [
        { name: '최신순', value: 'latest' },
        { name: '오래된순', value: 'oldest' },
        { name: '지급대상자 이름순', value: 'userName' },
        { name: '훈련 이름순', value: 'trainingName' },
    ]

    const revokeSearchSchema: SearchSchema = [
        { name: '지급대상 이름', value: 'userName' },
        { name: '지급대상 이메일', value: 'userEmail' },
        { name: '지급자 이름', value: 'granterName' },
        { name: '지급자 이메일', value: 'granterEmail' }
    ]

    // const grant: WorkDefinition = {
    //     name: '지급',
    //     class: 'btn btn-primary btn-height w-100',
    //     grid: 'col-6',
    //     workType: WorkType.ONLY_WORK,
    //     clickCount: 1,
    //     render: (workSet?: WorkSet) => true,
    //     onClick: async (workSet: WorkSet) => {
    //     }
    // }

    // const revokeWork: WorkDefinition = {
    //     name: '회수',
    //     class: 'btn btn-danger btn-height w-100',
    //     grid: 'col-6',
    //     workType: WorkType.ONLY_WORK,
    //     clickCount: 3,
    //     render: (workSet?: WorkSet) => true,
    //     onClick: async (workSet: WorkSet) => {

    //     }
    // }

    // const revokeSpec: WorkDefinition = {
    //     name: '회수',
    //     class: 'btn btn-danger btn-height w-100',
    //     grid: 'col-12',
    //     workType: WorkType.ONLY_SPEC,
    //     clickCount: 3,
    //     render: (workSet?: WorkSet) => true,
    //     onClick: async (workSet: WorkSet) => {

    //     },
    // }

    const onPrepare: WorkDefinition = {
        name: '작업메뉴는 준비중입니다',
        class: 'btn btn-secondary btn-height w-100',
        grid: 'col-12',
        workType: WorkType.BOTH,
        clickCount: 1,
        render: (workSet?: WorkSet) => true,
        onClick: async (workSet: WorkSet) => {

        }
    }

    const openGranter: WorkDefinition = {
        name: '지급',
        class: 'btn btn-primary btn-height w-100',
        grid: 'col-6',
        workType: WorkType.BOTH,
        clickCount: 1,
        render: (workSet?: WorkSet) => true,
        onClick: async (workSet: WorkSet) => {
            dataViewer.closeWorkMenu();
            talentGranter.open();
        }
    }

    let idName:string = 'id';
    let fetchURL: string;
    let specURL: string | undefined;
    let limitSchema: LimitSchema = [ 10, 20, 30, 40, 50 ]
    let sortSchema: SortSchema = byTrainingSortSchema;
    // let workSchema: WorkSchema = { grant, revokeSpec, revokeWork };
    let workSchema: WorkSchema;
    let searchSchema: SearchSchema = byTrainingSearchSchema;
	let dateSelector: DateSelector;
    let trainingId: string | undefined;
    let trainingTypeId: string | undefined;
    let targetUserEmail: string | undefined;
    let fetchPayload: any = {}

    enum DataTab { BY_TRAIN, BY_USER, REVOKE };
    let dataTab: DataTab = DataTab.BY_TRAIN;

    const tabSchema: TabSchema = [
        {
            name: '훈련기준 지급',
            select: true,
            onClick: () => {
                dataTab = DataTab.BY_TRAIN
            }
        },
        {
            name: '유저기준 지급',
            onClick: () => {
                dataTab = DataTab.BY_USER
            }
        },
        {
            name: '조회/회수',
            onClick: () => {
                dataTab = DataTab.REVOKE
            }
        },
    ]

    $: if (dataTab === DataTab.BY_TRAIN) {
        idName = 'email';
        fetchURL = '/api/talentAssignmentManage/list/byTrain';
        specURL = undefined;
        // sortSchema = grantSortSchema
        switchSortSchemaByTrainingId();
        searchSchema = byTrainingSearchSchema;
        workSchema = { onPrepare };
    } else if(dataTab === DataTab.BY_USER){
        idName = 'id';
        fetchURL = '/api/talentAssignmentManage/list/byUser';
        // specURL = '/api/talentAssignmentManage/spec';
        specURL = undefined;
        sortSchema = revokeSortSchema;
        searchSchema = revokeSearchSchema;
        workSchema = { openGranter }
    } else if(dataTab === DataTab.REVOKE){
        idName = 'id';
        fetchURL = '/api/talentAssignmentManage/list/revoke';
        // specURL = '/api/talentAssignmentManage/spec';
        specURL = undefined;
        sortSchema = revokeSortSchema;
        searchSchema = revokeSearchSchema;
        workSchema = { onPrepare };
    }

    function switchSortSchemaByTrainingId() {
        if (trainingId) sortSchema = byTrainingSelectedSortSchema;
        else sortSchema = byTrainingSortSchema;
        dataViewer?.selectAvailableOptions();
    }

    let talentGranter: UserTalentGranter;

</script>

<PageContainer title={pageTitle}>
    <p class="text-center small text-secondary mt-2">개발중인 기능입니다</p>

    <DataViewer bind:this={dataViewer} 
        bind:sortSchema
        bind:limitSchema
        bind:workSchema
        bind:searchSchema
        bind:idName
        bind:fetchPayload
        {tabSchema}
        {fetchURL}
        {specURL}
        itemWrapClass="row gx-0 mb-2 border-top border-bottom"
        useWorkUI={$userStore.role === UserRole.ADMIN}
        showSearchOption={true}
        on:beforeSearch={() => {
            if (dataTab === DataTab.REVOKE) {
                const values = Validation.getValues(searchBind);
                convertDates(values, ['searchStartDate'])
                convertDates(values, ['searchEndDate'], { setTimeEnd: true })
                fetchPayload = values;
            }

            if(trainingId) fetchPayload['trainingId'] = trainingId;
            else delete fetchPayload['trainingId']
            console.log(fetchPayload)
        }}
    >
        <div slot="item" class="w-100" let:item>
            <div class="border-top border-bottom" style="min-height: 3rem;">
                {#if dataTab === DataTab.BY_TRAIN}
                <div class="d-flex p-2">
                    <div class="flex-grow-1 d-flex flex-column justify-content-center">
                        <p class="name">{item.name}</p>
                        <p class="small text-secondary">{formatDatetime(item.birthday, { includeTime: false })} 생</p>
                    </div>
                    <div class="d-flex gap-1 align-items-center justify-content-between">
                        {#if fetchPayload.trainingId}
                            <p class="small text-secondary text-nowrap">훈련 획득</p>
                            <img class="talent-icon" src="/images/talent_icon.png" alt="달란트아이콘">
                            <p class="talent-amount">{item.talentSums?.sum || 0}</p>
                        {:else}
                            <p class="small text-secondary text-nowrap">총 획득</p>
                            <img class="talent-icon" src="/images/talent_icon.png" alt="달란트아이콘">
                            <p class="talent-amount">{item.talent || 0}</p>     
                        {/if}
                            
                    </div>
                </div>
                {:else if dataTab === DataTab.BY_USER}
                <div class="d-flex flex-column p-1">
                    <p>{item.title}</p>
                    <div class="small text-secondary text-pretty">
						{#if !item.startAt && !item.endAt}
							<p>기한 없음</p>
						{:else}
							<p>
								{formatDatetime(item.startAt, { includeSeconds: false })} ~ {formatDatetime(
									item.endAt,
									{ includeSeconds: false }
								)}
							</p>
						{/if}
					</div>
                </div>
                {:else if dataTab === DataTab.REVOKE}
                <div class="d-flex flex-column p-1" >
                    <div class="d-flex flex-column">
                        <p class="text-primary small">{item.training.title}</p>
                        <div class="d-flex justify-content-between" style="padding: 0.15rem;">
                            <p class="name">{item.user.name}</p>
                            <div class="d-flex gap-1 align-items-center">
                                <img class="talent-icon" src="/images/talent_icon.png" alt="달란트아이콘">
                                <p class="talent-amount">{item.amount}</p>
                            </div>
                        </div>
                    </div>
                    <div class="d-flex justify-content-between gap-1 w-100" style="font-size: 0.7rem;">
                        <div class="d-flex gap-1 align-items-center">
                            <p class="text-secondary text-nowrap">지급일시</p>
                            <p style="line-height: 0.8rem;">{formatDatetime(item.createdAt, { includeSeconds: false })}</p>
                        </div>
                        <div class="d-flex gap-1 align-items-center" style="max-width: 55%;">
                            <p class="text-secondary text-nowrap">지급자</p>
                            <UserContact email={item.creator?.email || item.createdBy} style="font-size: 0.7rem; padding: 0.1rem 0.25rem;"/>
                        </div>
                    </div>
                </div>
                {/if}
            </div>
        </div>

        <div slot="spec" let:specItem class="container-fluid g-0">
            <div class="row g-2 m-auto">

                <div class="col-12">
                    <FormField floating from={specItem} noValidate>
                        <input id="training.title" name="훈련 제목" class="form-control">
                    </FormField>
                </div>

                <div class="col-12">
                    <TrainingTypeIndicator trainingType={specItem.training.trainingType} />
                </div>

                <div class="col-12">
                    <FormField floating from={specItem} noValidate>
                        <input id="amount" name="지급량" class="form-control">
                    </FormField>
                </div>

                <div class="col-12">
                    <div class="border rounded p-2">
                        <div class="label-and-value">
                            <p class="label">지급자</p>
                            <UserContact email={specItem.createdBy} />
                        </div>
                        <div class="label-and-value">
                            <p class="label">지급일시</p>
                            <p class="value">{formatDatetime(specItem.createdAt, { includeSeconds: false })}</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <div slot="selectedItem" class="p-1 small border" let:item>
            {#if dataTab === DataTab.BY_TRAIN}
            <p class="text-secondary">{item.email}</p>
            <div class="d-flex gap-2 justify-space-between">
                <p>{item.name}</p>
                <p class="text-secondary">{formatDatetime(item.birthday, { includeTime: false })} 생</p>
            </div>
            {:else if dataTab === DataTab.BY_USER}
            <p class="small" style="font-size: 0.8rem;">{item.title}</p>
            {:else if dataTab === DataTab.REVOKE}
            <p class="text-primary" style="font-size: 0.8rem;">{item.training.title}</p>
            <div class="d-flex gap-2 justify-space-between">
                <p>{item.user.name}</p>
                <p>+{item.amount}</p>
            </div>
            {/if}
            
        </div>

        <div slot="searchOption" bind:this={searchBind}>
            {#if dataTab === DataTab.REVOKE}
            <div class="d-flex gap-1 align-items-center pb-1">
                <FormField floating readonly noEditMark clazz="w-100">
                    <input id="searchStartDate" name="기간 시작" class="form-control"
                    on:click={(e) => {
                        dateSelector?.open(
                            e.currentTarget,
                            '시작 날짜를 선택해주세요',
                            DateMode.DATE
                        )}
                    }
                    />
                </FormField>

                <p>~</p>

                <FormField floating readonly noEditMark clazz="w-100">
                    <input id="searchEndDate" name="기간 끝" class="form-control"
                    on:click={(e) => {
                        dateSelector?.open(
                            e.currentTarget,
                            '끝 날짜를 선택해주세요',
                            DateMode.DATE
                        )}
                    }
                    />
                </FormField>
            </div>
            {/if}
        </div>

        <div slot="top" class="pt-1">
            
            <div class="row g-2">
                {#if dataTab !== DataTab.BY_USER}

                    {#if trainingId}
                    <div class="col-12">
                        {#await (async () => axios.get(`/api/static/trainingHeaderInfo?id=${trainingId}`))() then response}
                            <TrainingHeaderIndicator trainingHeader={response.data} />
                        {/await}

                        {#await (async () => axios.get(`/api/static/trainingTypeInfo?id=${trainingTypeId}`))() then response}
                            <TrainingTypeIndicator trainingType={response.data} clazz="mt-2" />
                        {/await}
                    </div>
                    {/if}

                <div class="col-12">
                    <TrainingSelector bind:trainingId bind:trainingTypeId
                        on:set={switchSortSchemaByTrainingId}
                    />
                </div>

                {:else}
                    <div class="col-12">
                        <UserSelector  />
                    </div>
                {/if}
            </div>

        </div>

    </DataViewer>
</PageContainer>

<DateSelector bind:this={dateSelector} />

<UserTalentGranter bind:this={talentGranter}/>

<style lang="scss">

.talent-icon {
    width: 1.3rem;
    height: 1.3rem;
    opacity: 0.8;
}

.talent-amount {
    min-width: 2rem;
    text-align: right;
    font-weight: bold;
}

</style>
