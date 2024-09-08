import { goto } from '$app/navigation';
import { formatDatetime } from '$lib/script/lib/formatDatetime';
import axios from 'axios';
import { writable } from 'svelte/store';
import { alertStore } from './alertStore';
import { UserRole, userStore, type UserData } from './userStore';

export interface CredentialData {
	email?: string;
	accessToken?: string;
}

function createCredentialStore() {
	const initData: CredentialData = { }

	const { subscribe, update: _update } = writable({
		email: undefined,
		accessToken: undefined
	} as CredentialData);

	return {
		subscribe,
		update: async (newData: CredentialData) => { _update((currentData) => ({ ...currentData, ...newData })) } ,
		clear: () => {_update(() => (initData))}
	};
}

export const credentialStore = createCredentialStore();

export async function signin(args: {isAutoLogin?: boolean, data?: object}){
    try {
		const targetPoint = `/api/session/${args.isAutoLogin ? 'autologin' : 'signin'}`;

        //자동로그인 시도
        const response = await axios.post(targetPoint, args.data!);
        const data = response.data;

		if(handleDeletedAccount(data)) return;

        if (data.email){
            credentialStore.update({ email: data.email })

            userStore.update({
                name: data.name,
                talent: data.talent,
                role: data.role,
				isDeleted: data.isDeleted,
            })
        }

		if (!args.isAutoLogin){
			
			if (data.role !== UserRole.GUEST){
				alertStore.success({
					content: `${data.name} 님 어서오세요!`,
					duration: 2000,
				})
			} 

			if (data.isDeleted === true) { // 삭제후 복원상태라면 사용자정보 수정 페이지로 강제이동
				goto('/mypage/editUser', { replaceState: true })
			} else {
				goto('/home', { replaceState: true })
			}
		}

    } catch (error) {
		if (!args.isAutoLogin) {
			throw error;
		}
    }
}

/**
 * 로그아웃
 */
export async function signout(){
	try {
	  await axios.delete('/api/session/signout');
	  credentialStore.clear();
	  userStore.clear();

	  return true;
  
	} catch (error) {
	  console.error(error)
	}

	return false;
  }

export function handleDeletedAccount(user: UserData & {deleteConfirmAt: Date, deletedAt: Date}){
	if (!user.deletedAt) return false;

	const deleteConfirmAtFormatted = formatDatetime(user.deleteConfirmAt, { includeWeekDay: true, includeSeconds: false, includeTime: false });
	const deletedMessage = `귀하의 개인정보는 ${deleteConfirmAtFormatted} 0시에 완전히 삭제될 예정입니다. 오류로 판단되는 경우 운영팀으로 문의해주세요.`

	if (user.role === UserRole.GUEST){
		alertStore.fail({
			content: `가입이 거절되었습니다. ${deletedMessage}`
		})
	} else {
		alertStore.fail({
			content: `탈퇴한 계정입니다. ${deletedMessage}`
		})
	}

	signout().then(() => {
		goto('/', { replaceState: true })
	})

	return true;
}