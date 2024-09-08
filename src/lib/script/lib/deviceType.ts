export enum DeviceType {
    ANDROID, APPLE, OTHER
}

export function getDeviceType(){
        // User-Agent 헤더 가져오기
        const userAgent =  navigator.userAgent;

        // iOS와 Android 감지
        const isIOS = /iPhone|iPad|iPod|Mac/i.test(userAgent);
        if (isIOS) return DeviceType.APPLE

        const isAndroid = /Android/i.test(userAgent);
        if (isAndroid) return DeviceType.ANDROID;

        return DeviceType.OTHER
}