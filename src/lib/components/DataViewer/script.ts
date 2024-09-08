import { loadingStore } from "$lib/stores/loadingStore";
import axios from "axios";
import type DataViewer from "./DataViewer.svelte";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Meta {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    startAt: string;
}

export interface FetchRequest {
    sort: string;
    page: number;
    limit: string;
    startAt?: string;
    searchBy?: string;
    searchString?: string;
}

export interface KeyValueDefinition {
    name: string;
    value: string;
}

export interface WorkDefinition {
    name: string;                            
    class: string;
    min?: number;
    max?: number;
    exact?: number;
    render: (workSet?: WorkSet) => boolean;
    workType: WorkType;
    grid?: string;
    clickCount?: number;
    onClick?: (workSet: WorkSet) => (Promise<ResultSet | void>);
}

export interface WorkResult {
    id: string | number;
    status: boolean;
    message?: string;
}

export interface WorkSet {
    selectedItems: Map<any, any>;
    pageItems: Map<any, any>;
    specItem?: any;
}

export interface ResultSet {
    results: WorkResult[],
    toString: (item: any) => string
}

export interface MultiWorkHandlerSchema {
    url: string;
    method: string;
    payload?: object;
    preHandler?: (() => void) | (() => Promise<void>);
    onSuccessOne: (item: any, result: WorkResult) => void,
    onFailOne: (item: any, result: WorkResult) => void,
    toString: (item: any) => string;
}

export interface TabDefinition {
    select?: boolean;
    name: string;
    onClick: CallableFunction;
}

export type TabSchema = TabDefinition[];

export enum SpecModeType {
    CREATE, EDIT, READ_ONLY, CLOSED
}

export enum InputMode {
    READ, CREATE, EDIT
}

export enum FormMode {
    READ, CREATE, EDIT
}

export class SpecMode {
    declare value: SpecModeType;

    constructor(initial?: SpecModeType) {
        this.value = initial ?? SpecModeType.CLOSED;
    }

    isClosed(){
        return this.value === SpecModeType.CLOSED;
    }

    isReadOnly(){
        return this.value === SpecModeType.READ_ONLY;
    }

    isEdit(){
        return this.value === SpecModeType.EDIT;
    }

    isCreate(){
        return this.value === SpecModeType.CREATE;
    }

    set(value: SpecModeType) {
        this.value = value;
    }
}


export enum WorkType {
    ONLY_SPEC, ONLY_WORK, BOTH
}

export type WorkArgs = Record<any, any>;

export type SortSchema = KeyValueDefinition[];
export type SearchSchema = KeyValueDefinition[];

export type LimitSchema = number[]

export type WorkSchema = Record<string, WorkDefinition>

export type WorkFunction = (workSet: WorkSet, args: Record<any, any>) => (Promise<ResultSet | undefined>);

export async function handleWork(dataViewer: DataViewer, schema: MultiWorkHandlerSchema): Promise<ResultSet | void> {

    const specItem = dataViewer.getSpecItem();
    const selectedItems = dataViewer.getSelectedItems();

    try {
        loadingStore.showRightNow();
        await schema.preHandler?.()

        const response = await axios.request({
            url: schema.url,
            method: schema.method,
            params: (['GET', 'DELETE'].includes(schema.method)) ? schema.payload : undefined,
            data: (['POST', 'PUT'].includes(schema.method)) ? schema.payload : undefined,
        })

        const results: WorkResult[] = response.data;

        if (selectedItems.size <= 1){  //상세보기에서 작업한 경우 안내 표시
            const result = results[0] || results; 

            if (result.status === true) {
                schema.onSuccessOne(specItem, result);
            }else if(result.status === false) {
                throw result;
            }
        } 

        return { results, toString: schema.toString } as ResultSet;
    } catch (result) {
        schema.onFailOne(specItem, result as WorkResult);
    } finally {
        loadingStore.hide();
    }
}