<script lang="ts">
	import DataViewer from '$lib/components/DataViewer/DataViewer.svelte';
	import type { LimitSchema, SearchSchema, SortSchema, WorkDefinition, WorkSchema, WorkSet } from '$lib/components/DataViewer/script';
	import { FormMode, WorkType, handleWork, type TabSchema } from '$lib/components/DataViewer/script';
	import FileManager from '$lib/components/FileManager/FileManager.svelte';
	import FileSender from '$lib/components/FileManager/FileSender';
	import FlexibleTextarea from '$lib/components/FlexibleTextarea.svelte';
	import FormField from '$lib/components/FormField.svelte';
	import PageContainer from "$lib/components/PageContainer.svelte";
	import TimeStamp from '$lib/components/TimeStamp.svelte';
	import { formatDatetime } from '$lib/script/lib/formatDatetime';
	import { Validation } from '$lib/script/lib/validation';
	import { notEmptyValidation } from '$lib/script/lib/validationSchemas';
	import { alertStore } from '$lib/stores/alertStore';
	import { UserRole, userStore } from '$lib/stores/userStore';

    const pageTitle = "공지사항";
        
    let dataViewer: DataViewer;
    let formBind: Element;
    let formMode = FormMode.READ;
    let fetchURL: string;
    let specURL: string;
    let idName:string;
    let workSchema: WorkSchema;
    let fileManager:FileManager;

    const sortSchema: SortSchema = [
        { name: '최신순', value: 'latest' },
    ]

    const searchSchema: SearchSchema = [
        { name: '제목', value: 'title' },
    ]
    
    let limitSchema: LimitSchema = [ 10, 20, 30, 40, 50 ]

    enum DataTab { COMBINED, SIGNIFICANT, DEFAULT };
    let dataTab: DataTab = DataTab.COMBINED;

    const tabSchema: TabSchema = [
        {
            name: '전체',
            select: true,
            onClick: () => {
                dataTab = DataTab.COMBINED
            }
        },
        {
            name: '필독/중요',
            onClick: () => {
                dataTab = DataTab.SIGNIFICANT
            }
        },
        {
            name: '일반',
            onClick: () => {
                dataTab = DataTab.DEFAULT
            }
        }
    ]


    const createNotice: WorkDefinition = {
        name: '추가',
        class: 'btn btn-success btn-height w-100',
        clickCount: 1,
        workType: WorkType.ONLY_WORK,
        render: () => $userStore.role === UserRole.ADMIN,
        onClick: async (workSet: WorkSet) => {
            await dataViewer.closeWorkMenu();
            formMode = FormMode.CREATE;
            await dataViewer.openSpec({title: '공지 추가'});
        }
    }

    const createNoticeConfirm: WorkDefinition = {
        name: '완료',
        class: 'btn btn-success btn-height w-100',
        grid: 'col-12',
        workType: WorkType.ONLY_SPEC,
        render: () => formMode === FormMode.CREATE,
        onClick: async (workSet: WorkSet) => {
            
            const values = Validation.checkAndGetValues(formBind);
            if (!values) return;
            console.log(values);

            const files = fileManager.getFiles();

            const result = await FileSender.send('/api/notice/create', null, files, {
                title: values.title,
                level: +values.level,
                content: values.content,
            })

            if (result.status) {
                alertStore.success({
                    title: '공지사항 등록됨',
                    content: result.message,
                    duration: 3000,
                })

                dataViewer.closeSpec(true);
            } else {
                alertStore.fail({
                    title: '공지사항 등록 실패',
                    content: result.message,
                    duration: 3000,
                })
            }
        }
    }

    const editNotice: WorkDefinition = {
        name: '수정',
        class: 'btn btn-secondary btn-height w-100',
        clickCount: 1,
        workType: WorkType.ONLY_SPEC,
        render: () => formMode === FormMode.READ && $userStore.role === UserRole.ADMIN,
        onClick: async (workSet: WorkSet) => {
            formMode = FormMode.EDIT;
            await dataViewer.openSpec({title: '공지 수정', item: workSet.specItem});
        }
    }

    const editNoticeConfirm: WorkDefinition = {
        name: '완료',
        class: 'btn btn-success btn-height w-100',
        grid: 'col-12',
        workType: WorkType.ONLY_SPEC,
        render: () => formMode === FormMode.EDIT,
        onClick: async (workSet: WorkSet) => {
            const specItem = workSet.specItem;
            const noticeId = specItem.id;

            const values = Validation.checkAndGetValues(formBind);
            if (!values) return;

            const result = await FileSender.send('/api/notice/edit', specItem.fileSetId, fileManager.getFiles(), {
                noticeId,
                title: values.title,
                level: +values.level,
                content: values.content,
            })
        
            if (result.status) {
                alertStore.success({
                    title: '공지사항 수정됨',
                    content: result.message,
                    duration: 3000,
                })

                dataViewer.closeSpec(true);
            } else {
                alertStore.fail({
                    title: '공지사항 수정 실패',
                    content: result.message,
                    duration: 3000,
                })
            }
        }
    }

    const deleteNotice: WorkDefinition = {
        name: '삭제',
        class: 'btn btn-danger btn-height w-100',
        grid: 'col-6',
        workType: WorkType.BOTH,
        min: 1,
        render: () => formMode === FormMode.READ && $userStore.role === UserRole.ADMIN,
        onClick: async (workSet: WorkSet) => {

            return await handleWork(dataViewer, {
                url: '/api/notice/delete',
                method: 'POST',
                payload: {
                    targets: [...workSet.selectedItems.keys()],
                },
                onSuccessOne(item, result) {
                    alertStore.success({
                        title: '공지사항 삭제 완료',
                        content: result.message!,
                        duration: 3000,
                    })
                },
                onFailOne(item, result) {
                    alertStore.fail({
                        title: '공지사항 삭제 실패',
                        content: result.message!,
                        duration: 3000,
                    })
                },
                toString(item) {
                    return item.title
                },
            })
        }
    }


    $: if (dataTab === DataTab.COMBINED) {
        idName = 'id';    
        fetchURL = '/api/notice/list/combined';
        specURL = '/api/notice/spec';
        workSchema = { createNotice, createNoticeConfirm, editNotice, editNoticeConfirm, deleteNotice }
    }
     else if(dataTab === DataTab.SIGNIFICANT){
        fetchURL = '/api/notice/list/significant';
    }
     else if (dataTab === DataTab.DEFAULT) {
        fetchURL = '/api/notice/list/default';
    }


    function onShowSpec() {
        const specItem = dataViewer.getSpecItem();
    }

    function onHideSpec(){
        // workPage = null;
        formMode = FormMode.READ
    }

    function convertNoticeLevelToString(level: number) {
        switch (level) {
            case 3000: return '필독';
            case 2000: return '중요';
            default: return '오류';
        }
    }

</script>

<PageContainer title={pageTitle}>
    
    <DataViewer bind:this={dataViewer} 
        bind:limitSchema
        bind:workSchema
        bind:idName
        {tabSchema}
        {sortSchema}
        {searchSchema}
        {fetchURL}
        {specURL}
        itemWrapClass="row gx-0 mb-2 border-top border-bottom"
        useWorkUI={$userStore.role === UserRole.ADMIN}
        on:show-spec={onShowSpec}
        on:hide-spec={onHideSpec}
    >

        <div slot="item" class="w-100" let:item>
            <div class="border-top border-bottom p-2 d-flex align-items-center justify-content-between" style="min-height: 3rem;">

                <div class="d-flex">
                    <div class="d-flex flex-column">
                        <div class="d-flex align-items-center gap-1">
                            {#if item.level !== 1000}
                            <p class="level-badge"
                                class:level-essential={item.level === 3000}
                                class:level-important={item.level === 2000}
                            >{convertNoticeLevelToString(item.level)}</p>
                            {/if}
                            <p>{item.title}</p>
                        </div>
                        <div class="small text-secondary">
                            {formatDatetime(item.createdAt, { includeSeconds: false })}
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <div slot="spec" let:specItem class="container-fluid g-0" bind:this={formBind}>
            <div class="row g-2 m-auto">
                    <div class="col-12">
                        <FormField floating from={specItem} noValidate={formMode === FormMode.READ} validation={notEmptyValidation} let:validate>
                            <input id="title" name="제목" class="form-control" on:input={(e) => validate(e.currentTarget)}>
                        </FormField>
                    </div>
                    <div class="col-12">
                        <FormField floating from={specItem} noValidate={formMode === FormMode.READ}>
                            <select id="level" name="중요도" class="{formMode === FormMode.READ ? 'form-control' : 'form-select is-valid'}">
                                <option value="1000">일반</option>
                                <option value="2000">중요</option>
                                <option value="3000">필수</option>
                            </select>
                        </FormField>
                    </div>
                    <div class="col-12">
                        <FileManager bind:this={fileManager} fileSetId={specItem?.fileSetId} editMode={formMode !== FormMode.READ} maxFileCount={null}>
                            <div slot="content">
                                <FormField floating from={specItem} noValidate={formMode === FormMode.READ} validation={notEmptyValidation} let:validate>
                                    <FlexibleTextarea id="content" name="내용" clazz="form-control" foldable={formMode === FormMode.READ} editMode={formMode !== FormMode.READ} on:input={(e) => validate(e.detail)}/>
                                </FormField>
                            </div>
                        </FileManager>

                    </div>
                    {#if specItem}
                    <div class="col-12">
                        <TimeStamp createdBy={specItem?.createdBy} createdAt={specItem?.createdAt} updatedBy={specItem?.updatedBy} updatedAt={specItem?.updatedAt}  />
                    </div>
                    {/if}
            </div>
        </div>

    </DataViewer>
</PageContainer>

<style lang="scss">
    .level-badge {
        border-radius: 0.3rem;
        font-size: small;
        font-weight: bold;
        background-color: black;
        color: white;
        height: 1.7rem;
        max-height: 1.7rem;
        width: 2.4rem;
        max-width: 2.4rem;
        display: flex;
        align-items: center;
        justify-content: center;
        text-wrap: nowrap;
    }

    .level-essential {
        background-color: rgb(219, 70, 44);
    }

    .level-important {
        background-color: rgb(143, 54, 146);
    }
   
</style>
