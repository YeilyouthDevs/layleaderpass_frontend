import axios from 'axios';
import { get, writable } from 'svelte/store';
import { credentialStore } from './credentialStore';
import { loadingStore } from './loadingStore';

export interface UserData {
	name?: string;
	role?: UserRole;
	talent?: number;
	isDeleted?: boolean;
}

export enum UserRole {
	GUEST = 'GUEST',
	USER = 'USER',
	ADMIN = 'ADMIN'
}

function createUserStore() {
	const initData: UserData = {}

	const { subscribe, update: _update } = writable({
		name: undefined,
		role: undefined,
		talent: undefined,
		isDeleted: undefined,
	} as UserData);

	return {
		subscribe,
		update: async (newData: UserData) => { _update((currentData) => ({ ...currentData, ...newData })) } ,
		clear: () => {_update(() => (initData))}
	};
}

export const userStore = createUserStore();

export async function refreshSelfInfo(){
	try {
		const email = get(credentialStore).email;
		if (!email) return;

		loadingStore.showRightNow();

		const response = await axios.get('/api/user/selfInfo?email=' + email);
		const data = response.data;

		userStore.update({
			name: data.name,
			talent: data.talent,
			role: data.role,
		})

		return data;

	} catch (error) {
		console.error(error);
	} 
}