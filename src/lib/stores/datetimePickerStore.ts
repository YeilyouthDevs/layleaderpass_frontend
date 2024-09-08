import { swipe } from '$lib/actions/swipe';
import { writable } from 'svelte/store';

interface DatetimePickerStore {
    swipeDestory: (() => void) | null,
    contentArea: HTMLElement | null,
    handleRightSwipe: (() => void) | null,
    handleLeftSwipe: (() => void) | null,
}

const createDatetimePickerStore = () => {
	const initData: DatetimePickerStore = {
		swipeDestory: null,
		contentArea: null,
		handleRightSwipe: null,
		handleLeftSwipe: null,
	}

	const { subscribe, update: _update } = writable({ ...initData });

	return {
		subscribe,
		update: (newData: DatetimePickerStore) => _update((currentData) => ({ ...currentData, ...newData })),
		init: async () => {
			_update(() => ({ ...initData }))
		},
		addListeners: (document: Document, handleLeftSwipe: () => void, handleRightSwipe: () => void) => {
			_update((currentData) => {
				const contentArea = (document.querySelector('.air-datepicker--content') as HTMLElement)
				currentData.swipeDestory = swipe(contentArea).destroy;

				contentArea.addEventListener('rightswipe', handleRightSwipe);
				contentArea.addEventListener('leftswipe', handleLeftSwipe);

				currentData.handleLeftSwipe = handleLeftSwipe;
				currentData.handleRightSwipe = handleRightSwipe;
				currentData.contentArea = contentArea;

				console.log('DateTimePicker Listener 추가됨', currentData);

				return currentData;
			})
		},
		removeListeners: () => {
			_update((currentData) => {
				if(currentData.swipeDestory) currentData.swipeDestory();

				if(currentData.contentArea) {
					const contentArea = currentData.contentArea;

					contentArea.removeEventListener('rightswipe', currentData.handleRightSwipe as EventListener);
					contentArea.removeEventListener('leftswipe', currentData.handleLeftSwipe as EventListener);
				}

				console.log('DateTimePicker Listener 제거됨', currentData);

				return initData;
			})
		}
	};
};

export const dateTimePickerStore = createDatetimePickerStore();


