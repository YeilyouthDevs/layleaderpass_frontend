<!-- registerAccept/+page.svelte -->
<script lang="ts">
	import DataViewer from "$lib/components/DataViewer/DataViewer.svelte";
	import { WorkType, handleWork, type LimitSchema, type SearchSchema, type SortSchema, type WorkArgs, type WorkSchema, type WorkSet } from "$lib/components/DataViewer/script";
	import FormField from "$lib/components/FormField.svelte";
	import PageContainer from "$lib/components/PageContainer.svelte";
	import SimpleDesc from "$lib/components/SimpleDesc.svelte";
	import UpdatedBy from "$lib/components/TimeStamp.svelte";
	import { formatDatetime } from "$lib/script/lib/formatDatetime";
	import { alertStore } from "$lib/stores/alertStore";
    
    let dataViewer: DataViewer;

    const pageTitle = '회원가입 승인/거절'
    const desc = '사용자의 가입을 승인하거나 거절합니다.';

    const sortSchema: SortSchema = [
        { name: '최신순', value: 'latest' },
        { name: '가나다순', value: 'abc' }
    ]

    const limitSchema: LimitSchema = [ 10, 20, 30, 40, 50 ]

    const searchSchema: SearchSchema = [
        { name: '이름', value: 'name' }
    ]

    const workSchema:WorkSchema = {
        accept: {
            name: '가입 승인',
            class: 'btn btn-success btn-height w-100',
            workType: WorkType.BOTH,
            min: 1, //최소 한개 이상 선택되어야함
            render: () => true,
            onClick: async (workSet: WorkSet) => {
                return await confirmRegister(workSet, { confirm: true });
            }
        },
        deny: {
            name: '가입 거절',
            class: 'btn btn-danger btn-height w-100',
            min: 1,
            workType: WorkType.BOTH,
            render: () => true,
            onClick: async (workSet: WorkSet) => {
                return await confirmRegister(workSet, { confirm: false });
            }
        },
    }

    async function confirmRegister(workSet: WorkSet, workArgs: WorkArgs){
        const label = workArgs.confirm ? '승인' : '거절';

        return await handleWork(dataViewer, {
            url: '/api/regAccept/confirm',
            method: 'PUT',
            payload: {
                targets: [...workSet.selectedItems.keys()],
                confirm: workArgs.confirm
            },
            onSuccessOne(item: any) {
                alertStore.success({
                    title: `${label} 완료`,
                    content: `${item.name} 의 가입이 ${label} 되었습니다.`,
                    duration: 2000
                })
            },
            onFailOne(item: any, result: any) {
                alertStore.fail({
                    title: `실패`,
                    content: `${item.name} 의 가입 ${label}이 실패했습니다. 이유: ${result.message}`,
                    duration: 3000
                })
            },
            toString: (item: any) => item.name
        })
    }

</script>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->


<PageContainer title={pageTitle}>
    <DataViewer bind:this={dataViewer}
        {sortSchema} {limitSchema} {workSchema} {searchSchema}
        idName="email"
        fetchURL="/api/regAccept/list"
        specURL="/api/regAccept/spec"
        itemWrapClass="row gx-0 mb-2 border-top border-bottom"
        useWorkUI
    >
        <div slot="item" class="w-100" let:item >
            <div class="border-top border-bottom p-2 d-flex align-items-center" >
                <p>{item.name}</p> <p class="ms-2 small text-secondary">{formatDatetime(item.birthday, { includeTime: false })} 생</p>
            </div>
        </div>

        <div slot="spec" let:specItem class="container-fluid g-0">
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
                    <FormField floating from={formatDatetime(specItem.birthday, { includeTime: false })} noValidate>
                        <input id="birthday" name="생일" class="form-control">
                    </FormField>
                </div>
                <div class="col-12">
                    <FormField floating from={specItem} noValidate>
                        <input id="phone" name="연락처" class="form-control">
                    </FormField>
                </div>
                <div class="col-12">
                    <FormField floating from={formatDatetime(specItem.createdAt, { includeSeconds: false })} noValidate>
                        <input id="createdAt" name="가입일시" class="form-control">
                    </FormField>
                </div>
                <div class="col-12">
                    <UpdatedBy updatedAt={specItem.updatedAt} updatedBy={specItem.updatedBy} createdAt={specItem.createdAt}/>
                </div>
            </div>
        </div>

        <div slot="selectedItem" class="p-1 small border col-12 col-sm-6" let:item>
            <div>
                <p class="text-secondary">{item.email}</p>
                <div class="d-flex gap-2 justify-space-between">
                    <p>{item.name}</p>
                    <p class="text-secondary">{formatDatetime(item.birthday, { includeTime: false })} 생</p>
                </div>
            </div>
        </div>
        
    </DataViewer>
</PageContainer>

<style lang="scss">

</style>
