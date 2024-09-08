import { writable } from 'svelte/store';

interface HeaderStoreOption {
	backButton?: boolean;
	useMenu?: boolean;
	usePageStack?: boolean;
}

function creatingHeaderStore() {
	const { subscribe, update: _update } = writable({
		backButton: true,
		useMenu: true,
		usePageStack: true,
	} as HeaderStoreOption);

	return {
		subscribe,
		update: (newData: HeaderStoreOption) => { _update((currentData) => ({ ...currentData, ...newData })) } ,
	};
}

export const headerStore = creatingHeaderStore();
