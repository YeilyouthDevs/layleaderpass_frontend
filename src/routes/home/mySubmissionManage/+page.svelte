<script lang="ts">
	import DataViewer from '$lib/components/DataViewer/DataViewer.svelte';
	import type { LimitSchema, SearchSchema, WorkDefinition, WorkSchema, WorkSet } from '$lib/components/DataViewer/script';
	import { WorkType, type SortSchema, type TabSchema } from '$lib/components/DataViewer/script';
	import FileManager from '$lib/components/FileManager/FileManager.svelte';
	import FileSender from '$lib/components/FileManager/FileSender';
	import FlexibleTextarea from '$lib/components/FlexibleTextarea.svelte';
	import FormField from '$lib/components/FormField.svelte';
	import PageContainer from "$lib/components/PageContainer.svelte";
	import TrainingHeaderIndicator from '$lib/components/TrainingHeaderIndicator.svelte';
	import TrainingTypeIndicator from '$lib/components/TrainingTypeIndicator.svelte';
	import UserContact from '$lib/components/UserContact.svelte';
	import { formatDatetime } from '$lib/script/lib/formatDatetime';
	import { Validation } from '$lib/script/lib/validation';
	import { alertStore } from '$lib/stores/alertStore';
	import axios from 'axios';

    const pageTitle = "내 자료제출 관리";
        
    let dataViewer: DataViewer;
    let formBind: Element;
    let fetchURL: string;
    let specURL: string;
    let fileManager: FileManager;

    let idName:string;
    
    const standbySortSchema: SortSchema = [
        { name: '최신순', value: 'latest' },
    ]

    const searchSchema: SearchSchema = [
        { name: '훈련제목', value: 'trainingTitle' },
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
        fetchURL = '/api/mySubmissionManage/list/standby';
        specURL = '/api/mySubmissionManage/spec/standby';
        workSchema = { revokeSubmission: revoke, edit, requestAgain }
    }
     else if(dataTab === DataTab.APPROVED){
        fetchURL = '/api/mySubmissionManage/list/approved';
        specURL = '/api/mySubmissionManage/spec/approved';
    }
     else if (dataTab === DataTab.REJECTED) {
        fetchURL = '/api/mySubmissionManage/list/rejected';
        specURL = '/api/mySubmissionManage/spec/rejected';
    }
    
    const edit: WorkDefinition = {
        name: '수정',
        class: 'btn btn-secondary btn-height w-100',
        grid: 'col-6',
        workType: WorkType.ONLY_SPEC,
        clickCount: 3,
        render: (workSet?: WorkSet) => {
            const specItem = workSet?.specItem;
            if (dataTab === DataTab.STANDBY && specItem.confirm === null) return true;
            return false;
        },
        onClick: async (workSet: WorkSet) => {
            const specItem = workSet?.specItem;
            requestEdit({ requestAgain: false, confirm: specItem.confirm })
        }
    }

    const requestAgain: WorkDefinition = {
        name: '수정 및 재요청',
        class: 'btn btn-primary btn-height w-100',
        grid: 'col-6',
        workType: WorkType.ONLY_SPEC,
        clickCount: 3,
        render: (workSet?: WorkSet) => {
            const specItem = workSet?.specItem;
            if (dataTab === DataTab.REJECTED && specItem.confirm === false) return true;

            return false;
        },
        onClick: async (workSet: WorkSet) => {
            const specItem = workSet?.specItem;
            requestEdit({ requestAgain: true, confirm: specItem.confirm })
        }
    }

    const revoke: WorkDefinition = {
        name: '제출 취소',
        class: 'btn btn-danger btn-height w-100',
        grid: 'col-6',
        workType: WorkType.ONLY_SPEC,
        render: (workSet?: WorkSet) => {
            const specItem = workSet?.specItem;
            return (specItem.confirm !== true) ? true : false
        },
        onClick: async (workSet: WorkSet) => {

            const response = await axios.post('/api/mySubmissionManage/revoke', {
                submissionId: workSet.specItem.id
            })

            const result = response.data;

            if (result.status) {
                alertStore.success({
                    title: '자료제출 취소 완료',
                    content: result.message!,
                    duration: 3000,
                })

                dataViewer.closeSpec(true);
            } else {
                alertStore.fail({
                    title: '자료제출 취소 실패',
                    content: result.message!,
                    duration: 3000,
                })
            }
        }
    }

    async function requestEdit(args: { requestAgain: boolean, confirm: boolean }){
        const specItem = dataViewer.getSpecItem();
        const values = Validation.getValues(formBind, { allowEmpty: true });
        if (!values) return;

        const displayFiles = fileManager.getDisplayFiles();

        if (displayFiles.length == 0 && !values.content) {
            alertStore.warn({
                content: '1개 이상의 파일을 첨부하거나 내용을 작성해야합니다.',
                duration: 3000
            })

            return;
        }

        const result = await FileSender.send('/api/mySubmissionManage/edit', specItem.fileSetId, fileManager.getFiles(), {
            id: specItem.id,
            requestAgain: args.requestAgain,
            content: values.content,
            confirm: args.confirm,
        })
    
        if (result.status) {
            alertStore.success({
                title: '자료제출 수정 완료',
                content: result.message!,
                duration: 3000
            });

            dataViewer.closeSpec(true);
        } else {
            alertStore.fail({
                title: '자료제출 수정 실패',
                content: result.message!,
                duration: 3000
            });
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
        useWorkUI={false}
        on:hide-spec={onHideSpec}
    >

        <div slot="item" class="w-100" let:item>
            <div class="border-top border-bottom p-2 d-flex align-items-center justify-content-between" style="min-height: 3rem;">
                <div class="d-flex">
                    <div class="d-flex flex-column">
                        <p class="text-pretty">{item.training.title}</p>
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
                    <TrainingHeaderIndicator trainingHeader={specItem.training}/>
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
                        <FlexibleTextarea id="reason" name="거절 이유" clazz="form-control" height="4rem" foldable/>
                    </FormField>
                </div>
                {/if}
                
                <div class="col-12">
                    <FileManager bind:this={fileManager} fileSetId={specItem?.fileSetId} editMode={specItem?.confirm !== true}/>
                </div>

                <div class="col-12" bind:this={formBind}>
                    <FormField floating from={specItem} noValidate={specItem?.confirm === true}>
                        <FlexibleTextarea id="content" name="내용" clazz="form-control" height="6rem" editMode />
                    </FormField>
                </div>
              
            </div>
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
