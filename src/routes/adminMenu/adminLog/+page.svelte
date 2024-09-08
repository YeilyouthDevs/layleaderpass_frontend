<!-- registerAccept/+page.svelte -->
<script lang="ts">
	import DataViewer from "$lib/components/DataViewer/DataViewer.svelte";
	import { type LimitSchema, type SearchSchema, type SortSchema, type WorkSchema, type WorkSet } from "$lib/components/DataViewer/script";
	import PageContainer from "$lib/components/PageContainer.svelte";
	import UserContact from "$lib/components/UserContact.svelte";
	import { formatDatetime } from "$lib/script/lib/formatDatetime";

    const pageTitle = "관리자 로그";
        
    let dataViewer: DataViewer;

    const sortSchema: SortSchema = [
        { name: '최신순', value: 'createdAt' },
    ]

    const limitSchema: LimitSchema = [ 50, 100, 150, 200, 250 ]

    const searchSchema: SearchSchema = [
        { name: '내용', value: 'message' }
    ]

    const workSchema = {};

</script>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->

<PageContainer title={pageTitle}>
    <DataViewer bind:this={dataViewer} 
        {sortSchema} {limitSchema} {workSchema} {searchSchema}
        idName="id"
        fetchURL="/api/static/adminLog"
        itemWrapClass="row gx-0 mb-2 border-top border-bottom"
        useWorkUI
    >
        <div slot="item" class="w-100" let:item>
            <div class="border-top border-bottom p-1 d-flex flex-column small">
                <div>
                    <p style="font-size: 0.8rem;"><span>{formatDatetime(item.createdAt, { includeSeconds: false })}</span> <UserContact email={item.updatedBy} style="border-radius: 0.25rem; background-color: #eee; padding: 0.1rem 0.2rem" /></p>
                </div>
                
                <div class="d-flex gap-2 align-items-center justify-content-center" style="padding-left: 0.2rem">
                        <p class="flex-grow-1" style="font-size: 0.9rem; word-break: break-all;">{item.message} </p>
                </div>
            </div>
        </div>

    </DataViewer>
</PageContainer>

<style lang="scss">


</style>
