//FileFetcher.ts

import { alertStore } from "$lib/stores/alertStore";
import { credentialStore } from "$lib/stores/credentialStore";
import { loadingStore } from "$lib/stores/loadingStore";
import axios from "axios";
import JSZip from 'jszip';
import { get } from "svelte/store";
import { FileStructureType, IMAGE_EXTENSIONS, type FileStructure } from "./FileStructure";
import { DeviceType, getDeviceType } from "$lib/script/lib/deviceType";
import { parseBlobToObject } from "$lib/script/lib/parser";
import { handleAxiosResponseError } from "$lib/script/configs/axiosConfig";

export interface FetchedFile {
    id: number;
    order: number;
    originalName: string;
    extension: string;
    originId?: number;
}

export interface FetchedFileSet {
    files: FetchedFile[];
    createdAt: string;
    downloadMode: string;
    updatedAt: string;
    updatedBy: string;
}

class FileFetcher {

    constructor() {

    }

    static async fetchThumbnails(fileSetId: number, files: FileStructure[]) {

        loadingStore.show();

        try {
            const response = await axios.get('/api/file/fetchThumbnails?fileSetId=' + fileSetId, {
                responseType: 'blob'
            })
    
            if (response) {
                const thumbnails = await FileFetcher.decodeThumbnails(response.data);
    
                if (thumbnails) {
                    for (const file of files) {
                        if (file.originId && thumbnails.has(file.id!)) {
                                const { order, fileData } = thumbnails.get(file.id!)!;
                                file.order = order;
                                file.thumbObjectURL = URL.createObjectURL(fileData);
                        }
                    }
                }
            }
        } finally {
            loadingStore.hide()
        }

    }

    static async fetchFileSet(fileSetId: number, files: FileStructure[]): Promise<number> {

        loadingStore.show();

        let maxOrder = 0;

        try {
            const fetchedFileSet = (await axios.get('/api/file/fetchFileSet?fileSetId=' + fileSetId))?.data;

            if (fetchedFileSet) {

                const fetchedFiles: FetchedFile[] = fetchedFileSet.files;

                for (const fetchedFile of fetchedFiles) {
                    const fileStructure = {
                        id: fetchedFile.id,
                        name: fetchedFile.originalName,
                        ext: fetchedFile.extension,
                        originId: fetchedFile.originId,
                        order: fetchedFile.order
                    }

                    if (fetchedFile.order > maxOrder) maxOrder = fetchedFile.order;

                    if (IMAGE_EXTENSIONS.includes(fetchedFile.extension.toLowerCase())) {   
                        (fileStructure as FileStructure).type = FileStructureType.IMAGE
                    } else {
                        (fileStructure as FileStructure).type = FileStructureType.FILE
                    }

                    files.push(fileStructure as FileStructure)
                }

            }
        }
        finally {
            loadingStore.hide()
        }

        return maxOrder;
    }

    static async decodeThumbnails(archiveBlob: Blob): Promise<Map<number, { order: number, fileData: Blob }>> {
        const blob = archiveBlob;
        const zip = await JSZip.loadAsync(blob);

        const thumbnailMap = new Map();

        try {
            const imagePromises = Object.keys(zip.files).map(async (key) => {
                const fileData = await zip.files[key].async('blob'); // 파일 데이터를 blob으로 추출

                const [id, order] = key.split('_');

                thumbnailMap.set(+id, {
                    order: +order,
                    fileData
                })
            });

            await Promise.all(imagePromises);

        } catch (error) {
            console.error(error);
        }

        return thumbnailMap
    }

    static async downloadFile(file: FileStructure, callback?: { onSuccess?: CallableFunction, onError?: CallableFunction }): Promise<void> {
        const targetFileId = file.originId || file.id;
    
        if (file.file) {
            alertStore.warn({
                title: '다운로드 불가',
                content: '아직 업로드된 파일이 아닙니다.',
                duration: 1000,
            });
            return;
        }
    
        try {
            const filename = `${file.name}${file.ext}`;
    
            alertStore.info({
                title: '다운로드 시작',
                content: `${filename}`,
                duration: 2000
            });
    
            const accessToken = get(credentialStore).accessToken; // 스토어 값 일회성으로 읽기
    
            const response = await axios.get(`/api/file/download?fileId=${targetFileId}`, {
                responseType: 'blob', // 다운로드할 파일의 타입이 blob일 경우
                headers: {
                    'access-token': accessToken!
                }
            });
    
            //가상의 다운로드링크 클릭 시뮬레이션
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename); // 파일명 설정
            document.body.appendChild(link);
            link.click();
    
            document.body.removeChild(link); // 링크 제거
    
            // 디바이스 종류에따른 안내메세지 변경
            const deviceType = getDeviceType();
            let message = '다운로드한 폴더에서 확인해주세요.';
            if (deviceType === DeviceType.APPLE) {
                message = '팝업창의 다운로드 버튼을 누르신 후 ‘파일’ 앱 → 다운로드 폴더에서 확인해주세요.'
            } else if (deviceType === DeviceType.ANDROID) {
                message = '팝업창의 ‘열기’ 버튼을 바로 누르시거나 ‘내 파일’ 앱 → 다운로드 폴더에서 확인해주세요.'
            }
    
            alertStore.success({
                title: '다운로드 완료',
                content: message,
                duration: 8000
            });
    
            if (callback?.onSuccess) await callback.onSuccess();
    
        } catch (error) {
            const errorData = (error as any).response?.data;
            if (errorData instanceof Blob) {
                const parsed = await parseBlobToObject(errorData);
                handleAxiosResponseError(parsed);
            }
    
            if (callback?.onError) await callback.onError();
        }
    }
}

export default FileFetcher;