import { Validation, type ValidationElement, type ValidationSchema } from "$lib/script/lib/validation";
import { answerShcema, birthdaySchema, nameSchema, passwordSchemaEdit, phoneSchema, questionSchema } from "llp-validator";

export const getPasswordEditValidation = (nullable = false) => {
    return {
        displayOnEmpty: true,
        handler: (el: ValidationElement) => {
            const value = el.value.trim();
            if ((nullable && !value)) return undefined;

            const { error } = passwordSchemaEdit.validate(value);
            return error?.message;
        }
    }
}

export const getPasswordCheckValidation = (formArea: any, nullable = false) => {
    return {
        handler: () => {
            const values = Validation.getValues(formArea);
            if ((nullable || values) && values?.password !== values?.passwordCheck) return '비밀번호가 서로 다릅니다.'
        }
    }
}

export const nameEditValidation: ValidationSchema = {
    displayOnEmpty: true,
    handler: (el) => {
        const { error } = nameSchema.validate(el.value.trim());
        return error?.message;
    }
}

export const birthdayValidation: ValidationSchema = {
    displayOnEmpty: true,
    handler: (el) => {
        const { error } = birthdaySchema.validate(el.value.trim());
        return error?.message;
    }
}

export const phoneValidation: ValidationSchema = {
    displayOnEmpty: true,
    handler: (el) => {
        const { error } = phoneSchema.validate(el.value.trim());
        return error?.message;
    }
}

export const questionValidation: ValidationSchema = {
    displayOnEmpty: true,
    handler: (el) => {
        const { error } = questionSchema.validate(el.selectedOptions?.[0]);
        return error?.message;
    }
}

export const getAnswerValidation = (nullable = false) => {
    return {
        displayOnEmpty: true,
        handler: (el: ValidationElement) => {
            const value = el.value.trim();
            if ((nullable && !value)) return undefined;

            const { error } = answerShcema.validate(value);
            return error?.message;
        }
    }
}