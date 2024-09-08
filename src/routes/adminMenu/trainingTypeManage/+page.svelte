<!-- registerAccept/+page.svelte -->
<script lang="ts">
	import DataViewer from "$lib/components/DataViewer/DataViewer.svelte";
	import { FormMode, InputMode, WorkType, handleWork, type LimitSchema, type SearchSchema, type SortSchema, type WorkDefinition, type WorkSchema, type WorkSet } from "$lib/components/DataViewer/script";
	import FlexibleTextarea from '$lib/components/FlexibleTextarea.svelte';
	import FormField from "$lib/components/FormField.svelte";
	import Modal from "$lib/components/Modal.svelte";
	import MultiClickDiv from "$lib/components/MultiClickDiv.svelte";
	import PageContainer from "$lib/components/PageContainer.svelte";
	import TimeStamp from "$lib/components/TimeStamp.svelte";
	import { Validation, type ValidationSchema } from '$lib/script/lib/validation';
	import { getCategories } from "$lib/script/requests/static";
	import { alertStore } from '$lib/stores/alertStore';
	import { positiveIntegerSchema } from "llp-validator";

    const pageTitle = "훈련타입 관리"
    const desc = '훈련타입을 관리합니다.';

    const sortSchema: SortSchema = [
        { name: '카테고리순', value: 'category' },
        { name: '최신순', value: 'latest' },
    ]

    const limitSchema: LimitSchema = [ 10, 20, 30, 40, 50 ]

    const searchSchema: SearchSchema = [
        { name: '훈련타입 이름', value: 'name' }
    ]

    let workSchema: WorkSchema;
    let dataViewer: DataViewer;
    let inputMode: InputMode = InputMode.READ;
    let formBind: Element;
    let formMode: FormMode = FormMode.READ;

    /* 이하 작업스키마 */
    const createTrainingType: WorkDefinition = {
        name: '추가',
        class: 'btn btn-success btn-height w-100',
        clickCount: 1,
        workType: WorkType.ONLY_WORK,
        render: () => true,
        onClick: async (workSet: WorkSet) => {
            await dataViewer.closeWorkMenu();
            inputMode = InputMode.CREATE;
            formMode = FormMode.CREATE;
            await dataViewer.openSpec({title: '훈련타입 추가'});
        }
    }

    const createTrainingTypeConfirm: WorkDefinition = {
        name: '완료',
        class: 'btn btn-success btn-height w-100',
        grid: 'col-12',
        workType: WorkType.ONLY_SPEC,
        render: () => true,
        onClick: async (workSet: WorkSet) => {
            // 여기서 새 시즌 생성 작업
            const values = Validation.checkAndGetValues(formBind);
            if (!values) return;
            console.log(values);

            return await handleWork(dataViewer, {
                url: '/api/trainingTypeManage/create',
                method: 'POST',
                payload: {
                    training: values,
                },
                onSuccessOne(item, result) {
                    alertStore.success({
                        title: '훈련타입 추가 완료',
                        content: result.message!,
                        duration: 3000,
                    })
                },
                onFailOne(item, result) {
                    alertStore.fail({
                        title: '훈련타입 추가 실패',
                        content: result.message!,
                        duration: 3000,
                    })
                },
            })
        }
    }

    const editTrainingType: WorkDefinition = {
        name: '수정',
        class: `btn btn-secondary btn-height w-100`,
        workType: WorkType.ONLY_SPEC,
        clickCount: 1,
        render: () => true,
        onClick: async (workSet: WorkSet) => {
            await dataViewer.closeSpec();
            inputMode = InputMode.EDIT;
            formMode = FormMode.EDIT;
            await dataViewer.openSpec({ title: '훈련타입 수정', item: workSet.specItem, skipFetch: true });    
        }
    }

    const editTrainingTypeConfirm: WorkDefinition = {
        name: '완료',
        class: `btn btn-success btn-height w-100`,
        grid: 'col-12',
        workType: WorkType.ONLY_SPEC,
        render: () => true,
        onClick: async (workSet: WorkSet) => {
            const values = Validation.checkAndGetValues(formBind, {});
            if (!values) return;

            const original = { ...workSet.specItem };

            // 변경사항 탐지
            const changes: Record<string, string> = {};
            Object.entries(values).forEach(([key, value]) => {
                if (value !== String(original[key])) changes[key] = value;
            })

            if (!Object.keys(changes).length){
                alertStore.warn({
                    content: '변경된 내용이 없습니다.',
                    duration: 3000
                }); return;
            }
            return await handleWork(dataViewer, {
                url: '/api/trainingTypeManage/update',
                method: 'PUT',
                payload: { 
                    id: workSet.specItem.id,
                    updated: changes
                },
                onSuccessOne: (item, result) => {
                    alertStore.success({
                        title: '훈련타입 수정 완료',
                        content: result.message!,
                        duration: 3000
                    });
                },
                onFailOne: (item, result) => {
                    alertStore.fail({
                        title: '훈련타입 수정 실패',
                        content: result.message!,
                        duration: 3000
                    });
                },
            });
            
        }

    }

    const deleteTrainingType: WorkDefinition = {
        name: '제거',
        class: 'btn btn-danger btn-height w-100',
        min: 1,
        workType: WorkType.BOTH,
        render: () => true,
        onClick: async (workSet: WorkSet) => {
            dataViewer.getSpecModal().invisible()
            dataViewer.getWorkMenuModal().invisible();
            deleteWarnModal.show();
        },
        
    }

    /* inputMode에 따라 작업스키마 동적 변경 */
    $: if (inputMode === InputMode.CREATE) {
        workSchema = { createTrainingTypeConfirm }
    } else if (inputMode === InputMode.EDIT){
        workSchema = { editTrainingTypeConfirm }
    } else {
        workSchema = { createTrainingType, editTrainingType, deleteTrainingType }
    }

    function onHideSpec() {
        inputMode = InputMode.READ;
        formMode = FormMode.READ;
    }

    const talentSchema: ValidationSchema = {
        displayOnEmpty: true,
        handler: (el) => {
            const { error } = positiveIntegerSchema.allow('').validate(el.value.trim());
            return error?.message;
        }
    }

    /* 이하 검증 스키마 */
    const notNullSchema: ValidationSchema = {
        displayOnEmpty: true,
        handler: (el) => {
            if (!el.value.trim()) return '필수 값입니다.'
        }
    }

    async function requestDelete() {
		deleteWarnModal.hide();
        dataViewer.getSpecModal().visible()
        dataViewer.getWorkMenuModal().visible();

        await dataViewer.doSomeWork({
            name: '제거',
            class: '',
            workType: WorkType.BOTH,
            render: () => true,
            onClick: async (workSet: WorkSet) => {
                return await handleWork(dataViewer, {
                    url: '/api/trainingTypeManage/delete',
                    method: 'PUT',
                    payload: { 
                        targets: [...workSet.selectedItems.keys()]
                    },
                    onSuccessOne: (item, result) => {
                        alertStore.success({
                            title: '훈련타입 삭제 완료',
                            content: result.message!,
                            duration: 3000
                        });
                    },
                    onFailOne: (item, result) => {
                        alertStore.fail({
                            title: '훈련타입 삭제 실패',
                            content: result.message!,
                            duration: 3000
                        });
                    },
                    toString: (item) => {
                        return item.name;
                    }
                });
            }
        })

	}

    let deleteWarnModal: Modal;

</script>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->

<PageContainer title={pageTitle}>
        <DataViewer bind:this={dataViewer}
            {sortSchema} {limitSchema} bind:workSchema {searchSchema}
            idName="id"
            fetchURL="/api/trainingTypeManage/list"
            specURL="/api/trainingTypeManage/spec"
            itemWrapClass="row gx-0 mb-2 border-top border-bottom"
            on:hide-spec={onHideSpec}
            useWorkUI
        >
            <div slot="item" class="w-100" let:item>
                <div class="border-top border-bottom p-2 d-flex flex-column justify-content-between" style="min-height: 4.2rem;">
                    <div class="d-flex justify-content-between">
                        <p>{item.name}</p>
                    </div>
                    
                    <div class="small text-secondary d-flex gap-1">
                        <p>{item.category.name}</p>
                    </div>
                </div>
            </div>

            <div slot="spec" let:specItem class="container-fluid g-0">
                <div class="row g-2 m-auto" bind:this={formBind}>
                    <div class="row gx-1 gy-2 m-auto">
                        <div class="col-12">
                            <FormField floating from={specItem} noValidate={formMode === FormMode.READ} validation={notNullSchema} let:validate>
                                <input id="name" name="이름" class="form-control"
                                    on:input={e => validate(e.currentTarget)}>
                            </FormField>
                        </div>
                        <div class="col-12">
                            <FormField floating from={specItem} noValidate={formMode === FormMode.READ}>
                                <select id="categoryId" name="카테고리" class="{formMode !== FormMode.READ ? 'form-select is-valid' : 'form-control'}">
                                {#await getCategories() then categories}
                                    {#each categories as category}
                                    <option value={category.id} selected={specItem && category.id === specItem.category.id}>{category.name}</option>
                                    {/each}
                                {/await}   
                                </select>
                            </FormField>
                        </div>
                        <div class="col-12">
                            <FormField floating from={specItem} noValidate={formMode === FormMode.READ} validation={talentSchema} let:validate>
                                <input id="minTalent" name="필수획득 달란트" class="{formMode !== FormMode.READ ? 'is-valid' : ''} form-control" 
                                    on:input={e => validate(e.currentTarget)}>
                            </FormField>
                        </div>
                        <div class="col-12">
                            <FormField floating from={specItem} noValidate={formMode === FormMode.READ} validation={talentSchema} let:validate>
                                <input id="maxTalent" name="최대획득 달란트" class="{formMode !== FormMode.READ ? 'is-valid' : ''} form-control" 
                                    on:input={e => validate(e.currentTarget)}>
                            </FormField>
                        </div>
                        <div class="col-12">
                            <FormField floating from={specItem} noValidate={formMode === FormMode.READ} validation={notNullSchema} let:validate>
                                <FlexibleTextarea id="desc" name="설명" clazz="form-control" foldable={formMode === FormMode.READ} editMode={formMode !== FormMode.READ} on:input={e => validate(e.detail)}/>
                            </FormField>
                        </div>
                    </div>
                    {#if formMode === FormMode.READ}
                    <div class="col-12">
                        <TimeStamp updatedAt={specItem.updatedAt} updatedBy={specItem.updatedBy} createdAt={specItem.createdAt} />
                    </div>
                    {/if}
                </div>
            </div>
        </DataViewer>
</PageContainer>


<Modal
	title="경고"
	bind:this={deleteWarnModal}
	footerSlot
	contentClass="activated-modal"
	alwaysRender
>
	<p>
		훈련타입을 삭제하면 연관된 훈련, 훈련에 제출된 자료, 지급된 달란트가 <span class="text-danger"
			>모두 초기화</span
		>됩니다. 진행하시겠습니까?
	</p>
	<div slot="footer" class="container-fluid g-0">
		<div class="row g-1">
			<div class="col-6">
				<MultiClickDiv
					clickCount={5}
					clazz="btn btn-danger btn-height"
					style="width: 100%;"
					callback={requestDelete}>삭제</MultiClickDiv
				>
			</div>
			<div class="col-6">
				<button class="btn btn-secondary btn-height w-100" on:click={() => {
					deleteWarnModal.hide()
                    dataViewer.getSpecModal().visible()
                    dataViewer.getWorkMenuModal().visible();
				}}
					>닫기</button
				>
			</div>
		</div>
	</div>
</Modal>

<style lang="scss">

</style>
