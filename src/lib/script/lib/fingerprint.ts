/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck

/*
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import sha224 from "crypto-js/sha224";
import { v4 } from 'uuid';

export async function createFingerprint() {
    const fingerprintJs = await FingerprintJS.load();
    const rawData = await fingerprintJs.get();

    let components = rawData.components;

    delete components.invertedColors;
    delete components.screenResolution;
    delete components.screenFrame;

    components = __removeDuration(components);

    const serializedObject = JSON.stringify(components);
    const hashed = sha224(serializedObject).toString();

    console.log("장치 지문:", hashed);
    return hashed;
}

export function createUUID() {
    const uuid = v4();
    console.log("UUID:", uuid)
    return uuid;
}

function __removeDuration(obj: any) {
    for (const key in obj) {
        if (typeof obj[key] === "object" && obj[key] !== null) {
            // 값이 객체인 경우, 재귀적으로 함수 호출
            __removeDuration(obj[key]);
        } else if (key === "duration") {
            // 'duration' 필드를 찾으면 삭제
            delete obj[key];
        }
    }

    return obj;
}
*/