/* eslint-disable @typescript-eslint/no-explicit-any */

import { alertStore } from '$lib/stores/alertStore';

interface ValidationOptions {
	scopeNames?: string[]; // 검증 범위 이름, 특정 범위의 입력만 검사
	findOrder?: string[]; // 값을 찾을 때 우선순위를 지정하는 배열
	allowEmpty?: boolean; // 비어있는 값을 허용할지 여부
}


interface SetValidOptions {
	validType: 'valid' | 'invalid';
	message?: string;
}

// Validation 클래스는 입력값 검증 및 수집 기능을 제공합니다.
export class Validation {

	private static typeConversion = {
		number: (value: string) => !isNaN(Number(value)) ? Number(value) : 0,
		boolean: (value: string) => value.toLowerCase() === 'true',
		dateString: (value: Date) => Validation.dateString(value), // 날짜만 반환
		datetimeString: (value: Date) => Validation.datetimeString(value) // 날짜와 시간 반환
	};
	

	// 주어진 요소 내의 모든 입력 필드를 검증하고, 유효하다면 그 값을 수집합니다.
	static checkAndGetValues(
		element: Element,
		options: ValidationOptions = {}
	): Record<string, any> | null {
		const isValid = Validation.check(element, options);

		if (isValid) return Validation.getValues(element, options);
		else return null;
	}

	// 주어진 요소 내의 모든 입력 필드를 검증합니다.
	static check(element: Element, options: ValidationOptions = {}): boolean {
		const { scopeNames = [''] } = options;

		const allContainers = element.querySelectorAll(`[data-validation-container]`);

		const containers = Array.from(allContainers).filter((container) =>
			scopeNames.includes(container.getAttribute('data-validation-container') || '')
		);

		for (const container of containers) {
			const isValid = Validation.validateAndDisplayError(container);
			if (!isValid) return false;
		}

		return true;
	}

	// 주어진 요소 내의 모든 입력 필드에서 값을 수집합니다.
	static getValues(
		element: Element,
		options: ValidationOptions = {}
	): { [key: string]: any } | null {
		const { scopeNames = [''], findOrder = ['value'], allowEmpty = false } = options;
		const extracted: { [key: string]: any } = {};
	
		scopeNames.forEach((scopeName) => {
			const containers = element.querySelectorAll(`[data-collectable="${scopeName}"]`);
			containers.forEach((container) => {
				const dataType = container.getAttribute('data-as-type') as keyof typeof Validation.typeConversion;
				const inputElement = container.querySelector('input, select, textarea') as HTMLInputElement | null;
				if (!inputElement) return;
	
				let valueToSet: any = '';
	
				if (inputElement.type === 'checkbox') {
					valueToSet = inputElement.checked;
				} else {
					for (const fieldName of findOrder) {
						const extractedFieldValue: any = inputElement[fieldName as keyof HTMLInputElement];
						if (extractedFieldValue !== undefined && extractedFieldValue !== null) {
							valueToSet = typeof extractedFieldValue === 'string' ? extractedFieldValue.trim() : extractedFieldValue;
							break; // 첫 번째 유효한 값으로 설정 후 중단
						}
					}
				}
	
				if (dataType && Validation.typeConversion[dataType]) {
					valueToSet = Validation.typeConversion[dataType](valueToSet);
				}
	
				if (allowEmpty || (valueToSet !== undefined && valueToSet !== null && valueToSet !== '')) {
					if (!valueToSet) valueToSet = null;

					setObjectValue(extracted, inputElement.id || inputElement.name, valueToSet);
				}
			});
		});
	
		return extracted;
	}
	

	private static validateAndDisplayError(container: Element) {
		const inputElement = container.querySelector('input, select, textarea') as HTMLInputElement; // input과 select 모두 선택

		if (inputElement) {
			let isValid = false;
			for (const className of inputElement.classList.values()) {
				if (className === 'is-invalid') {
					isValid = false;
					break;
				} else if (className === 'is-valid' || className === 'hidden-is-valid') {
					return true;
				}
			}

			if (!isValid) {
				const invalidFeedback = container.querySelector('.invalid-feedback');

				if (invalidFeedback && invalidFeedback.textContent) {
					alertStore.warn({
						content: `${inputElement.name}: ${invalidFeedback.textContent}`,
						duration: 2000
					});
				} else {
					alertStore.warn({
						content: `${inputElement.name} 을(를) 입력해주세요.`,
						duration: 2000
					});
				}
			}
		}

		return false;
	}

	private static dateString(value: Date): string {
		const year = value.getFullYear();
		const month = (value.getMonth() + 1).toString().padStart(2, '0');
		const day = value.getDate().toString().padStart(2, '0');
	
		return `${year}-${month}-${day}`;
	}

	private static datetimeString(value: Date): string {
		const year = value.getFullYear();
		const month = (value.getMonth() + 1).toString().padStart(2, '0');
		const day = value.getDate().toString().padStart(2, '0');
		const hours = value.getHours().toString().padStart(2, '0');
		const minutes = value.getMinutes().toString().padStart(2, '0');
		const seconds = value.getSeconds().toString().padStart(2, '0');
	
		return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
	}
	
}

// 입력 이름을 점으로 구분된 경로로 파싱하고, 객체에 값을 설정하는 함수
function setObjectValue(obj: any, path: string, value: any) {
	const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) current[part] = {};
        current = current[part];
    }
    current[parts[parts.length - 1]] = value;
}


export interface ValidationElement extends HTMLElement {
	value: string;
	selectedOptions?: HTMLCollectionOf<HTMLOptionElement>;
	selectedIndex?: number;
	dateValues?: Date[];
}

export interface ValidationSchema {
	fieldName?: string;
	handler: (element: ValidationElement) => string | undefined | void | Promise<string | undefined | void>;
	displayOnEmpty?: boolean;
	hideOnValid?: boolean;
}

export async function validate<T>(element: T, schema: ValidationSchema) {
	const { fieldName = 'value', handler, displayOnEmpty = false, hideOnValid = false } = schema;

	const toCheckField = element[fieldName as keyof object] as string | object;
	const htmlElement = element as HTMLElement;

	if (!displayOnEmpty) {
		if (
			!toCheckField ||
			(typeof toCheckField === 'string' && !toCheckField.trim()) ||
			(Array.isArray(toCheckField) && toCheckField.length == 0)
		) {
			clearValid(htmlElement);
		}
	}

	const result = await handler(htmlElement as ValidationElement);

	if (result) {
		setValid(htmlElement, { validType: 'invalid', message: result });
	} else if (hideOnValid) {
		clearValid(htmlElement);
		htmlElement.classList.add('hidden-is-valid');
	} else {
		setValid(htmlElement, { validType: 'valid' });
	}
}


export function clearValid(element: HTMLElement): void {
	element.classList.remove('is-valid', 'is-invalid', 'hidden-is-valid');
	const parentElem = element.parentElement;

	if (parentElem) {
		const validFeedback = parentElem.querySelector('.valid-feedback');
		if (validFeedback) parentElem.removeChild(validFeedback);

		const invalidFeedback = parentElem.querySelector('.invalid-feedback');
		if (invalidFeedback) parentElem.removeChild(invalidFeedback);
	}
}


export function setValid(element: HTMLElement, options: SetValidOptions): void {
	clearValid(element);
	element.classList.add(`is-${options.validType}`);

	const parentElem = element.parentElement;
	if (!parentElem) return;

	// validFeedback true일 경우, 또는 validType이 'invalid'인 경우에 시각적 피드백을 추가
	const validFeedbackDiv = parentElem.querySelector(`.${options.validType}-feedback`);
	const innerHTML = `<p>${options.message || ''}</p>`;

	if (validFeedbackDiv) {
		validFeedbackDiv.innerHTML = innerHTML;
	} else {
		parentElem.insertAdjacentHTML(
			'beforeend',
			`<div class="${options.validType}-feedback">${innerHTML}</div>`
		);
	}
}
