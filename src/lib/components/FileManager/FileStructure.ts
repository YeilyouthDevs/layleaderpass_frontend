//FileStructure.ts

import { v4 as uuidv4 } from 'uuid';

export const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png"];
export const NOT_ALLOW_EXTENSIONS = ["", ".exe", ".msi", ".bat", ".sh"];
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5Mb
export const MAX_FILE_NAME_LENGTH = 200

export enum FileStructureType {
    FILE, IMAGE
}

export interface FileStructure {
    id?: number;
    originId?: number;
    file?: File;
    name: string;
    ext: string;
    type: FileStructureType;
    order: number;
    thumbObjectURL?: string;
    originObjectURL?: string;
    uploadId?: string; // 추가
    isDeleted: boolean;
}

// 파일을 생성할 때 uploadId를 추가하는 함수
export function createFileStructure(file: File, nextIdx: number): FileStructure {
    const dotIdx = file.name.lastIndexOf('.');
    const name = file.name.substring(0, dotIdx);
    const ext = file.name.substring(dotIdx);
    const type = (IMAGE_EXTENSIONS.includes(ext.toLowerCase())) ? FileStructureType.IMAGE : FileStructureType.FILE;
    const thumbObjectURL = type === FileStructureType.IMAGE ? URL.createObjectURL(file) : undefined;

    return {
        file,
        name,
        ext,
        type,
        thumbObjectURL,
        order: nextIdx,
        uploadId: uuidv4(), // uploadId를 UUID로 생성
        isDeleted: false
    };
}

export function cleanObjectURL(files: FileStructure[]) {
    files.forEach(file => {
        if (file.thumbObjectURL) URL.revokeObjectURL(file.thumbObjectURL);
        if (file.originObjectURL) URL.revokeObjectURL(file.originObjectURL);
    });
}
