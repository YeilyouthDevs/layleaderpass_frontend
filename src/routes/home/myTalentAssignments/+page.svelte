<script lang="ts">
	import { replaceState } from '$app/navigation';
	import DataViewer from '$lib/components/DataViewer/DataViewer.svelte';
	import { FormMode, type LimitSchema, type SearchSchema, type SortSchema, type WorkSchema } from '$lib/components/DataViewer/script';
	import FormField from '$lib/components/FormField.svelte';
	import PageContainer from '$lib/components/PageContainer.svelte';
	import TimeStamp from '$lib/components/TimeStamp.svelte';
	import TrainingTypeIndicator from '$lib/components/TrainingTypeIndicator.svelte';
	import { formatDatetime } from '$lib/script/lib/formatDatetime';
	import axios from 'axios';
	import CategorySelector from '../CategorySelector.svelte';
	import TrainingHeaderIndicator from '$lib/components/TrainingHeaderIndicator.svelte';
  
    let dataViewer: DataViewer;
    let formBind: Element;
    let formMode = FormMode.READ;
    let fetchURL: string;
    let specURL: string;
    let idName: string;
    let fetchPayload: any = {};
  
    const sortSchema: SortSchema = [
      { name: '최신순', value: 'latest' },
    ];
  
    const searchSchema: SearchSchema = [
      { name: '훈련 제목', value: 'title' },
    ];
  
    let limitSchema: LimitSchema = [10, 20, 30, 40, 50];
    let workSchema: WorkSchema;
  
    idName = 'id';
    fetchURL = '/api/myTalentAssignments/list';
    specURL = '/api/myTalentAssignments/spec';
    workSchema = {};
  
    function onHideSpec() {
      formMode = FormMode.READ;
    }
  
    const urlParams = new URLSearchParams(window.location.search);
    let categoryId: string | undefined = urlParams.get('categoryId') || undefined;
  
    // URL에서 categoryId 파라미터 제거
    if (categoryId) {
      urlParams.delete('categoryId');
      const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
      replaceState(newUrl, { })
    }
  
  </script>
  
  <PageContainer title="내 달란트 지급내역">
    <DataViewer bind:this={dataViewer} 
        bind:limitSchema
        bind:workSchema
        bind:idName
        {sortSchema}
        {searchSchema}
        {fetchURL}
        {specURL}
        {fetchPayload}
        itemWrapClass="row gx-0 mb-2 border-top border-bottom"
        useWorkUI={false}
        on:hide-spec={onHideSpec}
        showSearchOption={true}
    >
        <div slot="searchOption">
        <CategorySelector clazz="pb-1" bind:fetchPayload {categoryId} afterCallback={() => {
            dataViewer.fetch();
        }} />     
        </div>
  
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
                    <TrainingHeaderIndicator trainingHeader={specItem.training} />
                </div>
                <div class="col-12">
                    <TrainingTypeIndicator trainingType={specItem.training.trainingType} />
                </div>
                <div class="col-12">
                    <FormField floating from={specItem} noValidate>
                        <input id="sum" name="이 훈련에서 획득한 총 달란트" class="form-control">
                    </FormField>
                </div>
                <div class="col-12">
                    <FormField floating from={specItem} noValidate>
                        <input id="amount" name="지급량" class="form-control">
                    </FormField>
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
  </PageContainer>
  
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
  