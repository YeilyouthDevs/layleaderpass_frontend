import { debounce } from 'lodash-es';
import { writable } from 'svelte/store';

//TODO 로딩중 화면 3회이상 0.5초 이내로  터치되면 로딩화면 취소 버튼 띄우기

function createLoadingStore() {
	const { subscribe, update } = writable({
		state: false
	});

	function updateShowState(state: boolean) {
		update((currentValue) => ({ ...currentValue, state }));
	}

	const updateStateDebounce = debounce((newState) => {
		updateShowState(newState);
	}, 400);

	return {
		subscribe,
		show: () => {
			updateStateDebounce(true);
		},
		showRightNow: () => {
			updateShowState(true);
		},
		hide: () => {
			updateStateDebounce(false);
		}
	};
}

export const loadingStore = createLoadingStore();
