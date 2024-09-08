import type { ValidationSchema } from "./validation";

export const notEmptyValidation: ValidationSchema = {
    displayOnEmpty: true,
    handler: (el) => {
        if (!el.value.trim()) return '필수 값입니다.'
    }
}

export const talentValidation: ValidationSchema = {
    displayOnEmpty: true,
    handler: (el) => {
        const value = el.value.trim();
        if (!value) return '필수 값입니다.';
        
        const regex = /^[1-9]\d*$/; // 양의 정수를 나타내는 정규식

        if (!regex.test(value)) {
            return '숫자만 입력 가능합니다.';
        }
    }
}
