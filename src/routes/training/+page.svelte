<!-- training/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import DataViewer from '$lib/components/DataViewer/DataViewer.svelte';
	import { FormMode, handleWork, WorkType, type LimitSchema,
		type SearchSchema,
		type SortSchema,
		type TabSchema,
		type WorkDefinition,
		type WorkSchema,
		type WorkSet
	} from '$lib/components/DataViewer/script';
	import DateSelector from '$lib/components/DateSelector/DateSelector.svelte';
	import { DateMode } from '$lib/components/DateSelector/script';
	import FileManager from '$lib/components/FileManager/FileManager.svelte';
	import FileSender from '$lib/components/FileManager/FileSender';
	import FlexibleTextarea from '$lib/components/FlexibleTextarea.svelte';
	import FormField from '$lib/components/FormField.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import MultiClickDiv from '$lib/components/MultiClickDiv.svelte';
	import PageContainer from '$lib/components/PageContainer.svelte';
	import TimeStamp from '$lib/components/TimeStamp.svelte';
	import TrainingTypeIndicator from '$lib/components/TrainingTypeIndicator.svelte';
	import { formatDatetime, parseDate } from '$lib/script/lib/formatDatetime';
	import { Validation, validate } from '$lib/script/lib/validation';
	import { notEmptyValidation } from '$lib/script/lib/validationSchemas';
	import { alertStore } from '$lib/stores/alertStore';
	import { loadingStore } from '$lib/stores/loadingStore';
	import { UserRole, userStore } from '$lib/stores/userStore';
	import axios from 'axios';
	import { tick } from 'svelte';

	const pageTitle = '훈련';

	let dataViewer: DataViewer;
	let formBind: Element;
	let formMode = FormMode.READ;
	let fetchURL: string;
	let specURL: string;
	let idName: string = 'id';
	let workSchema: WorkSchema;
	let fileManager: FileManager;
	let dateSelector: DateSelector;
	let deleteWarnModal: Modal;

	const sortSchema: SortSchema = [
		{ name: '시작일순', value: 'startAt' },
		{ name: '가나다순', value: 'abc' }
	];

	const searchSchema: SearchSchema = [{ name: '제목', value: 'title' }];

	let limitSchema: LimitSchema = [10, 20, 30, 40, 50];

	enum DataTab {
		LATER,
		AVAILABLE,
		OVER
	}
	let dataTab: DataTab = DataTab.AVAILABLE;

	const tabSchema: TabSchema = [
		{
			name: '진행예정',
			onClick: () => {
				dataTab = DataTab.LATER;
			}
		},
		{
			name: '진행중',
			select: true,
			onClick: () => {
				dataTab = DataTab.AVAILABLE;
			}
		},
		{
			name: '종료됨',
			onClick: () => {
				dataTab = DataTab.OVER;
			}
		}
	];

	$: if (dataTab === DataTab.AVAILABLE) {
		idName = 'id';
		fetchURL = '/api/training/list/available';
		specURL = '/api/training/spec';
	} else if (dataTab === DataTab.LATER) {
		fetchURL = '/api/training/list/later';
	} else if (dataTab === DataTab.OVER) {
		fetchURL = '/api/training/list/over';
	}

	$: if (formMode === FormMode.READ) {
		workSchema = {
			create,
			edit,
			_delete,
			gotoTrainingManage,
			gotoSubmit
		};
	} else if (formMode === FormMode.CREATE) {
		workSchema = {
			createConfirm
		};
	} else if (formMode === FormMode.EDIT) {
		workSchema = {
			editConfirm
		};
	}

	const create: WorkDefinition = {
		name: '추가',
		class: 'btn btn-success btn-height w-100',
		workType: WorkType.ONLY_WORK,
		grid: 'col-6',
		clickCount: 1,
		render: () => true,
		onClick: async (workSet: WorkSet) => {
			formMode = FormMode.CREATE;
			dataViewer.closeWorkMenu();
			dataViewer.openSpec({ title: '훈련 추가' });
		}
	};

	const createConfirm: WorkDefinition = {
		name: '완료',
		class: 'btn btn-success btn-height w-100',
		workType: WorkType.ONLY_SPEC,
		grid: 'col-12',
		render: () => true,
		onClick: async (workSet: WorkSet) => {
			const values = Validation.checkAndGetValues(formBind);
			if (!values) return;

			const result = await FileSender.send('/api/training/create', null, fileManager.getFiles(), {
				title: values.title,
				content: values.content,
				trainingTypeId: values.trainingTypeId,
				startAt: values.startAt,
				endAt: values.endAt,
				submitStartAt: values.submitStartAt,
				submitEndAt: values.submitEndAt
			});

			if (result.status) {
				alertStore.success({
					title: '훈련 추가 완료',
					content: result.message!,
					duration: 3000
				});

				dataViewer.closeSpec(true);
			} else {
				alertStore.fail({
					title: '훈련 추가 실패',
					content: result.message!,
					duration: 3000
				});
			}
		}
	};

	const edit: WorkDefinition = {
		name: '수정',
		class: `btn btn-secondary btn-height w-100`,
		grid: 'col-6',
		workType: WorkType.ONLY_SPEC,
		clickCount: 1,
		render: () => $userStore.role === UserRole.ADMIN,
		onClick: async (workSet: WorkSet) => {
			await dataViewer.closeSpec();
			formMode = FormMode.EDIT;
			await dataViewer.openSpec({ title: '훈련 수정', item: workSet.specItem, skipFetch: true });
		}
	};

	const editConfirm: WorkDefinition = {
		name: '완료',
		class: `btn btn-success btn-height w-100`,
		grid: 'col-12',
		workType: WorkType.ONLY_SPEC,
		render: () => $userStore.role === UserRole.ADMIN,
		onClick: async (workSet: WorkSet) => {
			const values = Validation.checkAndGetValues(formBind, { allowEmpty: true });
			if (!values) return;

			// 형태 맞추기
			if (values['startAt']) values['startAt'] = parseDate(values['startAt']).toISOString();
			if (values['endAt']) values['endAt'] = parseDate(values['endAt']).toISOString();
			if (values['submitStartAt'])
				values['submitStartAt'] = parseDate(values['submitStartAt']).toISOString();
			if (values['submitEndAt'])
				values['submitEndAt'] = parseDate(values['submitEndAt']).toISOString();

			const original = { ...workSet.specItem };

			//변경사항 탐지
			const changes: Record<string, string> = {};
			Object.entries(values).forEach(([key, value]) => {
				if (value !== String(original[key])) changes[key] = value;
			});

			const result = await FileSender.send(
				'/api/training/edit',
				workSet.specItem.fileSetId,
				fileManager.getFiles(),
				{
					id: original.id,
					updated: changes
				}
			);

			if (result.status) {
				alertStore.success({
					title: '훈련 수정 완료',
					content: result.message!,
					duration: 3000
				});

				dataViewer.closeSpec(true);
			} else {
				alertStore.fail({
					title: '훈련 수정 실패',
					content: result.message!,
					duration: 3000
				});
			}
		}
	};

	const _delete: WorkDefinition = {
		name: '제거',
		class: 'btn btn-danger btn-height w-100',
		workType: WorkType.BOTH,
		grid: 'col-6',
		min: 1,
		clickCount: 3,
		render: () => $userStore.role === UserRole.ADMIN,
		onClick: async (workSet: WorkSet) => {
			dataViewer.getSpecModal().invisible()
			dataViewer.getWorkMenuModal().invisible();
			deleteWarnModal.show();
		}
	};

	const gotoSubmit: WorkDefinition = {
		name: '인증자료 제출',
		class: `btn btn-success btn-height w-100`,
		grid: 'col-12',
		workType: WorkType.ONLY_SPEC,
		clickCount: 1,
		render: (workSet?: WorkSet) => {
			const specItem = workSet?.specItem;
			return determindSubmissionAvailable(specItem);
		},
		onClick: async (workSet: WorkSet) => {
			const specItem = workSet.specItem;

			const queryString = new URLSearchParams({
				trainingTypeId: specItem.trainingTypeId,
				trainingId: specItem.id
			}).toString();

			goto('/training/submission?' + queryString);
		}
	};

	const gotoTrainingManage: WorkDefinition = {
		name: '지급 관리',
		class: `btn btn-primary btn-height w-100`,
		grid: 'col-12',
		workType: WorkType.ONLY_SPEC,
		clickCount: 1,
		render: () => {
			const specItem = dataViewer.getSpecItem();

			if (specItem?.trainingType && $userStore.role === UserRole.ADMIN) return true;
			return false;
		},
		onClick: async (workSet: WorkSet) => {
			const specItem = workSet.specItem;

			const queryString = new URLSearchParams({
				trainingId: specItem.id,
				trainingTypeId: specItem.trainingTypeId
			}).toString();

			goto('/training/manage?' + queryString);
		}
	};

	//인증가능기간 계산
	function calculateSubmitPeriod(specItem: any) {
		const formatOption = { includeWeekDay: true, includeSeconds: false };
		const { startAt, endAt } = specItem.currentSubmitSession;

		const nextSubmitStartAt = formatDatetime(new Date(startAt), formatOption);

		let submitDuration;
		if (endAt) submitDuration = formatDatetime(new Date(endAt), formatOption);
		else submitDuration = '없음';

		return [nextSubmitStartAt, submitDuration];
	}

	/* 훈련타입 검색 */
	let fetchedTrainingTypes: Record<string, any>[] | null;
	let trainingTypeSelect: HTMLSelectElement;
	async function searchTrainingType() {
		const values = Validation.getValues(formBind, { scopeNames: ['trainingType'] });

		const searchString = values?.trainingTypeSearchString;

		if (!searchString) {
			alertStore.warn({
				content: '검색어를 입력해주세요',
				duration: 2000
			});
			return;
		}

		loadingStore.showRightNow();

		const response = await axios.get('/api/training/searchTrainingType?search=' + searchString);
		if (!response) return;
		fetchedTrainingTypes = response.data;

		await tick();
		validate(trainingTypeSelect, notEmptyValidation);
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
                    url: '/api/training/delete',
                    method: 'POST',
                    payload: { 
                        targets: [...workSet.selectedItems.keys()]
                    },
                    onSuccessOne: (item, result) => {
                        alertStore.success({
                            title: '훈련 삭제 완료',
                            content: result.message!,
                            duration: 3000
                        });
                    },
                    onFailOne: (item, result) => {
                        alertStore.fail({
                            title: '훈련 삭제 실패',
                            content: result.message!,
                            duration: 3000
                        });
                    },
                    toString: (item) => {
                        return item.title;
                    }
                });
            }
        })
	}

	function onHideSpec() {
		formMode = FormMode.READ;
		fetchedTrainingTypes = null;
	}

	function determindAvailable(targetTime: string, startAt: string, endAt: string) {
		let availFlag: string = '진행';
		let targetTimeDate = parseDate(targetTime);

		if (startAt && endAt) {
			const startAtDate = parseDate(startAt);
			const endAtDate = parseDate(endAt);

			if (targetTimeDate < startAtDate) availFlag = '예정';
			else if (targetTimeDate < endAtDate) availFlag = '진행';
			else availFlag = '종료';
		}

		return availFlag;
	}

	function determindSubmissionAvailable(specItem: any) {
		if (!specItem?.submitStartAt && !specItem?.submitEndAt) return true;

		const now = new Date();
		const submitStartAt = new Date(specItem.submitStartAt);
		const submitEndAt = new Date(specItem.submitEndAt);

		if (submitStartAt <= now && now <= submitEndAt) return true;
		else return false;
	}
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->

<PageContainer title={pageTitle}>
	<div class="row g-2 mt-2">
		<DataViewer
			bind:this={dataViewer}
			bind:limitSchema
			bind:workSchema
			bind:idName
			{sortSchema}
			{searchSchema}
			{fetchURL}
			{specURL}
			{tabSchema}
			itemWrapClass="row gx-0 mt-2 border-top border-bottom"
			useWorkUI={$userStore.role === UserRole.ADMIN}
			on:hide-spec={onHideSpec}
			fetchMapper={(item) => {
				const fetchStart = dataViewer.getFetchStartAt();
				if (!fetchStart) return null;

				const trainAvail = determindAvailable(fetchStart, item.startAt, item.endAt);
				const submitAvail = determindAvailable(fetchStart, item.submitStartAt, item.submitEndAt);

				item.trainAvail = trainAvail;
				item.submitAvail = submitAvail;

				return item;
			}}
		>
			<div slot="item" class="w-100" let:item>
				<div
					class="border-top border-bottom p-2 d-flex flex-column justify-content-between"
					style="min-height: 4.2rem;"
				>
					<div class="d-flex justify-content-between">
						<p>{item.title}</p>
					</div>

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
			</div>

			<div slot="spec" let:specItem class="container-fluid g-0" bind:this={formBind}>
				<div class="row g-2 m-auto">
					{#if formMode === FormMode.READ}
						<!-- 일반 유저 포함 사용자들에게 보여질 읽기 전용 UI -->
						<div class="col-12">
							<div class="d-flex flex-column align-items-center">
								<p class="fs-4">{specItem.title}</p>
								<div class="small text-secondary text-balance text-center">
									<p>
										{#if !specItem.startAt && !specItem.endAt}
											기한 없음
										{:else}
											{formatDatetime(specItem.startAt, { includeSeconds: false })} ~ {formatDatetime(
												specItem.endAt,
												{ includeSeconds: false }
											)}
										{/if}
									</p>
								</div>
							</div>
						</div>

						<div class="col-12">
							<TrainingTypeIndicator trainingType={specItem.trainingType} useExpand={false} />
						</div>

						<div class="col-12">
							<div class="border rounded p-1 text-center small">
								<p class="border-bottom py-1">일정</p>

								<div class="p-1">
									{#if specItem?.currentSubmitSession}
										{#await calculateSubmitPeriod(specItem) then [start, end]}
											<div class="d-flex gap-2">
												<p class="fw-bold text-nowrap">인증 시작</p>
												<p>{start}</p>
											</div>
											<div class="d-flex gap-2">
												<p class="fw-bold text-nowrap">인증 종료</p>
												<p>{end}</p>
											</div>
										{/await}
									{/if}

									<div class="d-flex gap-2 my-1">
										<p class="fw-bold text-nowrap">제출 기간</p>
										{#if !specItem.submitStartAt && !specItem.submitEndAt}
											<p>상시 제출 가능</p>
										{:else}
											<p class="submit-date-range">
												{formatDatetime(specItem.submitStartAt, { includeSeconds: false })} ~ {formatDatetime(
													specItem.submitEndAt,
													{ includeSeconds: false }
												)}
											</p>
										{/if}
									</div>
								</div>
							</div>
						</div>


					{:else}
						<!-- 관리자들이 작업 시 보는 UI -->
						<div class="col-12">
							<FormField floating from={specItem} validation={notEmptyValidation} let:validate>
								<input
									id="title"
									name="제목"
									class="form-control"
									on:input={(e) => validate(e.currentTarget)}
								/>
							</FormField>
						</div>
						<div class="col-12">
							<hr class="my-1" />
						</div>
						<div class="col-12">
							<FormField floating clazz="d-flex gap-1" dataScope="trainingType">
								<input id="trainingTypeSearchString" name="훈련 타입 검색" class="form-control" />
								<button class="btn btn-light text-nowrap" on:click={searchTrainingType}>검색</button
								>
							</FormField>
						</div>
						<div class="col-12">
							<FormField floating from={specItem} validation={notEmptyValidation} let:validate>
								<select
									id="trainingTypeId"
									name="훈련 타입"
									class="form-select"
									on:change={(e) => validate(e.currentTarget)}
									bind:this={trainingTypeSelect}
								>
									<option value="">(훈련타입을 검색해주세요)</option>
									{#if fetchedTrainingTypes}
										{#each fetchedTrainingTypes as trainingType}
											<option value={trainingType.id}>{trainingType.name}</option>
										{/each}
									{:else if specItem?.trainingType}
										<option value={specItem.trainingTypeId} selected
											>{specItem.trainingType.name}</option
										>
									{/if}
								</select>
							</FormField>
						</div>
						<div class="col-12">
							<hr class="my-1" />
						</div>
						<div class="col-12 col-sm-6">
							<FormField floating from={specItem} readonly>
								<input
									id="startAt"
									name="훈련 시작일시"
									class="form-control is-valid"
									on:click={(e) =>
										dateSelector?.open(
											e.currentTarget,
											'훈련 시작일을 선택해주세요',
											DateMode.DATETIME
										)}
								/>
							</FormField>
						</div>
						<div class="col-12 col-sm-6">
							<FormField floating from={specItem} readonly>
								<input
									id="endAt"
									name="훈련 종료일시"
									class="form-control is-valid"
									on:click={(e) =>
										dateSelector?.open(
											e.currentTarget,
											'훈련 종료일을 선택해주세요',
											DateMode.DATETIME
										)}
								/>
							</FormField>
						</div>
						<div class="col-12">
							<hr class="my-1" />
						</div>
						<div class="col-12 col-sm-6">
							<FormField floating from={specItem} readonly>
								<input
									id="submitStartAt"
									name="제출 시작일시"
									class="form-control is-valid"
									on:click={(e) =>
										dateSelector?.open(
											e.currentTarget,
											'제출 시작일을 선택해주세요',
											DateMode.DATETIME
										)}
								/>
							</FormField>
						</div>
						<div class="col-12 col-sm-6">
							<FormField floating from={specItem} readonly>
								<input
									id="submitEndAt"
									name="제출 종료일시"
									class="form-control is-valid"
									on:click={(e) =>
										dateSelector?.open(
											e.currentTarget,
											'제출 종료일을 선택해주세요',
											DateMode.DATETIME
										)}
								/>
							</FormField>
						</div>
						<div class="col-12">
							<hr class="my-1" />
						</div>
					{/if}

					<div class="col-12">
						<FileManager
							fileSetId={specItem?.fileSetId}
							editMode={formMode !== FormMode.READ}
							maxFileCount={null}
							bind:this={fileManager}
						>
							<div slot="content" class="col-12">
								<FormField
									floating
									from={specItem}
									noValidate={formMode === FormMode.READ}
									validation={notEmptyValidation}
									let:validate
								>
									<FlexibleTextarea
										id="content"
										name="내용"
										clazz="form-control"
										foldable={formMode === FormMode.READ}
										editMode={formMode !== FormMode.READ}
										on:input={(e) => validate(e.detail)}
									/>
								</FormField>
							</div>
						</FileManager>
					</div>

					{#if specItem}
						<div class="col-12">
							<TimeStamp
								updatedBy={specItem.updatedBy}
								updatedAt={specItem.updatedAt}
								createdAt={specItem.createdAt}
								createdBy={specItem.createdBy}
							></TimeStamp>
						</div>
					{/if}
				</div>
			</div>

			<div slot="underButtons" class="mt-1" let:specItem>
				{#if formMode === FormMode.READ}
					{#if determindSubmissionAvailable(specItem) === false}
						<button class="btn btn-height btn-success w-100" style="opacity: 0.5;"  on:click={() => {
							alertStore.warn({
								content: '인증자료 제출기간이 아닙니다',
								duration: 2000
							})
						}}>인증자료 제출</button>
					{/if}
				{/if}
			</div>
		</DataViewer>
	</div>
</PageContainer>

<DateSelector bind:this={dateSelector} />

<Modal
	title="경고"
	bind:this={deleteWarnModal}
	footerSlot
	contentClass="activated-modal"
	alwaysRender
>
	<p>
		훈련을 삭제하면 해당 훈련에 제출된 자료, 지급된 달란트가 <span class="text-danger"
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
	.submit-date-range {
		text-wrap: balance;
	}

</style>
