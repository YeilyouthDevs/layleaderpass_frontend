<!-- lib/components/FileManager/FileManager.svelte -->

<script lang="ts">
	import type { FileStructure } from './FileStructure';
	import { cleanObjectURL, IMAGE_EXTENSIONS, NOT_ALLOW_EXTENSIONS } from './FileStructure';

    import { alertStore } from '$lib/stores/alertStore';
    import { loadingStore } from "$lib/stores/loadingStore";
    import { onDestroy } from "svelte";
    import Modal from '../Modal.svelte';
    import FileFetcher from "./FileFetcher";
    import { createFileStructure, FileStructureType, MAX_FILE_NAME_LENGTH, MAX_FILE_SIZE } from "./FileStructure.js";
    import ImageViewer from "./ImageViewer.svelte";

    export let fileSetId: number | undefined;
    export let editMode: boolean = false;
    export let maxFileCount: number|undefined|null = 6;
    export let noFileList: boolean = false;
    export let hideImage: boolean = false;

    let rawFiles: File[] = [];
    let files: FileStructure[] = [];
    let imageFiles: FileStructure[] = [];
    let displayFiles: FileStructure[] = [];
    let imageViewer: ImageViewer;
    let selectedFiles: Set<FileStructure> = new Set();
    let selectMode: boolean = false;
    let downloadModal: Modal;
    let downloadTargetFile: FileStructure;
    let maxOrder: number = 0;

    $: if (files && files.length > 0) {
        displayFiles = extractDisplayFiles(files);
        imageFiles = extractOnlyImages(files);
    }

    function extractOnlyImages(files: FileStructure[]) {
        return files.filter(file => !file.isDeleted && file.type === FileStructureType.IMAGE);
    }

    function extractDisplayFiles(files: FileStructure[]) {
        return files.filter(file => !file.isDeleted);
    }

    function handleFileChange(event: Event | null, isRefresh?: boolean) {
        const target = event?.target as HTMLInputElement;

        if (target.files || isRefresh) {
            let inputFiles = (isRefresh) ? rawFiles : Array.from(target.files!);

            let validFile: File[] = []

            for (const inputFile of inputFiles) {
                const errMsg = validateFile(inputFile);

                if (errMsg) {
                    alertStore.warn({
                        title: '파일 추가 실패',
                        content: errMsg
                    })

                    validFile = [];
                    return;
                } else {
                    validFile.push(inputFile);
                }
            }

            if (maxFileCount && displayFiles.length + validFile.length > maxFileCount) {
                alertStore.warn({
                    title: '파일 추가 실패',
                    content: `최대 ${maxFileCount} 개 파일만 업로드할 수 있습니다.`
                })
                return;
            }

            if (validFile.length > 0) {
                validFile.forEach((file) => {
                    if (!isRefresh) rawFiles.push(file);
                    
                    files.push(createFileStructure(file, ++maxOrder))
                })
            }

            files = files
        }
    }

    function validateFile(file: File): string | void {
        let ext = file.name.split('.')[1] || '';
        if (ext) ext = '.' + ext;

        if (file.size > MAX_FILE_SIZE) {
            return `파일 크기가 너무 큽니다. 최대 크기는 5Mb 입니다.  (${file.name})`;
        }

        if (file.name.length > MAX_FILE_NAME_LENGTH) {
            return `파일 이름이 너무 깁니다. 최대 길이는 영문 200자, 한글 100자 입니다. (${file.name})`;
        }

        if (NOT_ALLOW_EXTENSIONS.includes(ext)) {
            return `업로드 할 수 없는 확장자입니다: (${file.name})`;
        }
    }

    $: if (fileSetId) {
        fetchAll()
    }

    async function fetchAll() {

        loadingStore.show()

        try {
            maxOrder = await FileFetcher.fetchFileSet(fileSetId!, files);
            await FileFetcher.fetchThumbnails(fileSetId!, files);

            files = files;
        } finally {
            loadingStore.hide()
        }
    }


    onDestroy(() => {
        cleanObjectURL(files);
    });

    export function getFiles() {
        return files;
    }

    export function getDisplayFiles() {
        return displayFiles;
    }

    async function onClickThumbnail(idx: number) {
        imageViewer.show(idx);
    }

    function handleShowError(context: { idx: number, file: FileStructure, error: any }) {
        const { file: targetFile, error } = context;

        if (error.errType === 'ControlledError' && (error.message as string).includes('삭제')) {
            deleteFile(targetFile);
        }
    }

    function deleteFile(targetFile: FileStructure) {
        files = files.filter((file) => file.id !== targetFile.id)
        displayFiles = displayFiles.filter((file) => file.id !== targetFile.id)
        imageFiles = imageFiles.filter((file) => file.id !== targetFile.id)

        selectedFiles.delete(targetFile);
        selectedFiles = selectedFiles;
        downloadModal.hide();
    }

    function onClickFile(file: FileStructure) {
        if (selectMode) {
            toggleSelectFile(file)
        } else {
            if (file.id) {
                downloadTargetFile = file;
                downloadModal.show();
            }
        }
    }

    function toggleSelectFile(file: FileStructure) {
        if (selectedFiles.has(file)) {
            selectedFiles.delete(file)
        } else {
            selectedFiles.add(file)
        }

        selectedFiles = selectedFiles
    }

    function toggleSelectMode() {
        if (selectMode) {
            selectMode = false;
            selectedFiles = new Set();
        } else {
            selectMode = true;
        }
    }

    function moveSelectedFiles(direction: 'up' | 'down') {
        if (direction === 'up') {
            for (let i = 1; i < files.length; i++) {
                if (selectedFiles.has(files[i]) && !selectedFiles.has(files[i - 1])) {
                    [files[i], files[i - 1]] = [files[i - 1], files[i]];
                    // order 업데이트
                    const tempOrder = files[i].order;
                    files[i].order = files[i - 1].order;
                    files[i - 1].order = tempOrder;
                }
            }
        } else if (direction === 'down') {
            for (let i = files.length - 2; i >= 0; i--) {
                if (selectedFiles.has(files[i]) && !selectedFiles.has(files[i + 1])) {
                    [files[i], files[i + 1]] = [files[i + 1], files[i]];
                    // order 업데이트
                    const tempOrder = files[i].order;
                    files[i].order = files[i + 1].order;
                    files[i + 1].order = tempOrder;
                }
            }
        }
        // order 기준으로 정렬
        files.sort((a, b) => a.order - b.order);
    }

    function onClickDelete() {
        for (const file of selectedFiles) {
            file.isDeleted = true
            selectedFiles.delete(file)
        }

        selectedFiles = selectedFiles;
        files = files.filter((file) => !(file.isDeleted && file.file))
    }

    let fileInput: HTMLInputElement;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="container g-0">
    <input type="file" multiple on:change={handleFileChange} hidden bind:this={fileInput}>

    <div class="row g-1">
        <div class="col-12">
            {#if editMode || imageFiles.length > 0}
            <div class="common-wrap thumb-wrap { !imageFiles.length ? 'justify-content-center' : '' }">
                {#each imageFiles as file, idx}
                    {#if file.thumbObjectURL}
                        <div class="thumb {selectedFiles.has(file) ? 'selected-thumbnail' : ''}" on:click={() => onClickThumbnail(idx)}>
                            <img src={file.thumbObjectURL} alt="이미지">
                        </div>
                    {/if}
                {:else}
                        <p class="empty-alert">이미지 없음</p>
                {/each}
            </div>
            {/if}
        </div>

        <div class="col-12">
            <slot name="content" />
        </div>

        {#if editMode}
            <div class="col-12">
                <p class="small text-secondary text-center">총 {displayFiles.length} / {maxFileCount ?? '∞'} 개</p>
            </div>
        {/if}
        
        {#if !noFileList}
        <div class="col-12">
            {#if editMode || displayFiles.length > 0}
            <div class="common-wrap file-list-wrap">
                {#if hideImage}
                    {#each displayFiles as file}
                        {#if !IMAGE_EXTENSIONS.includes(file.ext)}
                            <div class="file-wrap" on:click={() => onClickFile(file)} class:unselected-file={!selectedFiles.has(file)} class:selected-file={selectedFiles.has(file)}>
                                <div class="icon">
                                    <img src={`/images/filestream_${file.file ? 'upload' : 'download'}.png`} alt="업/다운로드">
                                </div>
                                <p class="name">{file.name}</p>
                                <p class="ext">{file.ext}</p>
                            </div>
                        {/if}
                    {/each}
                {:else}
                    {#each displayFiles as file}
                        <div class="file-wrap" on:click={() => onClickFile(file)} class:unselected-file={!selectedFiles.has(file)} class:selected-file={selectedFiles.has(file)}>
                            <div class="icon">
                                <img src={`/images/filestream_${file.file ? 'upload' : 'download'}.png`} alt="업/다운로드">
                            </div>
                            <p class="name">{file.name}</p>
                            <p class="ext">{file.ext}</p>
                        </div>
                    {/each}
                {/if}
                {#if displayFiles.length === 0}
                    <p class="empty-alert">첨부파일 없음</p>
                {/if}
            </div>
            {/if}
        </div>
        {/if}

        {#if editMode}
            <div class="col-12">
                <div class="row g-1 btn-wrap">
                    <div class="col-12 d-flex gap-1">
                        <button class="btn w-100" on:click={toggleSelectMode} class:btn-success={selectMode} class:btn-secondary={!selectMode}>{selectMode ? "선택해제" : "선택모드"}</button>
                        <button class="btn btn-secondary w-100" on:click={() => moveSelectedFiles('up')} disabled={selectedFiles.size <= 0}>▲</button>
                        <button class="btn btn-secondary w-100" on:click={() => moveSelectedFiles('down')} disabled={selectedFiles.size <= 0}>▼</button>
                    </div>
                    <div class="col-12 d-flex gap-1">
                        <button class="btn btn-danger w-100" on:click={() => onClickDelete()} disabled={selectedFiles.size <= 0}>삭제</button>
                        <button class="btn btn-primary w-100" on:click={() => fileInput.click()}>추가</button>
                    </div>
                </div>
            </div>
        {/if}
    </div>

    <ImageViewer bind:this={imageViewer} bind:imageFiles on:showError={e => handleShowError(e.detail)} />

    <Modal bind:this={downloadModal} title="다운로드" footerSlot contentClass="download-modal" alwaysRender >

        <div class="text-center p-1">
            <p class="text-secondary small">파일명</p>
            {#if downloadTargetFile}
                <p class="text-pretty mt-1">{downloadTargetFile.name + downloadTargetFile.ext}</p>
            {/if}
        </div>

       
        <div slot="footer" class="d-flex gap-1 w-100">
            <button class="btn btn-primary btn-height w-100" on:click={() => FileFetcher.downloadFile(downloadTargetFile, {
                onSuccess: () => downloadModal.hide(),
                onError: () => deleteFile(downloadTargetFile) 
            })}>다운로드</button>
            <button class="btn btn-secondary btn-height w-100" on:click={() => downloadModal.hide()}>닫기</button>
        </div>

    </Modal>
</div>

<style lang="scss">

.common-wrap {
    border: 1px solid lightgray;
    border-radius: 0.3rem;
    background-color: rgb(240, 240, 240);
    min-height: 2.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.thumb-wrap {
    flex-direction: row;
    justify-content: start;
    gap: 0.25rem;
    overflow-x: auto;
   
    .thumb {
        width: 6rem;
        min-width: 6rem;
        height: 6rem;
        min-height: 6rem;
        background-color: rgb(32, 32, 32);
        border-radius: 0.25rem;
        border: 0.2rem solid black;
        overflow: hidden;

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    }

    .selected-thumbnail {
        border: 0.2rem solid rgb(123, 61, 223);
    }
}

.file-list-wrap {
    .file-wrap {
        text-align: start;
        width: 100%;
        padding: 0.25rem 0.5rem;
        border-bottom: 0.5px solid lightgray;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .icon {
            width: 1rem;
            height: 1rem;
            min-width: 1rem;
            min-height: 1rem;

            display: flex;
            align-items: center;
            margin-right: 0.3rem;

            img {
                width: 100%;
                height: 100%;
            }
        }

        .name {
            flex-grow: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            text-wrap: nowrap;
            margin-right: 0.3rem;
        }

        .ext {
            background-color: rgb(170, 112, 170);
            border-radius: 0.25rem;
            color: white;
            padding: 0.25rem;
            min-width: 2.7rem;
            max-height: 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }


}

.selected-file {
    background-color: rgb(231, 210, 250);
}

.unselected-file {
    background-color: white;
}

.empty-alert {
    width: 100%;
    text-align: center;
    font-size: small;
    color: gray;
}
</style>
