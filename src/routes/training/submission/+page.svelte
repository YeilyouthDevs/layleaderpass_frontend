<script lang="ts">
	import SimpleDesc from './../../../lib/components/SimpleDesc.svelte';
	import DataViewer from "$lib/components/DataViewer/DataViewer.svelte";
	import { FormMode, WorkType, type LimitSchema, type SearchSchema, type SortSchema, type WorkDefinition, type WorkSchema, type WorkSet } from "$lib/components/DataViewer/script";
	import FileManager from "$lib/components/FileManager/FileManager.svelte";
	import FileSender from "$lib/components/FileManager/FileSender";
	import FlexibleTextarea from '$lib/components/FlexibleTextarea.svelte';
	import FormField from "$lib/components/FormField.svelte";
	import PageContainer from "$lib/components/PageContainer.svelte";
	import TrainingHeaderIndicator from "$lib/components/TrainingHeaderIndicator.svelte";
	import TrainingTypeIndicator from "$lib/components/TrainingTypeIndicator.svelte";
	import UserContact from '$lib/components/UserContact.svelte';
	import { formatDatetime } from '$lib/script/lib/formatDatetime.js';
	import { Validation } from "$lib/script/lib/validation";
	import { alertStore } from "$lib/stores/alertStore";
	import axios from "axios";
	import { onMount } from "svelte";

    const pageTitle = "인증자료 제출"

    let dataViewer: DataViewer;
    let formBind: Element;
    let formMode = FormMode.READ;
    let fileManager: FileManager;
    
    const sortSchema: SortSchema = [
        { name: '최신순', value: 'latest' },
    ]

    const searchSchema: SearchSchema = [
        { name: '날짜', value: 'date' },
    ]

    const limitSchema: LimitSchema = [ 10, 20, 30, 40, 50 ]
    let workSchema: WorkSchema;

    onMount(() => {
        workSchema = { createConfirm, deleteSubmission, editConfirm, requestAgain }
    })

    const createConfirm: WorkDefinition = {
        name: '제출',
        class: 'btn btn-success btn-height w-100',
        grid: 'col-12',
        workType: WorkType.ONLY_SPEC,
        clickCount: 3,
        render: (workSet?: WorkSet) => {
            if (formMode !== FormMode.CREATE) return false;

            const specItem = workSet?.specItem;
            return (!specItem) ? true : false
        },
        onClick: async (workSet: WorkSet) => {
            
            const values = Validation.getValues(formBind, { allowEmpty: true });
            if (!values) return;

            const displayFiles = fileManager.getDisplayFiles();

            if (displayFiles.length == 0) {
                alertStore.warn({
                    content: '1개 이상의 파일을 첨부해야합니다.',
                    duration: 3000
                })

                return;
            }

            const result = await FileSender.send('/api/submission/create', null, fileManager.getFiles(), {
                trainingId: urlParams.get('trainingId'),
                ...(values?.content && {
                    content: values.content
                }),
            })

            if (result.status) {
                alertStore.success({
                    title: '자료 제출 완료',
                    content: result.message!,
                    duration: 3000,
                })

                dataViewer.closeSpec(true);
            } else {
                alertStore.fail({
                    title: '자료 제출 실패',
                    content: result.message!,
                    duration: 3000,
                })
            }
        }
    }

    const editConfirm: WorkDefinition = {
        name: '수정',
        class: 'btn btn-secondary btn-height w-100',
        grid: 'col-6',
        workType: WorkType.ONLY_SPEC,
        render: (workSet?: WorkSet) => {
            if (formMode === FormMode.CREATE) return false;

            const specItem = workSet?.specItem;
            return (specItem?.confirm === null) ? true : false
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
        render: (workSet?: WorkSet) => {
            if (formMode === FormMode.CREATE) return false;

            const specItem = workSet?.specItem;
            return (specItem?.confirm === false) ? true : false
        },
        onClick: async (workSet: WorkSet) => {
            const specItem = workSet?.specItem;
            requestEdit({ requestAgain: true, confirm: specItem.confirm })
        }
    }


    const deleteSubmission: WorkDefinition = {
        name: '제출 취소',
        class: 'btn btn-danger btn-height w-100',
        grid: 'col-6',
        workType: WorkType.ONLY_SPEC,
        render: (workSet?: WorkSet) => {
            if (formMode === FormMode.CREATE) return false;

            const specItem = workSet?.specItem;
            return (specItem?.confirm !== true) ? true : false
        },
        onClick: async (workSet: WorkSet) => {

            const response = await axios.post('/api/submission/delete', {
                submissionId: workSet.specItem.id
            })

            const result = response.data;

            if (result.status) {
                alertStore.success({
                    title: '자료제출 취소됨',
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

    async function requestEdit(args: { requestAgain: boolean, confirm: boolean }) {
        const values = Validation.getValues(formBind, { allowEmpty: true });
            if (!values) return;
            console.log(values);

            const displayFiles = fileManager.getDisplayFiles();

            if (displayFiles.length == 0 && !values.content) {
                alertStore.warn({
                    content: '1개 이상의 파일을 첨부하거나 내용을 작성해야합니다.',
                    duration: 3000
                })

                return;
            }

            const specItem = dataViewer.getSpecItem();

            const result = await FileSender.send('/api/submission/edit', specItem.fileSetId, fileManager.getFiles(), {
                id: specItem?.id,
                content: values.content,
                requestAgain: args.requestAgain,
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



    async function openNewSubmission() {
        formMode = FormMode.CREATE;
        await dataViewer.openSpec({ title: '자료 제출' });
    }

    function convertConfirmToString(confirm?: boolean | null){
        if (confirm === true) return '승인';
        else if (confirm === false) return '거절';
        else return '대기';
    }

    const urlParams = new URLSearchParams(window.location.search);
    const trainingId = urlParams.get('trainingId');
    const trainingTypeId = urlParams.get('trainingTypeId');
    let fetchPayload = { trainingId }

</script>

<PageContainer title={pageTitle}>

    <div class="row g-2 mt-2">
        <div class="col-12">
            {#await axios.get('/api/static/trainingHeaderInfo?id=' + trainingId) then response}
                <TrainingHeaderIndicator trainingHeader={response.data} />
            {/await}
        </div>
        <div class="col-12">
            {#await axios.get('/api/static/trainingTypeInfo?id=' + trainingTypeId) then response}
                <TrainingTypeIndicator trainingType={response.data} />
            {/await}
        </div>
    </div>

    <DataViewer bind:this={dataViewer} 
            {sortSchema} {limitSchema} {workSchema} {searchSchema}
            idName="id"
            fetchURL="/api/submission/list"
            specURL="/api/submission/spec"
            itemWrapClass="row gx-0 mb-2 border-top border-bottom"
            useWorkUI={false}
            {fetchPayload}
            on:hide-spec={() => {
                formMode = FormMode.READ;
            }}
            showSearchOption={true}
        >

            <div slot="underSearch">
                <SimpleDesc noWrap>예) 2024-08-30</SimpleDesc>
            </div>

            <div slot="item" class="w-100" let:item>
                <div class="border-top border-bottom p-2 d-flex justify-content-between" style="min-height: 4.2rem;">
                    <div class="d-flex flex-column">
                        <p class="small text-secondary">ID: {item.id}</p>
                        <p>{item.training.title}</p>     
                        <p class="small text-secondary">{formatDatetime(item.createdAt, { includeSeconds: false })} 제출함</p>
                    </div>
                    
                    <div class="d-flex align-items-center">
                        {#await convertConfirmToString(item.confirm) then confirm}
                        <div class="confirm-label"
                            class:confirm-standby={confirm === '대기'}
                            class:confirm-true={confirm === '승인'}
                            class:confirm-false={confirm === '거절'}
                        >{confirm}</div>    
                        {/await}
                    </div>
                </div>
            </div>

            <div slot="work" class="g-1">

                <div class="col">
                    <button class="btn btn-primary w-100" on:click={openNewSubmission}>자료 제출</button>
                </div>
            </div>

            <div slot="spec" let:specItem class="container-fluid g-0" bind:this={formBind}>
                <div class="row g-2 m-auto">
                    
                    {#if formMode == FormMode.READ}

                        {#await convertConfirmToString(specItem?.confirm) then confirm}
                        <div class="col-12">
                            <FormField floating from={confirm} noValidate>
                                <input id="confirm" name="승인 여부" class="form-control"/>
                            </FormField>
                        </div>
                        {/await}


                        {#if specItem?.confirm === false && specItem?.reason}
                        <div class="col-12">
                            <FormField floating from={specItem} noValidate>
                                <FlexibleTextarea id="reason" name="거절 이유" clazz="form-control" height="6rem" foldable/>
                            </FormField>
                        </div>     
                        {/if}

                        {#if specItem?.confirmedAt}
                        <div class="col-12">
                            <FormField floating from={formatDatetime(specItem.confirmedAt, { includeSeconds: false })} noValidate>
                                <input id="confirmedAt" name="처리시간" class="form-control"/>
                            </FormField>
                        </div>
                        {/if}

                        {#if specItem?.confirm}
                        <div class="col-12">
                            <div class="ms-2 d-flex gap-1 align-items-center">
                                <p class="small text-secondary">담당자</p>
                                <UserContact email={specItem?.confirmedBy} />    
                            </div>
                        </div>
                        {/if}


                    <div class="col-12">
                        <hr class="my-2">
                    </div>

                    {/if}


                    <div class="col-12">
                        <FileManager bind:this={fileManager} fileSetId={specItem?.fileSetId} editMode={specItem?.confirm !== true} />
                    </div>

                    <div class="col-12">
                        <FormField floating from={specItem}>
                            <FlexibleTextarea id="content" name="내용" clazz="form-control" foldable={specItem?.comfirm === true} editMode={specItem?.confirm !== true}/>
                        </FormField>
                    </div>

                </div>
            </div>

        </DataViewer>

</PageContainer>

<style lang="scss">

    .confirm-label {
        padding: 0.25rem 0.5rem;
        font-size: 0.9rem;
        color: white;
        border-radius: 0.25rem;
        font-weight: bold;
    }

    .confirm-standby {
        background-color: rgb(143, 143, 143);
    }

    .confirm-true {
        background-color: rgb(75, 187, 103)
    }

    .confirm-false {
        background-color: rgb(214, 98, 98);
    }

</style>
