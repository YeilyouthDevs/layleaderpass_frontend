export async function parseBlobToObject(blob: Blob): Promise<any> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            try {
                const result = JSON.parse(reader.result as string);
                resolve(result);
            } catch (error) {
                reject(new Error('Blob -> Object 변환 실패'));
            }
        };

        reader.onerror = () => {
            reject(new Error('Blob 데이터를 읽을 수 없음'));
        };

        reader.readAsText(blob);
    });
}
