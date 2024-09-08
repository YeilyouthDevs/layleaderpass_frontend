<script lang="ts">
	import DataViewer from '$lib/components/DataViewer/DataViewer.svelte';
	import { FormMode, type LimitSchema, type SearchSchema, type SortSchema, type TabSchema, type WorkSchema } from '$lib/components/DataViewer/script';
	import FormField from '$lib/components/FormField.svelte';
	import TimeStamp from '$lib/components/TimeStamp.svelte';
	import { formatDatetime } from '$lib/script/lib/formatDatetime';
	import { slide } from 'svelte/transition';

    let show: boolean = false;

    function toggleShow() {
        show = !show;
    }


    // ------------------------


    let dataViewer: DataViewer;
    let formBind: Element;
    let formMode = FormMode.READ;
    let fetchURL: string;
    let specURL: string;
    let idName:string;


    const sortSchema: SortSchema = [
        { name: '최신순', value: 'latest' },
    ]

    const searchSchema: SearchSchema = [
        { name: '훈련 제목', value: 'title' },
    ]


    let limitSchema: LimitSchema = [ 10, 20, 30, 40, 50 ]
    let workSchema: WorkSchema;

    enum DataTab { TALENT_ASSIGNMENTS, SUBMISSIONS };
    let dataTab: DataTab = DataTab.TALENT_ASSIGNMENTS;

    const tabSchema: TabSchema = [
        {
            name: '달란트 지급기록',
            select: true,
            onClick: () => {
                dataTab = DataTab.TALENT_ASSIGNMENTS
            }
        },
        {
            name: '자료제출 기록',
            onClick: () => {
                dataTab = DataTab.SUBMISSIONS
            }
        },
    ]

    $: if (dataTab === DataTab.TALENT_ASSIGNMENTS) {
        idName = 'id';    
        fetchURL = '/api/mypage/list/talentAssignments';
        specURL = '/api/mypage/spec/talentAssignments';
        workSchema = {  }
    }
     else if(dataTab === DataTab.SUBMISSIONS){
        fetchURL = '/api/mypage/list/submissions';
    }


    function onShowSpec() {
        const specItem = dataViewer.getSpecItem();
        console.log('showSpec specItem', specItem);
    }

    function onHideSpec(){
        // workPage = null;
        formMode = FormMode.READ
    }

</script>



<div class="container g-0">
    {#if show}
    <hr>

    <div class="row g-0" transition:slide={{ duration: 150, axis: 'y' }}>
    
    <DataViewer bind:this={dataViewer} 
        bind:limitSchema
        bind:workSchema
        bind:idName
        {tabSchema}
        {sortSchema}
        {searchSchema}
        {fetchURL}
        {specURL}
        itemWrapClass="row gx-0 border-top border-bottom"
        useWorkUI={false}
        noDesc={true}
        on:show-spec={onShowSpec}
        on:hide-spec={onHideSpec}
    >

        <div slot="item" class="item w-100" let:item>
            <div class="border-top border-bottom p-2 d-flex align-items-center justify-content-between" style="min-height: 3rem;">

                <div class="wrapper">
                    <div class="d-flex flex-column">
                        <p class="training-title">{item.training.title}</p>
                        <p class="timestamp">{formatDatetime(item.createdAt, { includeSeconds: false })}</p>
                    </div>

                    <div class="talent-indicator">
                        <img class="talent-icon" src="/images/talent_icon.png" alt="달란트">
                        <p class="amount">{item.amount}</p>
                    </div>

                {#if item.deletedAt}
                        <div class="delete-indicator">
                            <div class="cancel-line" />
                            <p class="label">회수됨</p>
                        </div>
                    {/if}
                </div>

            </div>
        </div>

        <div slot="spec" let:specItem class="container-fluid g-0" bind:this={formBind}>
            <div class="row g-2 m-auto">
                    <div class="col-12">
                        <FormField floating from={specItem} noValidate>
                            <input id="training.title" name="훈련 제목" class="form-control">
                        </FormField>
                    </div>
                    <div class="col-12">
                        <FormField floating from={specItem} noValidate>
                            <input id="training.trainingType.name" name="훈련 타입" class="form-control">
                        </FormField>
                    </div>
                    <div class="col-12">
                        <FormField floating from={specItem} noValidate>
                            <input id="amount" name="지급량" class="form-control">
                        </FormField>
                    </div>
                    <div class="col-12">
                        <div class="form-floating">
                            <p class="form-control">
                                {#if specItem?.deletedAt}
                                    회수됨
                                {:else}
                                    지급됨
                                {/if}
                            </p>
                            <!-- svelte-ignore a11y-label-has-associated-control -->
                            <label>상태</label>
                        </div>
                    </div>
                    <div class="col-12">
                        <TimeStamp createdBy={specItem?.createdBy} createdAt={specItem?.createdAt} updatedBy={specItem?.updatedBy} updatedAt={specItem?.updatedAt} 
                            createdByLabel="지급자"
                            createdAtLabel="지급일시"
                        />
                    </div>
            </div>
        </div>

    </DataViewer>

    </div>
    {:else}
    <div class="row g-0">
        <button class="btn btn-secondary w-100" on:click={toggleShow}>달란트 지급 • 자료 승인내역</button>
    </div>    
    {/if}
</div>


<style lang="scss">
.item {
    .wrapper {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: relative;
    }

    .training-title {
        text-wrap: balance;
    }

    .timestamp {
        font-size: 0.9rem;
        color: gray;
    }

    .talent-indicator {
        display: flex;
        gap: 0.4rem;
        align-items: center;

        .talent-icon {
            width: 1.5rem;
            height: 1.5rem;
        }

        .amount {
            font-size: 1.2rem;
            font-weight: bold;
            min-width: 2rem;
            text-align: end;
        }
    }

    .delete-indicator {
        position: absolute;
        bottom: -0.35rem;
        right: -0.6rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;

        .cancel-line {
            border-top: 3px solid rgb(199, 75, 75);
            min-width: 5rem;
            opacity: 0.5;
        }

        .label {
            font-size: 0.8rem;
            font-weight: bold;
            color: rgb(199, 75, 75);
        }
    }

}
</style>