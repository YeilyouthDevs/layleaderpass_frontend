<script lang="ts">
	import DataViewer from '$lib/components/DataViewer/DataViewer.svelte';
	import type { LimitSchema, SearchSchema, TabSchema, WorkDefinition, WorkSchema, WorkSet } from '$lib/components/DataViewer/script';
	import { WorkType, type SortSchema } from '$lib/components/DataViewer/script';
	import FormField from '$lib/components/FormField.svelte';
	import PageContainer from "$lib/components/PageContainer.svelte";
	import TrainingTypeIndicator from '$lib/components/TrainingTypeIndicator.svelte';
	import UserContact from '$lib/components/UserContact.svelte';
	import { formatDatetime } from '$lib/script/lib/formatDatetime';
	import { UserRole, userStore } from '$lib/stores/userStore';

    const pageTitle = "달란트 지급 관리";
        
    let dataViewer: DataViewer;
    let formBind: Element;
    
    const standbySortSchema: SortSchema = [
        { name: '최신순', value: 'latest' },
    ]

    const searchSchema: SearchSchema = [
        { name: '훈련 제목', value: 'trainingTitle' },
        { name: '사용자 이름', value: 'userName' },
    ]

    const grant: WorkDefinition = {
        name: '지급',
        class: 'btn btn-primary btn-height w-100',
        grid: 'col-6',
        workType: WorkType.ONLY_WORK,
        clickCount: 1,
        render: (workSet?: WorkSet) => true,
        onClick: async (workSet: WorkSet) => {

        }
    }

    const revokeWork: WorkDefinition = {
        name: '회수',
        class: 'btn btn-danger btn-height w-100',
        grid: 'col-6',
        workType: WorkType.ONLY_WORK,
        clickCount: 3,
        render: (workSet?: WorkSet) => true,
        onClick: async (workSet: WorkSet) => {

        }
    }

    const revokeSpec: WorkDefinition = {
        name: '회수',
        class: 'btn btn-danger btn-height w-100',
        grid: 'col-12',
        workType: WorkType.ONLY_SPEC,
        clickCount: 3,
        render: (workSet?: WorkSet) => true,
        onClick: async (workSet: WorkSet) => {

        },
    }

    let idName:string = 'id';
    let fetchURL: string;
    let specURL: string | undefined;
    let limitSchema: LimitSchema = [ 10, 20, 30, 40, 50 ]
    let workSchema: WorkSchema = { grant, revokeSpec, revokeWork };

    enum DataTab { GRANT, REVOKE };
    let dataTab: DataTab = DataTab.REVOKE;

    const tabSchema: TabSchema = [
        {
            name: '지급',
            select: true,
            onClick: () => {
                dataTab = DataTab.GRANT
            }
        },
        {
            name: '기록/회수',
            onClick: () => {
                dataTab = DataTab.REVOKE
            }
        },
    ]

    $: if (dataTab === DataTab.GRANT) {
        idName = 'id';    
        fetchURL = '/api/user/list/list';
        specURL = undefined;
        workSchema = { grant }
    }
     else if(dataTab === DataTab.REVOKE){
        fetchURL = '/api/talentAssignmentManage/list';
        specURL = '/api/talentAssignmentManage/spec';
        workSchema = { revokeSpec, revokeWork }
    }

</script>

<PageContainer title={pageTitle}>
    <DataViewer bind:this={dataViewer} 
        sortSchema={standbySortSchema}
        bind:limitSchema
        bind:workSchema
        bind:idName
        {tabSchema}
        {searchSchema}
        {fetchURL}
        {specURL}
        itemWrapClass="row gx-0 mb-2 border-top border-bottom"
        useWorkUI={$userStore.role === UserRole.ADMIN}
    >
        <div slot="item" class="w-100" let:item>
            <div class="border-top border-bottom p-2" style="min-height: 3rem;">
                {#if dataTab === DataTab.GRANT}
                <div class="d-flex flex-column flex-grow-1">
                    <div class="overflow-scroll">
                        <p class="small text-pretty text-primary">{item.training.title}</p>
                    </div>
                    <div class="d-flex gap-3">
                        <p>{item.user.name}</p>
                        <p class="small text-secondary">{formatDatetime(item.user.birthday, { includeTime: false, includeWeekDay: false })} 생</p>
                    </div>
                    <div class="small text-secondary">
                        {formatDatetime(item.createdAt, { includeSeconds: false })} 지급
                    </div>
                </div>
                <div class="d-flex gap-1 align-items-center">
                    <p class="small">+</p>
                    <img class="talent-icon" src="/images/talent_icon.png" alt="달란트아이콘">
                    <p class="talent-amount">{item.amount}</p>
                </div>
                {:else if dataTab === DataTab.REVOKE}
                <div class="d-flex justify-space-between">
                    <div class="d-flex flex-column flex-grow-1">
                        <div class="overflow-scroll">
                            <p class="small text-pretty text-primary">{item.training.title}</p>
                        </div>
                        <div class="d-flex gap-3">
                            <p>{item.user.name}</p>
                            <p class="small text-secondary">{formatDatetime(item.user.birthday, { includeTime: false, includeWeekDay: false })} 생</p>
                        </div>
                        <div class="small text-secondary">
                            {formatDatetime(item.createdAt, { includeSeconds: false })} 지급
                        </div>
                    </div>
                    <div class="d-flex gap-1 align-items-center">
                        <p class="small">+</p>
                        <img class="talent-icon" src="/images/talent_icon.png" alt="달란트아이콘">
                        <p class="talent-amount">{item.amount}</p>
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

        <div slot="selectedItem" class="p-1 small border col-12 col-sm-6 d-flex align-items-center gap-2" let:item>
            <p class="text-secondary">{item.training.title}</p>
            <div class="d-flex gap-2 justify-space-between">
                <p>{item.user.name}</p>
                <p>+{item.amount}</p>
            </div>
        </div>
       

    </DataViewer>
</PageContainer>

<style lang="scss">

</style>
