<script lang="ts">
	import TrainingHeaderIndicator from '$lib/components/TrainingHeaderIndicator.svelte';
	import DataViewer from '$lib/components/DataViewer/DataViewer.svelte';
	import type { LimitSchema, SearchSchema, WorkDefinition, WorkSchema, WorkSet } from '$lib/components/DataViewer/script';
	import { WorkType, handleWork, type SortSchema, type TabSchema } from '$lib/components/DataViewer/script';
	import FormField from '$lib/components/FormField.svelte';
	import PageContainer from "$lib/components/PageContainer.svelte";
	import TimeStamp from '$lib/components/TimeStamp.svelte';
	import TrainingTypeIndicator from '$lib/components/TrainingTypeIndicator.svelte';
	import { formatDatetime } from '$lib/script/lib/formatDatetime';
	import { Validation, type ValidationSchema } from '$lib/script/lib/validation';
	import { alertStore } from '$lib/stores/alertStore';
	import { UserRole, userStore } from '$lib/stores/userStore';
	import axios from 'axios';
	import { positiveIntegerSchema } from 'llp-validator';

    const pageTitle = "지급 관리";
        
    let dataViewer: DataViewer;
    let formBind: Element;
    let fetchURL: string;
    let specURL: string;
    let idName:string;
    let sortSchema: SortSchema;
    let searchSchema: SearchSchema;

    const talentGrantSortSchema: SortSchema = [
        { name: '가나다순', value: 'abc' },
        { name: '지급량순', value: 'talentGreater' },
    ]

    const talentAssignmentSortSchema: SortSchema = [
        { name: '최신순', value: 'latest' },
    ]

    const talentGrantSearchSchema: SearchSchema = [
        { name: '이름', value: 'name' }
    ]

    const talentAssignmentSearchSchema: SearchSchema = [
        { name: '이름', value: 'name' }
    ]

    let limitSchema: LimitSchema = [ 10, 20, 30, 40, 50 ]

    let workSchema: WorkSchema;

    enum DataTab { TALENT_GRANT, TALENT_ASSIGNMENT};
    let dataTab: DataTab = DataTab.TALENT_GRANT;

    const tabSchema: TabSchema = [
        {
            name: '달란트 지급',
            select: true,
            onClick: () => {
                dataTab = DataTab.TALENT_GRANT
            }
        },
        {
            name: '지급 기록',
            onClick: () => {
                dataTab = DataTab.TALENT_ASSIGNMENT
            }
        },
    ]

    $: if (dataTab === DataTab.TALENT_GRANT) {
        idName = 'email';
        fetchURL = '/api/trainingManage/list/talentGrant';
        specURL = '/api/trainingManage/spec/talentGrant';
        sortSchema = talentGrantSortSchema;
        searchSchema = talentGrantSearchSchema;
        workSchema = { grantTalent, grantTalentConfirm }
    } else if(dataTab === DataTab.TALENT_ASSIGNMENT){
        idName = 'id';
        fetchURL = '/api/trainingManage/list/talentAssignment';
        specURL = '/api/trainingManage/spec/talentAssignment';
        sortSchema = talentAssignmentSortSchema;
        searchSchema = talentAssignmentSearchSchema;
        workSchema = { revokeTalent }
    } 
    const urlParams = new URLSearchParams(window.location.search);
    let fetchPayload: Record<string, any> = {
        trainingTypeId: urlParams.get('trainingTypeId'),
        trainingId: urlParams.get('trainingId')
    }

    enum WorkPage {
        TALENT_GRANT
    }

    let workPage: WorkPage | null = null;

    const grantTalent: WorkDefinition = {
        name: '지급',
        class: 'btn btn-success btn-height w-100',
        grid: 'col-12',
        workType: WorkType.BOTH,
        min: 1,
        clickCount: 1,
        render: () => workPage === null,
        onClick: async (workSet: WorkSet) => {
            dataViewer.closeWorkMenu();
            await dataViewer.closeSpec();

            workPage = WorkPage.TALENT_GRANT
            dataViewer.openSpec({ item: workSet.specItem, skipFetch: true });
        }
    }

    const grantTalentConfirm: WorkDefinition = {
        name: '완료',
        class: 'btn btn-success btn-height w-100',
        grid: 'col-12',
        workType: WorkType.ONLY_SPEC,
        clickCount: 3,
        render: () => workPage === WorkPage.TALENT_GRANT,
        onClick: async (workSet: WorkSet) => {
            const values = Validation.checkAndGetValues(formBind, { scopeNames: ['talentGrant'] })

            console.log(values);

            return await handleWork(dataViewer, {
                url: '/api/trainingManage/work/talentGrant',
                method: 'POST',
                payload: { 
                    targets: [...workSet.selectedItems.keys()],
                    trainingId: urlParams.get('trainingId'),
                    amount: values!.talentGrantAmount
                },
                onSuccessOne(item, result) {
                    alertStore.success({
                        title: '달란트 지급 완료',
                        content: result.message!,
                        duration: 3000,
                    })
                },
                onFailOne(item, result) {
                    alertStore.fail({
                        title: '달란트 지급 실패',
                        content: result.message!,
                        duration: 3000,
                    })
                },
                toString: (item) => item.name
            })
        }
    }

    const revokeTalent: WorkDefinition = {
        name: '회수',
        class: 'btn btn-danger btn-height w-100',
        grid: 'col-12',
        workType: WorkType.BOTH,
        min: 1,
        render: (workSet?: WorkSet) => !(workSet?.specItem?.deletedAt),
        onClick: async (workSet: WorkSet) => {
            return await handleWork(dataViewer, {
                url: '/api/trainingManage/work/talentRevoke',
                method: 'PUT',
                payload: { 
                    targets: [...workSet.selectedItems.keys()]
                },
                onSuccessOne(item, result) {
                    alertStore.success({
                        title: '달란트 회수 완료',
                        content: result.message!,
                        duration: 3000,
                    })
                },
                onFailOne(item, result) {
                    alertStore.fail({
                        title: '달란트 회수 실패',
                        content: result.message!,
                        duration: 3000,
                    })
                },
                toString: (item) => item.user.name
            })
        }
    }

    const talentValidation: ValidationSchema = {
        displayOnEmpty: true,
        handler: (el) => {
            const { error } = positiveIntegerSchema.not('').messages({
                'any.invalid': '필수값입니다.'
            }).validate(el.value.trim())
            return error?.message;
        },
    }

    function onHideSpec(){
        workPage = null;
    }

</script>

<PageContainer title={pageTitle}>
    <div class="row g-2 mt-2">
        <div class="col-12">
            {#await (async () => axios.get(`/api/static/trainingHeaderInfo?id=${fetchPayload.trainingId}`))() then response}
                <TrainingHeaderIndicator trainingHeader={response.data} />
            {/await}
        </div>

        <div class="col-12">
            {#await (async () => axios.get(`/api/static/trainingTypeInfo?id=${fetchPayload.trainingTypeId}`))() then response}
                <TrainingTypeIndicator trainingType={response.data} />
            {/await}
        </div>
    </div>
    
    <DataViewer bind:this={dataViewer} 
        bind:sortSchema
        bind:limitSchema
        bind:workSchema
        bind:searchSchema
        bind:idName
        {fetchPayload} {tabSchema}
        {fetchURL}
        {specURL}
        itemWrapClass="row gx-0 mb-2 border-top border-bottom"
        useWorkUI={$userStore.role === UserRole.ADMIN}
        on:hide-spec={onHideSpec}
        showSearchOption={true}
    >

        <div slot="item" class="w-100" let:item>
            <div class="item border-top border-bottom p-2 d-flex align-items-center justify-content-between" style="min-height: 3rem;">

                {#if dataTab === DataTab.TALENT_GRANT}
                <div class="d-flex flex-column justify-content-center">
                    <p class="name">{item.name}</p>
                    <p class="small text-secondary">{formatDatetime(item.birthday, { includeTime: false })} 생</p>
                </div>
                <div class="d-flex gap-1 align-items-center justify-content-between">
                    <p class="small text-secondary text-nowrap">합계</p>
                    <img class="talent-icon" src="/images/talent_icon.png" alt="달란트아이콘">
                    <p class="talent-amount">{item.talentSum || 0}</p>
                </div>

                {:else if dataTab === DataTab.TALENT_ASSIGNMENT}
                <div class="d-flex flex-column justify-content-center">
                    <div class="d-flex flex-column justify-content-center">
                        <!-- <p class="small text-secondary">ID: {item.id}</p> -->
                        <p class="name">{item.user.name}</p>
                    </div>
                    <p class="small text-secondary">{formatDatetime(item.deletedAt || item.createdAt, { includeSeconds: false })}</p>
                </div>
                <div class="d-flex gap-1 align-items-center justify-content-between">
                    {#if item.deletedAt}
                    <p class="assignment-state-badge assignment-revoked">회수</p>
                    {:else}
                    <p class="assignment-state-badge assignment-granted">지급</p>
                    {/if}
                    
                    <img class="talent-icon" src="/images/talent_icon.png" alt="달란트아이콘">
                    <p class="talent-amount">{item.amount}</p>
                </div>

                {/if}
            </div>
        </div>

        <div slot="spec" let:specItem class="container-fluid g-0" bind:this={formBind}>
            <div class="row g-2 m-auto">
                {#if dataTab === DataTab.TALENT_GRANT}
                    {#if workPage === null}
                    <div class="col-12">
                        <FormField floating from={specItem} noValidate>
                            <input id="email" name="이메일" class="form-control">
                        </FormField>
                    </div>
                    <div class="col-12">
                        <FormField floating from={specItem} noValidate>
                            <input id="name" name="이름" class="form-control">
                        </FormField>
                    </div>
                    <div class="col-12">
                        <FormField floating from={specItem?.talentSums[0]?.sum || '0'} noValidate>
                            <input id="talentSum" name="이 훈련에서 획득한 달란트" class="form-control">
                        </FormField>
                    </div>
                    <div class="col-12">
                        <FormField floating from={specItem} noValidate>
                            <input id="phone" name="연락처" class="form-control">
                        </FormField>
                    </div>
                    <div class="col-12">
                        <FormField floating from={formatDatetime(specItem?.birthday, { includeTime: false })} noValidate>
                            <input id="birthday" name="생년월일" class="form-control">
                        </FormField>
                    </div>

                    {:else if workPage === WorkPage.TALENT_GRANT}
                        <div class="col-12">
                            <div class="text-center small">
                                {#if specItem}
                                <p><b>{specItem.name}</b>에게 얼마를 지급할까요?</p>
                                {:else}
                                <p>총 <b>{dataViewer.getSelectedItems().size}</b> 명 에게 얼마를 지급할까요?</p>
                                {/if}
                            </div>
                        </div>
                        <div class="col-12">
                            <FormField floating asType="number" validation={talentValidation} let:validate dataScope="talentGrant">
                                <input id="talentGrantAmount" name="지급량" class="form-control"
                                    on:input={e => validate(e.currentTarget)}>
                            </FormField>
                        </div>

                    {/if}

                {:else if dataTab === DataTab.TALENT_ASSIGNMENT}

                    {#if workPage === null}
                    <div class="col-12">
                        <FormField floating from={specItem} noValidate>
                            <input id="user.email" name="이메일" class="form-control">
                        </FormField>
                    </div>
                    <div class="col-12">
                        <FormField floating from={specItem} noValidate>
                            <input id="user.name" name="이름" class="form-control">
                        </FormField>
                    </div>
                    <div class="col-12">
                        <FormField floating from={specItem} noValidate>
                            <input id="amount" name="지급량" class="form-control">
                        </FormField>
                    </div>
                    <div class="col-12">
                        <FormField floating from={formatDatetime(specItem?.createdAt, { includeSeconds: false }) } noValidate>
                            <input id="createdAt" name="지급일시" class="form-control">
                        </FormField>
                    </div>
                    {#if specItem.deletedAt}
                    <div class="col-12">
                        <FormField floating from={formatDatetime(specItem?.deletedAt, { includeSeconds: false }) } noValidate>
                            <input id="deletedAt" name="회수일시" class="form-control">
                        </FormField>
                    </div>
                    {/if}

                    <div class="col-12">
                        <TimeStamp createdAt={specItem.createdAt} updatedBy={specItem.updatedBy}
                            createdAtLabel="지급일시" updatedByLabel="지급자"
                        />
                    </div>
                    {/if}

                {/if}
            </div>
        </div>

        <div slot="selectedItem" class="p-1 small border col-12 col-sm-6" let:item>
            {#if dataTab === DataTab.TALENT_GRANT}
            <div>
                <p class="text-secondary">{item.email}</p>
                <div class="d-flex gap-2 justify-space-between">
                    <p>{item.name}</p>
                    <p class="text-secondary">{formatDatetime(item.birthday, { includeTime: false })} 생</p>
                </div>
            </div>
            {:else if dataTab === DataTab.TALENT_ASSIGNMENT}
            <div>
                <div class="d-flex gap-2 justify-space-between">
                    <p>{item.user.name}</p>
                    <p>+{item.amount}</p>
                    <p class="text-secondary">{formatDatetime(item.createdAt, { includeTime: false} )}</p>
                </div>
            </div>
            {/if}
        </div>

    </DataViewer>
</PageContainer>

<style lang="scss">

    .talent-icon {
        width: 1.3rem;
        height: 1.3rem;
        opacity: 0.8;
    }

    .talent-amount {
        min-width: 1.2rem;
        text-align: right;
    }

    .assignment-state-badge {
        border-radius: 0.25rem;
        color: white;
        font-size: 0.9rem;
        padding: 0.175rem 0.25rem;
        width: 2.5rem;
        height: 1.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .assignment-granted {
        background-color: rgb(93, 182, 161);
    }

    .assignment-revoked {
        background-color: rgb(221, 116, 116);
    }

    .item {
        .name {
            text-wrap: balance;
        }
    }
</style>


