<!-- ImageViewer.svelte -->

<script lang="ts">
    import { loadingStore } from "$lib/stores/loadingStore";
    import axios, { AxiosError } from "axios";
    import JSZip from "jszip";
    import { createEventDispatcher, onDestroy, onMount, tick } from "svelte";
    import Modal from "../Modal.svelte";
    import FileFetcher from "./FileFetcher";
    import { type FileStructure } from "./FileStructure";
	import { parseBlobToObject } from "$lib/script/lib/parser";
	import { handleAxiosResponseError } from "$lib/script/configs/axiosConfig";

    const dispatch = createEventDispatcher();

    let modalBind: Modal;
    let targetFile: FileStructure | undefined = undefined;
    let targetIdx: number = 0;

    export let imageFiles: FileStructure[];

    export async function show(idx: number){
        targetIdx = idx;
        targetFile = imageFiles[idx];

        try {
            if(targetFile?.originId && !targetFile.originObjectURL) {
                const thumbURLBackup = targetFile.thumbObjectURL;
                targetFile.thumbObjectURL = undefined;
                const fetchedImage = await fetchImage(targetFile.originId);
                targetFile.thumbObjectURL = thumbURLBackup
                targetFile.originObjectURL = URL.createObjectURL(fetchedImage!);
            }

            await tick();

            modalBind.show();    
        } catch (error) {
            if (error instanceof AxiosError) {

                const errorData = error.response?.data;

                if (errorData instanceof Blob) {
                    const parsed = await parseBlobToObject(errorData);
                    handleAxiosResponseError(parsed);

                    modalBind.hide();

                    dispatch('showError', {
                        file: targetFile, error: parsed
                    });

                    return;
                }
            }
            
            throw error;
        }
        
    }

    async function fetchImage(fileId: number) {
        try {
            loadingStore.showRightNow();

            const response = await axios.get('/api/file/fetchImage?fileId=' + fileId, {
                responseType: 'blob'
            });

            const zip = await JSZip.loadAsync(response.data);
            return await zip.files[fileId.toString()].async('blob')
        } finally {
            loadingStore.hide();
        }
        
    }

    let startX: number, startY: number, isDragging = false;
    let initialTransformOrigin: string;

    let zoomLevel: number = 5;
    const MAX_ZOOM_LEVEL = 10;

    function startDrag(event: any) {
        startX = event.clientX || event.touches[0].clientX;
        startY = event.clientY || event.touches[0].clientY;
        isDragging = true;

        const originX = startX - event.target.getBoundingClientRect().left;
        const originY = startY - event.target.getBoundingClientRect().top;
        initialTransformOrigin = `${originX}px ${originY}px`;
        event.target.style.transformOrigin = initialTransformOrigin;
    }

    function onDrag(event: any) {
        if (!isDragging) return;

        const x = event.clientX || event.touches[0].clientX;
        const y = event.clientY || event.touches[0].clientY;
        const dx = x - startX;
        const dy = y - startY;
        const scale = 1 + Math.sqrt(dx * dx + dy * dy) / (110 - (10 * zoomLevel));

        event.target.style.transform = `scale(${scale})`;
    }

    function stopDrag(event: any) {
        if (!isDragging) return;
        isDragging = false;
        event.target.style.transform = 'scale(1)';
        event.target.style.transformOrigin = initialTransformOrigin;
    }

    function increaseZoomLevel(){
        zoomLevel = Math.min(MAX_ZOOM_LEVEL, zoomLevel + 1)
    }

    function decreaseZoomLevel(){
        zoomLevel = Math.max(1, zoomLevel - 1)
    }

    function showPrevPage() {
        const prevIdx = Math.max(0, targetIdx - 1)
        show(prevIdx)
    }

    function showNextPage() {
        const nextIdx = Math.min(targetIdx + 1, imageFiles.length - 1)
        show(nextIdx)
    }

    function downloadImage() {
        if (!targetFile) return;
        FileFetcher.downloadFile(targetFile)
    }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<Modal bind:this={modalBind} fullscreen noHeader noFooter bodyClass="p-0 bg-black" contentClass="bg-black">
    <div class="img-container">
        {#if targetFile}
        <img src={targetFile?.originObjectURL || targetFile?.thumbObjectURL || '/images/black.png'} alt="이미지"
            on:mousedown={startDrag}
            on:mousemove={onDrag}
            on:mouseup={stopDrag}
            on:mouseleave={stopDrag}
            on:touchstart={startDrag}
            on:touchmove={onDrag}
            on:touchend={stopDrag}
        >
        {/if}
    </div>

    <div class="container g-0">

        <div class="button-row">
            <div class="indicator">
                <p class="name">페이지</p>
                <p class="value">{targetIdx + 1}/{imageFiles.length}</p>
            </div>
            
            <div class="row-btn" on:click={showPrevPage}>
                ◀
            </div>
            <div class="row-btn" on:click={showNextPage}>
                ▶
            </div>
            <div class="row-btn fs-4" on:click={() => modalBind.hide()}>
                닫기
            </div>
        </div>

        <div class="button-row">
            <div class="indicator">
                <p class="name">확대속도</p>
                <p class="value">{zoomLevel}/{MAX_ZOOM_LEVEL}</p>
            </div>
            <div class="row-btn" on:click={increaseZoomLevel}>
                ＋
            </div>
            <div class="row-btn" on:click={decreaseZoomLevel}>
                －
            </div>
            <div class="row-btn" on:click={downloadImage}>
                <img id="download-img" src="/images/filestream_download_white.png" alt="다운로드"
                    class:download-disabled={targetFile?.file}
                >
            </div>
            
        </div>

    </div>

</Modal>

<style lang="scss">
    $row-height: 3rem;
    $indicator-width: 4rem;
    $border-color: rgb(134, 134, 134);

    .img-container {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: calc(100% - 2 * $row-height);
        overflow: hidden;
    }

    img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        transition: transform 0.2s ease-out;
    }



    .button-row {
        height: $row-height;
        display: flex;

        .row-btn {
            width: 100%;
            color: white;
            font-size: 1.5rem;
            display: flex;
            justify-content: center;
            align-items: center;
            border: 0.2px solid $border-color;
        }
    }

    #download-img {
        width: 1.8rem;
        height: 1.8rem;
    }

    .download-disabled {
        opacity: 0.3;
    }

    .indicator {
        width: 100%;
        height: 100%;
        border: 0.2px solid $border-color;
        color: white;
        font-size: small;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
</style>
