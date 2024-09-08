// lib/components/FileManager/FileSender.ts

import axios from "axios";
import { cleanObjectURL, type FileStructure } from "./FileStructure";
// import { toUploadFiles } from "./FileFetcher";

enum FileProcessCommand {
    CREATE = "CREATE", 
    DELETE = "DELETE",
    EDIT = "EDIT"
}

interface FileProcessCMD {
    workType: FileProcessCommand;
    id?: number;
    uploadId?: string;
    originId?: number;
    order: number;
}

class FileSender {
    static buildFileProcessCMD(files: FileStructure[]){
        let fileMetas: FileProcessCMD[] = [];

        for (const file of files) {
            let meta = {} as FileProcessCMD;
            //기본은 수정 명령
            meta.workType = FileProcessCommand.EDIT;

            // 업로드할 파일이 있는경우
            if (file.file) meta.workType = FileProcessCommand.CREATE;
            // 삭제 지정된 파일인경우 
            else if (file.isDeleted) meta.workType = FileProcessCommand.DELETE;
            
            meta.uploadId = file.uploadId;
            meta.id = file.id;
            meta.originId = file.originId;
            meta.order = file.order;

            fileMetas.push(meta);
        }

        return fileMetas;
    }

    static async send(url: string, fileSetId: number | null | undefined, files: FileStructure[], data: object = {}): Promise<any> {
        const formData = new FormData();

        // JSON 데이터를 추가
        formData.append('jsonData', JSON.stringify(data));

        // fileSetId 추가
        if (fileSetId) formData.append('fileSetId', fileSetId.toString());

        // 파일 데이터를 추가
        files.forEach((file) => {
            // const uploadId = uuidv4();

            if (file.file) {     // id가 없고 파일이 존재하면
                const identifiedName = `${file.id}|${file.uploadId}|${file.name}${file.ext}`; // 파일 이름에 ID와 순서 등 메타데이터 결합
                const identifiedFile = new File([file.file], identifiedName);

                formData.append('files', identifiedFile);
            }
        });

        //파일 메타데이터 추가
        const fileMetas = FileSender.buildFileProcessCMD(files);
        formData.append('processCmds', JSON.stringify(fileMetas));

        // 서버로 POST 요청 전송
        try {
            const response = await axios.post(url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error uploading files:', error);
            throw error;
        }
    }
}

export default FileSender;
