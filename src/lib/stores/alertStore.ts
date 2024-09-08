import { writable } from 'svelte/store';

export type AlertType = 'info' | 'warn' | 'fail' | 'error' | 'success'

export interface AlertOptions {
    title?: string;
    content: string;
    duration?: number;
    type?: AlertType;
}

function createAlertStore() {
    const { subscribe, set, update } = writable({
        show: false,
        title: '',
        content: '',
        type: 'info',
        duration: 0,
        progress: 0,
    });

    let intervalId: number | null = null; // setInterval의 ID를 관리하기 위한 변수

    function clearExistingInterval() {
        if (intervalId !== null) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    function setAlert({ title = '', content, type = 'info', duration = 0 }: AlertOptions) {
        clearExistingInterval();

        set({ show: true, title, content, type, duration, progress: 0 });

        if (duration > 0) {
            const startTime = Date.now();
            intervalId = setInterval(() => {
                const elapsedTime = Date.now() - startTime;
                const progress = Math.min(100, (elapsedTime / duration) * 100);
                if (progress >= 100) {
                    clearInterval(intervalId as number);
                    intervalId = null;
                    set({ show: false, title: '', content: '', type: '', duration: 0, progress: 0 });
                } else {
                    update(n => ({ ...n, progress }));
                }
            }, 10) as unknown as number;; // 프로그레스 업데이트 주기를 5ms에서 100ms로 조정하여 성능 개선
        }
    }

    function pauseProgress() {
        clearExistingInterval();
        update(n => ({ ...n, progress: 0 }));
    }

    return {
        subscribe,
        show: setAlert,
        info: (options: AlertOptions) => setAlert({ ...options, type: 'info' }),
        success: (options: AlertOptions) => setAlert({ ...options, type: 'success' }),
        warn: (options: AlertOptions) => setAlert({ ...options, type: 'warn' }),
        fail: (options: AlertOptions) => setAlert({ ...options, type: 'fail' }),
        error: (options: AlertOptions) => setAlert({ ...options, type: 'error' }),
        close: () => {
            clearExistingInterval();
            set({ show: false, title: '', content: '', type: 'info', duration: 0, progress: 100 });
        },
        updateTitle: (title: string) => update(n => ({ ...n, title })),
        updateContent: (content: string) => update(n => ({ ...n, content })),
        updateAlertType: (type: AlertOptions['type']) => { 
            if (type) update(n => ({ ...n, type }))
        },
        pauseProgress
    };
}

export const alertStore = createAlertStore();
