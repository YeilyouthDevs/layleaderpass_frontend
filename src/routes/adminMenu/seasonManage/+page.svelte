<!-- registerAccept/+page.svelte -->
<script lang="ts">
	import DataViewer from "$lib/components/DataViewer/DataViewer.svelte";
	import { FormMode, WorkType, handleWork, type LimitSchema, type SearchSchema, type SortSchema, type WorkDefinition, type WorkSchema, type WorkSet } from "$lib/components/DataViewer/script";
	import DateSelector from "$lib/components/DateSelector/DateSelector.svelte";
	import { DateMode } from "$lib/components/DateSelector/script";
	import FormField from "$lib/components/FormField.svelte";
	import PageContainer from "$lib/components/PageContainer.svelte";
	import SimpleDesc from "$lib/components/SimpleDesc.svelte";
	import UpdatedBy from "$lib/components/TimeStamp.svelte";
	import { formatDatetime, parseDate } from "$lib/script/lib/formatDatetime";
	import { Validation, type ValidationSchema } from '$lib/script/lib/validation';
	import { notEmptyValidation } from "$lib/script/lib/validationSchemas";
	import { alertStore } from '$lib/stores/alertStore';

    const pageTitle = "시즌 관리"
    const desc = '중직자PASS 시즌을 관리합니다.';

    const sortSchema: SortSchema = [
        { name: '시작일순', value: 'startDate' },
        { name: '최신순', value: 'latest' },
    ]

    const limitSchema: LimitSchema = [ 10 ]

    const searchSchema: SearchSchema = [
        { name: '이름', value: 'name' }
    ]

    let workSchema: WorkSchema;
    let dataViewer: DataViewer;
    let formMode: FormMode = FormMode.READ;
    let formBind: Element;
    let dateSelector: DateSelector;

    /* 이하 작업스키마 */
    const createSeason: WorkDefinition = {
        name: '추가',
        class: 'btn btn-success btn-height w-100',
        clickCount: 1,
        workType: WorkType.ONLY_WORK,
        render: () => true,
        onClick: async (workSet: WorkSet) => {
            await dataViewer.closeWorkMenu();
            formMode = FormMode.CREATE;
            await dataViewer.openSpec({title: '시즌 추가'});
        }
    }

    const createSeasonConfirm: WorkDefinition = {
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
                url: '/api/seasonManage/create',
                method: 'POST',
                payload: {
                    name: values.name,
                    startDate: values.startDate,
                    endDate: values.endDate,
                },
                onSuccessOne(item, result) {
                    alertStore.success({
                        title: '시즌 추가 완료',
                        content: result.message!,
                        duration: 3000,
                    })
                },
                onFailOne(item, result) {
                    alertStore.fail({
                        title: '시즌 추가 실패',
                        content: result.message!,
                        duration: 3000,
                    })
                },
            })
        }
    }

    const editSeason: WorkDefinition = {
        name: '수정',
        class: `btn btn-secondary btn-height w-100`,
        workType: WorkType.ONLY_SPEC,
        clickCount: 1,
        render: () => true,
        onClick: async (workSet: WorkSet) => {
            await dataViewer.closeSpec();
            formMode = FormMode.EDIT;
            await dataViewer.openSpec({ title: '시즌 수정', item: workSet.specItem, skipFetch: true });    
        }
    }

    const editSeasonConfirm: WorkDefinition = {
        name: '완료',
        class: `btn btn-success btn-height w-100`,
        grid: 'col-12',
        workType: WorkType.ONLY_SPEC,
        render: () => true,
        onClick: async (workSet: WorkSet) => {
            const values = Validation.checkAndGetValues(formBind);
            if (!values) return;

            // 형태 맞추기
            values['startDate'] = parseDate(values['startDate']).toISOString();
            values['endDate'] = parseDate(values['endDate']).toISOString();

            const original = { ...workSet.specItem };
            original['startDate'] = original['startDate'];
            original['endDate'] = original['endDate'];
            original['cursor'] = String(original['cursor'])

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
                url: '/api/seasonManage/update',
                method: 'PUT',
                payload: { id: original.id, updated: changes },
                onSuccessOne: (item, result) => {
                    alertStore.success({
                        title: '시즌 수정 완료',
                        content: result.message!,
                        duration: 3000
                    });
                },
                onFailOne: (item, result) => {
                    alertStore.fail({
                        title: '시즌 수정 실패',
                        content: result.message!,
                        duration: 3000
                    });
                },
            });
        }

    }

    const deleteSeason: WorkDefinition = {
        name: '제거',
        class: 'btn btn-danger btn-height w-100',
        min: 1,
        workType: WorkType.BOTH,
        render: () => true,
        onClick: async (workSet: WorkSet) => {
            return await handleWork(dataViewer, {
                url: '/api/seasonManage/delete',
                method: 'PUT',
                payload: {
                    targets: [...workSet.selectedItems.keys()]
                },
                onSuccessOne(item, result) {
                    alertStore.success({
                        title: '시즌 제거 완료',
                        content: result.message!,
                        duration: 3000,
                    })
                },
                onFailOne(item, result) {
                    alertStore.fail({
                        title: '시즌 제거 실패',
                        content: result.message!,
                        duration: 3000,
                    })
                },
                toString: (item) => item.name
            })
        },
        
    }
    const startSeason: WorkDefinition = {
        name: '시작',
        class: 'btn btn-secondary btn-height w-100',
        workType: WorkType.ONLY_SPEC,
        render: () => true,
        onClick: async (workSet: WorkSet) => {
            return await handleWork(dataViewer, {
                url: '/api/seasonManage/start',
                method: 'PUT',
                payload: {
                    id: workSet.specItem.id
                },
                onSuccessOne(item, result) {
                    alertStore.success({
                        title: '시즌 시작 완료',
                        content: result.message!,
                        duration: 3000,
                    })
                },
                onFailOne(item, result) {
                    alertStore.fail({
                        title: '시즌 시작 실패',
                        content: result.message!,
                        duration: 3000,
                    })
                },
            })
        }
    }
    const endSeason: WorkDefinition = {
        name: '종료',
        class: 'btn btn-secondary btn-height w-100',
        workType: WorkType.ONLY_SPEC,
        render: () => true,
        onClick: async (workSet: WorkSet) => {
            return await handleWork(dataViewer, {
                url: '/api/seasonManage/end',
                method: 'PUT',
                payload: {
                    id: workSet.specItem.id
                },
                onSuccessOne(item, result) {
                    alertStore.success({
                        title: '시즌 종료 완료',
                        content: result.message!,
                        duration: 3000,
                    })
                },
                onFailOne(item, result) {
                    alertStore.fail({
                        title: '시즌 종료 실패',
                        content: result.message!,
                        duration: 3000,
                    })
                },
            })
        }
    }

    /* inputMode에 따라 작업스키마 동적 변경 */
    $: if (formMode === FormMode.CREATE) {
        workSchema = { createSeasonConfirm }
    } else if (formMode === FormMode.EDIT){
        workSchema = { editSeasonConfirm }
    } else {
        workSchema = { createSeason, editSeason, deleteSeason, startSeason, endSeason }
    }

    function onHideSpec() {
        formMode = FormMode.READ;
    }

    /* 이하 검증 스키마 */
    const nameValidation: ValidationSchema = {
        displayOnEmpty: true,
        handler: (el) => {
            if (!el.value.trim()) return '필수 값입니다.'
        }
    }

</script>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->


<PageContainer title={pageTitle}>
    <DataViewer bind:this={dataViewer} {searchSchema}
        {sortSchema} {limitSchema} bind:workSchema
        idName="id"
        fetchURL="/api/seasonManage/list"
        specURL="/api/seasonManage/spec"
        itemWrapClass="row gx-0 mb-2 border-top border-bottom"
        on:hide-spec={onHideSpec}
        useWorkUI
    >
        <div slot="item" class="w-100" let:item>
            <div class="border-top border-bottom p-2 d-flex flex-column justify-content-between" style="min-height: 4.2rem;">
                <div class="d-flex justify-content-between">
                    <p>{item.name}
                        {#if item.cursor}
                        <span class="cursor-badge">진행중</span>
                        {/if}
                    </p>
                    
                </div>
                
                <div class="small text-secondary d-flex gap-1">
                    <p>{formatDatetime(item.startDate, { includeSeconds: false })}</p>
                    <p>~</p>
                    <p>{formatDatetime(item.endDate, { includeSeconds: false })}</p>
                </div>
            </div>
        </div>

        <div slot="spec" let:specItem class="container-fluid g-0" bind:this={formBind}>
            <div class="row g-2 m-auto">
                <div class="col-12">
                    <FormField floating from={specItem} noValidate={formMode === FormMode.READ} validation={nameValidation} let:validate>
                        <input id="name" name="이름" class="form-control" on:input={e => validate(e.currentTarget)}>
                    </FormField>
                </div>
                <div class="col-12">
                    <FormField floating from={specItem} noValidate>
                        <select id="cursor" name="진행중" class="{formMode !== FormMode.READ ? 'is-valid' : ''} form-control">
                            <option value="null">No</option>
                            <option value="true">Yes</option>    
                        </select>
                    </FormField>
                </div>
                <div class="col-6">
                    <FormField floating from={specItem} validation={notEmptyValidation} let:validate readonly noValidate={formMode === FormMode.READ}>
                        <input id="startDate" name="시즌 시작일시" class="form-control" on:input={(e) => validate(e.currentTarget)} disabled={formMode === FormMode.READ}
                            on:click={(e) => dateSelector?.open(e.currentTarget, '시즌 시작일시를 선택해주세요', DateMode.DATETIME)}>
                    </FormField>
                </div>
                <div class="col-6">
                    <FormField floating from={specItem} validation={notEmptyValidation} let:validate readonly noValidate={formMode === FormMode.READ}>
                        <input id="endDate" name="시즌 종료일시" class="form-control" on:input={(e) => validate(e.currentTarget)} disabled={formMode === FormMode.READ}
                            on:click={(e) => dateSelector?.open(e.currentTarget, '시즌 종료일시를 선택해주세요', DateMode.DATETIME)}>
                    </FormField>
                </div>
                <!-- <div class="col-12">
                    <FormField floating noValidate={formMode === FormMode.READ} validation={dateRangeValidation} let:validate>
                        <DateTimePicker id="dateRange" name="기간" mode="date" clazz="form-control" range from={{ src: specItem, fields: ['startDate', 'endDate'] }}
                            on:select={e => validate(e.detail)} />
                    </FormField>
                </div> -->
                {#if formMode === null}
                <div class="col-12">
                    <UpdatedBy updatedAt={specItem.updatedAt} updatedBy={specItem.updatedBy} />
                </div>
                {/if}
            </div>
        </div>
    </DataViewer>
</PageContainer>

<DateSelector bind:this={dateSelector} />

<style lang="scss">

    .cursor-badge {
        width: 3rem;
        text-align: center;
        height: 1.6rem;
        font-size: 0.8rem;
        font-weight: bold;
        border-radius: 0.25rem;
        background-color: rgb(47, 170, 241);
        color: white;
        padding: 0.175rem 0.25rem;
        text-wrap: nowrap;
    }

</style>
