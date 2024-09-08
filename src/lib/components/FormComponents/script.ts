export function assignInitialValue<T extends HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    element: T,
    id: string,
    initialValue: object | string | number
) {
    if (typeof initialValue === 'object') {
        const value = getValueById(initialValue, id);
        if (value !== undefined) {
            if (typeof value === 'string' && isValidUTCDate(value)) {
                element.value = formatDateToLocalString(value);
            } else {
                element.value = value as never;
            }
        }
    } else {
        element.value = initialValue.toString();
    }
}

function isValidUTCDate(dateString: string): boolean {
    // UTC 날짜 형식을 검증하는 정규식
    const utcDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    return utcDateRegex.test(dateString);
}

function formatDateToLocalString(utcDateString: string): string {
    const date = new Date(utcDateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = daysOfWeek[date.getDay()];

    return `${year}-${month}-${day} (${dayOfWeek}) ${hours}:${minutes}`;
}

export function getValueById(obj: object, id: string) {
    const keys = id.split('.');
    let value = obj;
    for (const key of keys) {
        if (value[key as keyof object] !== undefined) {
            value = value[key as keyof object];
        } else {
            return undefined;
        }
    }
    return value;
}
