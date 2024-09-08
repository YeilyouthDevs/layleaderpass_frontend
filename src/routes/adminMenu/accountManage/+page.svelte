<!-- registerAccept/+page.svelte -->
<script lang="ts">
	import DataViewer from "$lib/components/DataViewer/DataViewer.svelte";
	import { WorkType, handleWork, type LimitSchema, type SearchSchema, type SortSchema, type WorkSchema, type WorkSet } from "$lib/components/DataViewer/script";
	import FormField from "$lib/components/FormField.svelte";
	import Modal from "$lib/components/Modal.svelte";
	import MultiClickDiv from "$lib/components/MultiClickDiv.svelte";
	import PageContainer from "$lib/components/PageContainer.svelte";
	import TimeStamp from "$lib/components/TimeStamp.svelte";
	import { formatDatetime } from "$lib/script/lib/formatDatetime";
	import { Validation } from "$lib/script/lib/validation";
	import { alertStore } from "$lib/stores/alertStore";
	import { UserRole } from "$lib/stores/userStore";

    const pageTitle = "계정 관리";
    
    const idName = 'email';
    let dataViewer: DataViewer;
    let formBind: Element;
    let deleteConfirmWarnModal: Modal;

    const sortSchema: SortSchema = [
        { name: '역할순', value: 'role' },
        { name: '가나다순', value: 'abc' },
        { name: '가입승인순', value: 'acceptNo' },
    ]

    const limitSchema: LimitSchema = [ 10, 20, 30, 40, 50 ]

    const searchSchema: SearchSchema = [
        { name: '이름', value: 'name' }
    ]

    const workSchema:WorkSchema = {
        unban: {
            name: '복원',
            class: 'btn btn-success btn-height w-100',
            workType: WorkType.BOTH,
            min: 1,
            render: () => true,
            onClick: async (workSet: WorkSet) => {
                return await handleWork(dataViewer, {
                    url: '/api/accountManage/restore',
                    method: 'PUT',
                    payload: {
                        targets: [...workSet.selectedItems.keys()]
                    },
                    onSuccessOne(item: any) {
                        alertStore.success({
                            title: '복원 완료',
                            content: `${item.name} 의 계정을 복원했습니다.`,
                            duration: 2000
                        })
                    },
                    onFailOne(item: any, result: any) {
                        alertStore.fail({
                            title: '복원 실패',
                            content: result.message,
                            duration: 3000
                        })
                    },
                    toString: (item: any) => item.name
                })
            }
        },
        ban: {
            name: '삭제',
            class: 'btn btn-danger btn-height w-100',
            workType: WorkType.BOTH,
            min: 1,
            render: () => true,
            onClick: async (workSet: WorkSet) => {
                return await handleWork(dataViewer, {
                    url: '/api/accountManage/delete',
                    method: 'PUT',
                    payload: {
                        targets: [...workSet.selectedItems.keys()]
                    },
                    onSuccessOne(item: any) {
                        alertStore.success({
                            title: '삭제 완료',
                            content: `${item.name} 의 계정을 삭제했습니다.`,
                            duration: 3000
                        })
                    },
                    onFailOne(item: any, result: any) {
                        alertStore.fail({
                            title: '삭제 실패',
                            content: result.message,
                            duration: 3000
                        })
                    },
                    toString: (item: any) => item.name
                })
            }
        },
        
        remove: {
            name: '삭제 확정',
            class: 'btn btn-secondary btn-height w-100',
            workType: WorkType.BOTH,
            render: () => true,
            onClick: async (workSet: WorkSet) => {
                dataViewer.getSpecModal().invisible()
                dataViewer.getWorkMenuModal().invisible();
                deleteConfirmWarnModal.show();
            }
        },
        changeRole: {
            name: '역할 변경',
            class: 'btn btn-secondary btn-height w-100',
            workType: WorkType.ONLY_SPEC,
            render: () => true,
            onClick: async (workSet: WorkSet) => {
                const values = Validation.getValues(formBind);
                if (!values) return;

                const item  = workSet.specItem;

                if (item.role === values.role) {
                    alertStore.warn({
                        content: '기존과 다른 역할을 선택하고 다시 시도해주세요.',
                        duration: 2000
                    }); return;
                }
                
                return await handleWork(dataViewer, {
                    url: '/api/accountManage/changeRole',
                    method: 'PUT',
                    payload: {
                        targetEmail: workSet.specItem.email,
                        targetRole: values.role
                    },
                    onSuccessOne(item: any, result) {
                        alertStore.success({
                            title: '역할 변경 완료',
                            content: `${item.name} 의 역할이 ${values.role} (으)로 변경되었습니다.`,
                            duration: 3000
                        })
                    },
                    onFailOne(item: any, result: any) {
                        alertStore.fail({
                            title: `역할 변경 실패`,
                            content: result.message,
                            duration: 3000
                        })
                    },
                })
            }
        },
        
    }

    async function requestDeleteConfirm() {
		deleteConfirmWarnModal.hide();
        dataViewer.getSpecModal().visible()
        dataViewer.getWorkMenuModal().visible();

        await dataViewer.doSomeWork({
            name: '삭제 확정',
            class: '',
            workType: WorkType.BOTH,
            render: () => true,
            onClick: async (workSet: WorkSet) => {
                
                return await handleWork(dataViewer, {
                    url: '/api/accountManage/deleteConfirm',
                    method: 'PUT',
                    payload: {
                        targets: [...workSet.selectedItems.keys()]
                    },
                    onSuccessOne(item: any) {
                        alertStore.success({
                            title: '삭제 확정 완료',
                            content: `${item.name} 의 계정삭제를 확정했습니다.`,
                            duration: 3000
                        })
                    },
                    onFailOne(item: any, result: any) {
                        alertStore.fail({
                            title: '삭제 확정 실패',
                            content: result.message,
                            duration: 3000
                        })
                    },
                    toString: (item: any) => item.name
                })
            }
        })
	}


</script>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->


<PageContainer title={pageTitle}>
    <DataViewer bind:this={dataViewer} 
        {sortSchema} {limitSchema} {workSchema} {searchSchema} {idName}
        fetchURL="/api/accountManage/list"
        specURL="/api/accountManage/spec"
        itemWrapClass="row gx-0 mb-2 border-top border-bottom"
        useWorkUI
    >
        <div slot="item" class="w-100" let:item let:sort>
            <div class="border-top border-bottom p-2 d-flex align-items-center justify-content-between" style="min-height: 3rem;">
                
                <div class="d-flex gap-2 align-items-center justify-content-center">
                    <p class="role-badge"
                        class:role-admin={item.role === UserRole.ADMIN}
                        class:role-user={item.role === UserRole.USER}
                        class:role-guest={item.role === UserRole.GUEST}
                    >{item.role}</p>

                    <p class="flex-grow-1">{item.name}</p>

                    {#if sort === 'acceptNo'}
                        <p class="small text-secondary">{item.acceptNo}</p>
                    {/if}
                </div>

                <div class="d-flex justify-content-end gap-2" style="min-width: 5rem;">
                    {#if item.deletedAt}
                    <p class="status-badge deleted">삭제됨</p>
                    {:else if item.role === UserRole.GUEST && item.acceptNo && !item.isDeleted}
                    <p class="status-badge oldRookie">재가입</p>
                    {/if}
                </div>
            </div>
        </div>

        <div slot="spec" let:specItem class="container-fluid g-0" bind:this={formBind}>
            <div class="row g-2 m-auto">
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
                    <FormField floating from={specItem}>
                        <select id="role" name="역할" class="form-select">
                            {#each Object.entries(UserRole) as [key, value]}
                                    <option value="{value}" selected={value === specItem.role} >{key}</option>
                            {/each}
                        </select>
                    </FormField>
                </div>
                <div class="col-12">
                    <FormField floating from={formatDatetime(specItem.createdAt, { includeSeconds: false })} noValidate>
                        <input id="createdAt" name="가입일시" class="form-control">
                    </FormField>
                </div>
                {#if specItem.acceptNo}
                <div class="col-12">
                    <FormField floating from={specItem} noValidate>
                        <input id="acceptNo" name="가입 승인번호" class="form-control">
                    </FormField>
                </div>
                {/if}
                {#if specItem.deletedAt}
                <div class="col-12">
                    <FormField floating from={formatDatetime(specItem.deletedAt, { includeSeconds: false })} noValidate>
                        <input id="deletedAt" name="삭제일시" class="form-control">
                    </FormField>
                </div>
                {/if}
                {#if specItem.deleteConfirmAt}
                <div class="col-12">
                    <FormField floating from={formatDatetime(specItem.deleteConfirmAt, { includeTime: false })} noValidate>
                        <input id="deleteConfirmAt" name="삭제 확정일" class="form-control">
                    </FormField>
                </div>
                {/if}
                <div class="col-12">
                    <TimeStamp updatedAt={specItem.updatedAt} updatedBy={specItem.updatedBy} createdAt={specItem.createdAt} />
                </div>
            </div>
        </div>
        
    </DataViewer>
</PageContainer>

<Modal
	title="경고"
	bind:this={deleteConfirmWarnModal}
	footerSlot
	contentClass="activated-modal"
	alwaysRender
>
	<p>
		계정 삭제를 확정하면 해당 사용자의 계정 정보와 훈련 데이터(달란트 지급, 자료 제출) 가 <span class="text-danger"
			>모두 삭제</span
		>됩니다. 진행하시겠습니까?
	</p>
	<div slot="footer" class="container-fluid g-0">
		<div class="row g-1">
			<div class="col-6">
				<MultiClickDiv
					clickCount={5}
					clazz="btn btn-danger btn-height"
					style="width: 100%;"
					callback={requestDeleteConfirm}>삭제</MultiClickDiv
				>
			</div>
			<div class="col-6">
				<button class="btn btn-secondary btn-height w-100" on:click={() => {
                    deleteConfirmWarnModal.hide()
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

    .role-badge {
        border-radius: 0.25rem;
        padding: 0.25rem 0.5rem;
        min-width: 3rem;
        height: 1.4rem;
        display: flex;
        align-items: center;
        justify-content: center; 
        font-size: 0.6rem;
        font-weight: bold;
        color: white;
    }

    .role-admin {
        background-color: rgb(16, 146, 221);
    }

    .role-user {
        background-color: rgb(92, 185, 112);
    }

    .role-guest {
        background-color: rgb(135, 66, 180);
    }

    .status-badge {
        font-size: 0.75rem;
        color: rgb(255, 255, 255);
        padding: 0.25rem 0.5rem;
        font-weight: bold;
        border-radius: 0.25rem;
    }

    .oldRookie {
        background-color: rgb(93, 95, 255);
    }

    .deleted {
        background-color: rgb(255, 100, 100);
    }

</style>
