<script lang="ts">
	import DataViewer from '$lib/components/DataViewer/DataViewer.svelte';
	import type { LimitSchema, SearchSchema, WorkDefinition, WorkSchema, WorkSet } from '$lib/components/DataViewer/script';
	import { handleWork, WorkType, type SortSchema, type TabSchema } from '$lib/components/DataViewer/script';
	import FileManager from '$lib/components/FileManager/FileManager.svelte';
	import FlexibleTextarea from '$lib/components/FlexibleTextarea.svelte';
	import FormField from '$lib/components/FormField.svelte';
	import MultiClickDiv from '$lib/components/MultiClickDiv.svelte';
	import PageContainer from "$lib/components/PageContainer.svelte";
	import TrainingTypeIndicator from '$lib/components/TrainingTypeIndicator.svelte';
	import UserContact from '$lib/components/UserContact.svelte';
	import { formatDatetime } from '$lib/script/lib/formatDatetime';
	import { Validation } from '$lib/script/lib/validation';
	import { notEmptyValidation, talentValidation } from '$lib/script/lib/validationSchemas';
	import { alertStore } from '$lib/stores/alertStore';
	import { loadingStore } from '$lib/stores/loadingStore';
	import { UserRole, userStore } from '$lib/stores/userStore';

    const pageTitle = "자료제출 관리";
        
    let dataViewer: DataViewer;
    let formBind: Element;
    let fetchURL: string;
    let specURL: string;
    let fileManager: FileManager;

    let idName:string;
    
    const standbySortSchema: SortSchema = [
        { name: '최신순', value: 'latest' },
        { name: '가나다순', value: 'abc' },
    ]

    const searchSchema: SearchSchema = [
        { name: '훈련 제목', value: 'trainingTitle' },
        { name: '훈련 타입', value: 'trainingType' },
        { name: '사용자이름', value: 'userName' },
    ]

    let limitSchema: LimitSchema = [ 10, 20, 30, 40, 50 ]
    let workSchema: WorkSchema;

    enum DataTab { STANDBY, APPROVED, REJECTED };
    let dataTab: DataTab = DataTab.STANDBY;

    const tabSchema: TabSchema = [
        {
            name: '대기',
            select: true,
            onClick: () => {
                dataTab = DataTab.STANDBY
            }
        },
        {
            name: '승인',
            onClick: () => {
                dataTab = DataTab.APPROVED
            }
        },
        {
            name: '거절',
            onClick: () => {
                dataTab = DataTab.REJECTED
            }
        }
    ]


    $: if (dataTab === DataTab.STANDBY) {
        idName = 'id';    
        fetchURL = '/api/submissionManage/list/standby';
        specURL = '/api/submissionManage/spec/standby';
        workSchema = { remove, grant, reject, revoke, removeLongButton }
    }
     else if(dataTab === DataTab.APPROVED){
        fetchURL = '/api/submissionManage/list/approved';
        specURL = '/api/submissionManage/spec/approved';
    }
     else if (dataTab === DataTab.REJECTED) {
        fetchURL = '/api/submissionManage/list/rejected';
        specURL = '/api/submissionManage/spec/rejected';
    }

    const grant: WorkDefinition = {
        name: '승인',
        class: 'btn btn-success btn-height w-100',
        grid: 'col-4',
        workType: WorkType.ONLY_SPEC,
        clickCount: 1,
        render: (workSet?: WorkSet) => {
            const specItem = workSet?.specItem;
            if (dataTab === DataTab.STANDBY && specItem?.confirm !== true) return true;

            return false;
        },
        onClick: async (workSet: WorkSet) => {
           process = 'grant';
        }
    }

    const reject: WorkDefinition = {
        name: '거절',
        class: 'btn btn-danger btn-height w-100',
        grid: 'col-4',
        workType: WorkType.ONLY_SPEC,
        clickCount: 1,
        render: (workSet?: WorkSet) => {
            const specItem = workSet?.specItem;
            if (dataTab === DataTab.STANDBY && specItem?.confirm !== true) return true;

            return false;
        },
        onClick: async (workSet: WorkSet) => {
           process = 'reject'
        }
    }

    const remove: WorkDefinition = {
        name: '삭제',
        class: 'btn btn-secondary btn-height w-100',
        grid: 'col-4',
        workType: WorkType.ONLY_SPEC,
        clickCount: 3,
        render: (workSet?: WorkSet) => {
            const specItem = workSet?.specItem;
            if (dataTab === DataTab.STANDBY && specItem?.confirm === null) return true;

            return false;
        },
        onClick: async (workSet: WorkSet) => {
            await requestDelete(workSet.specItem)
            dataViewer.closeSpec(true);
        }
    }

    const removeLongButton: WorkDefinition = {
        name: '삭제',
        class: 'btn btn-secondary btn-height w-100',
        grid: 'col-12',
        workType: WorkType.ONLY_SPEC,
        clickCount: 3,
        render: (workSet?: WorkSet) => {
            const specItem = workSet?.specItem;
            if (dataTab === DataTab.REJECTED && specItem?.confirm === false) return true;

            return false;
        },
        onClick: async (workSet: WorkSet) => {
            await requestDelete(workSet.specItem)
            dataViewer.closeSpec(true);
        }
    }

    const revoke: WorkDefinition = {
        name: '승인 철회',
        class: 'btn btn-secondary btn-height w-100',
        grid: 'col-12',
        workType: WorkType.ONLY_SPEC,
        clickCount: 3,
        render: (workSet?: WorkSet) => {
            const specItem = workSet?.specItem;
            if (dataTab === DataTab.APPROVED && specItem.confirm === true) return true;

            return false;
        },
        onClick: async (workSet: WorkSet) => {
            await requestRevoke(workSet.specItem);
            dataViewer.closeSpec(true);
        }
    }

    function onHideSpec(){
        process = null;
    }

    function getConfirmLabel(label: any) {
        if (label === false) return '거절'
        else if (label === true) return '승인'
        else return '대기'
    }

    let process: 'grant' | 'reject' | 'revoke' | null = null;

    async function applyProcess() {
        loadingStore.show();

        try {
            const specItem = dataViewer.getSpecItem();
            const values = Validation.checkAndGetValues(formBind);
            if (!values) return;

            if (process === 'grant') {
                await requestGrant(specItem, values);
            } else if (process === 'reject') {
                await requestReject(specItem, values);
            } else if (!process){
                await requestRevoke(specItem);
            }    

            dataViewer.closeSpec(true);
        } catch (error) {
            console.error(error)   
        } finally {
            loadingStore.hide();
        }
    }

    async function requestGrant(specItem: any, values: any) {
        const amount = values?.grantAmount

        await dataViewer.doSomeWork({
            name: '승인',
            class: '',
            workType: WorkType.BOTH,
            render: () => true,
            onClick: async (workSet: WorkSet) => {
                return await handleWork(dataViewer, {
                    url: '/api/submissionManage/grant',
                    method: 'POST',
                    payload: { 
                        id: specItem.id,
                        targetEmail: specItem.user.email,
                        targetName: specItem.user.name,
                        trainingId: specItem.training.id,
                        amount,
                    },
                    onSuccessOne: (item, result) => {
                        alertStore.success({
                            title: '승인 및 지급 완료',
                            content: result.message!,
                            duration: 3000
                        });
                    },
                    onFailOne: (item, result) => {
                        alertStore.fail({
                            title: '승인 및 지급 실패',
                            content: result.message!,
                            duration: 3000
                        });
                    }
                });
            }
        })
    }

    async function requestReject(specItem: any, values: any) {
        const reason = values?.reason

        await dataViewer.doSomeWork({
            name: '거절',
            class: '',
            workType: WorkType.BOTH,
            render: () => true,
            onClick: async (workSet: WorkSet) => {
                return await handleWork(dataViewer, {
                    url: '/api/submissionManage/reject',
                    method: 'POST',
                    payload: { 
                        id: specItem.id,
                        reason,
                    },
                    onSuccessOne: (item, result) => {
                        alertStore.success({
                            title: '거절 완료',
                            content: result.message!,
                            duration: 3000
                        });
                    },
                    onFailOne: (item, result) => {
                        alertStore.fail({
                            title: '거절 실패',
                            content: result.message!,
                            duration: 3000
                        });
                    }
                });
            }
        })

    }

    
    async function requestRevoke(specItem: any) {

        await dataViewer.doSomeWork({
            name: '거절',
            class: '',
            workType: WorkType.BOTH,
            render: () => true,
            onClick: async (workSet: WorkSet) => {
                return await handleWork(dataViewer, {
                    url: '/api/submissionManage/revoke',
                    method: 'POST',
                    payload: { 
                        id: specItem.id,
                    },
                    onSuccessOne: (item, result) => {
                        alertStore.success({
                            title: '승인 철회 완료',
                            content: result.message!,
                            duration: 3000
                        });
                    },
                    onFailOne: (item, result) => {
                        alertStore.fail({
                            title: '승인 철회 실패',
                            content: result.message!,
                            duration: 3000
                        });
                    }
                });
            }
        })
    }

    async function requestDelete(specItem: any) {
        await dataViewer.doSomeWork({
            name: '제거',
            class: '',
            workType: WorkType.BOTH,
            render: () => true,
            onClick: async (workSet: WorkSet) => {
                return await handleWork(dataViewer, {
                    url: '/api/submissionManage/delete',
                    method: 'POST',
                    payload: { 
                        id: specItem.id
                    },
                    onSuccessOne: (item, result) => {
                        alertStore.success({
                            title: '자료제출 삭제 완료',
                            content: result.message!,
                            duration: 3000
                        });
                    },
                    onFailOne: (item, result) => {
                        alertStore.fail({
                            title: '자료제출 삭제 실패',
                            content: result.message!,
                            duration: 3000
                        });
                    }
                });
            }
        })
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
        on:hide-spec={onHideSpec}
    >

        <div slot="item" class="w-100" let:item>
            <div class="border-top border-bottom p-2 d-flex align-items-center justify-content-between" style="min-height: 3rem;">

                <div class="d-flex">
                    <div class="d-flex flex-column">
                        <div class="overflow-scroll">
                            <p class="small text-pretty text-primary">{item.training.title}</p>
                        </div>
                        <div class="d-flex gap-3">
                            <p>{item.user.name}</p>
                            <p class="small text-secondary">{formatDatetime(item.user.birthday, { includeTime: false, includeWeekDay: false })} 생</p>
                        </div>
                        <div class="small text-secondary">
                            {formatDatetime(item.createdAt, { includeSeconds: false })} 제출
                        </div>
                    </div>
                </div>
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
                    <div class="border rounded p-2">
                        <div class="label-and-value">
                            <p class="label">제출자</p>
                            <UserContact email={specItem.user.email} />
                        </div>
                        <div class="label-and-value">
                            <p class="label">제출일시</p>
                            <p class="value">{formatDatetime(specItem.createdAt, { includeSeconds: false })}</p>
                        </div>
                        {#if specItem.confirmedBy}
                        <div class="label-and-value">
                            <p class="label">처리자</p>
                            <UserContact email={specItem.confirmedBy} />
                        </div>     
                        {/if}
                        {#if specItem.confirmedAt}
                        <div class="label-and-value">
                            <p class="label">처리일시</p>
                            <p class="value">{formatDatetime(specItem.confirmedAt, { includeSeconds: false })}</p>
                        </div>
                        {/if}
                    </div>
                </div>

                <div class="col-12">
                    <div class="form-floating">
                        <p class="form-control">
                            {getConfirmLabel(specItem.confirm)}
                        </p>
                        <!-- svelte-ignore a11y-label-has-associated-control -->
                        <label>승인 여부</label>
                    </div>
                </div>

                {#if specItem?.confirm === false}
                <div class="col-12">
                    <FormField floating from={specItem} noValidate>
                        <FlexibleTextarea id="reason" name="거절 이유" clazz="form-control" height="6rem" foldable={dataTab === DataTab.REJECTED} />
                    </FormField>
                </div>
                {/if}
                

                <div class="col-12">
                    <FileManager bind:this={fileManager} fileSetId={specItem?.fileSetId} />
                </div>

                <div class="col-12">
                    <FormField floating from={specItem} noValidate>
                        <FlexibleTextarea id="content" name="내용" clazz="form-control" height="6rem" foldable/>
                    </FormField>
                </div>
              
            </div>
        </div>

        <div slot="underButtons" let:specItem class="row g-2 mt-1" bind:this={formBind}>

            {#if process === 'grant'}
            <div class="col-12">
                <FormField floating from={specItem} validation={talentValidation} let:validate>
                    <input id="grantAmount" name="얼마를 지급할까요?" class="form-control"
                        on:input={(e) => validate(e.currentTarget)}
                    >
                </FormField>
            </div>
            {:else if process === 'reject'}
            <div class="col-12">
                <FormField floating from={specItem} validation={notEmptyValidation} let:validate>
                    <FlexibleTextarea id="reason" name="거절 이유" clazz="form-control" height="4rem" editMode
                        on:input={(e) => validate(e.detail)}
                    />
                </FormField>
            </div>
            {/if}

            {#if process}
                 <div class="col-12">
                    <MultiClickDiv clazz="btn btn-primary btn-height w-100" callback={() => { applyProcess() }}>완료</MultiClickDiv>
                 </div>
            {/if}
        </div>
    </DataViewer>
</PageContainer>

<style lang="scss">
.label-and-value {
    display: flex;
    align-items: center;
    gap: 0.4rem;

    font-size: 0.9rem;

    .label {
        min-width: 3.5rem;
        font-weight: bold;
    }
}
   
</style>
