import { goto } from '$app/navigation';
import { alertStore, type AlertOptions, type AlertType } from '$lib/stores/alertStore';
import { credentialStore, type CredentialData } from '$lib/stores/credentialStore';
import { loadingStore } from '$lib/stores/loadingStore';
import { userStore } from '$lib/stores/userStore';
import axios, {
	AxiosError,
	AxiosHeaders,
	type AxiosResponse,
	type InternalAxiosRequestConfig
} from 'axios';
import type { Unsubscriber } from 'svelte/motion';
import { parseBlobToObject } from '../lib/parser';

interface ResponseError {
	errType?: string;
	errUUID?: string;
	timestamp?: string;
	status?: number;
	message?: string;
	alertOptions?: ReceivedAlertOptions;
}

interface ReceivedAlertOptions {
	type: AlertType;
	title?: string;
	duration: number;
}

let credentialUnsub: Unsubscriber;

export function configureAxiosRequest() {
	if (credentialUnsub) credentialUnsub();

	let credential: CredentialData;

	credentialUnsub = credentialStore.subscribe(($credentialStore) => {
		credential = $credentialStore;
	});

	axios.interceptors.request.use(
		(request: InternalAxiosRequestConfig) => {
			loadingStore.show();

			request.headers['access-token'] = credential.accessToken;

			return request;
		},
		(error: AxiosError) => {
			try {
				
				throw error;	
			} finally {
				loadingStore.hide();	
			}
		}
	);
}

export function configureAxiosResponse() {
	axios.interceptors.response.use(
		(response: AxiosResponse) => { //응답 시
			try {
				//액세스 토큰 받으면 저장하기
				const accessToken = response.headers['access-token'];
				if (accessToken) credentialStore.update({ accessToken });
			
				return response;	
			} finally {
				loadingStore.hide();	
			}
			
		},
		(error: AxiosError) => { //오류 시
			try {
				const headers = error.response?.headers as AxiosHeaders;
				let errorData: ResponseError = error.response?.data as ResponseError;

				//오류코드 따라 검사
				if (handleAxiosErrorCode(errorData)) return;

				//헤더 검사
				if (headers) handleAxiosResponseHeader(headers, errorData, error);

				// 오류데이터 검사
				if (errorData && errorData.message && errorData.errType) {
					handleAxiosResponseError(errorData);
				}

				throw error;
			} finally {
				loadingStore.hide();
			}
		}
	);
}

export function handleAxiosErrorCode(errorData: ResponseError) {
	if ((errorData as any)?.code === 413) {
		alertStore.fail({
			title: '첨부파일 전송가능 크기 초과',
			content: '새로 추가될 파일의 총 합이 30Mb를 넘습니다. 여러번 나눠서 첨부해주세요.',
		});

		return true;
	}

	return false;
}

export function handleAxiosResponseHeader(headers: AxiosHeaders, errorData: ResponseError, error: AxiosError) {
	// 오류처리 스킵
	if (headers.has('x-skip-catch')) {
		throw error;
	}

	// 로그인요청 검사
	if (headers.has('x-need-login')) {
		const message = errorData.message;
		userStore.clear();
		credentialStore.clear();

		alertStore.warn({
			content: message || '로그인이 필요한 서비스입니다.',
			duration: message ? 4000 : 2000
		});

		goto('/login', { replaceState: true });
		throw error;
	}

	//권한 부족 검사
	if (headers.has('x-not-enough-role')) {
		const message = errorData.message;

		alertStore.fail({
			content: message || '서비스 이용권한이 부족합니다.',
			duration: 3000
		});

		goto('/home');
		throw error;
	}
}

export function handleAxiosResponseError(errorData: ResponseError) {
	if (errorData.errType === 'ControlledError' && errorData.alertOptions) { // 오류가 ControlledError 인 경우
		const alert: ReceivedAlertOptions = errorData.alertOptions;

		if (alert) { //alertStore 메소드 이름으로 호출
			(alertStore as Record<string, CallableFunction>)[alert.type]({
				title: alert.title,
				content: errorData.message,
				duration: alert.duration
			} as AlertOptions);
		}

	} else if (errorData.errType === 'ValidationError') {	// 오류가 ValidationError인경우
		alertStore.error({
			title: '입력값 오류',
			content: `${errorData.message}`,
		});
	} else if (errorData.errType === 'Error') {	// 알 수 없는 오류인경우
		alertStore.error({
			title: '알 수 없는 오류',
			content: `오류 정보와 상황 설명을 운영팀으로 보내주세요. (오류ID: ${errorData.errUUID}, 시간: ${errorData.timestamp})`,
		});
	}
}
