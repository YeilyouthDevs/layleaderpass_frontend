/* eslint-disable @typescript-eslint/no-explicit-any */

// src/stores/countdownStore.ts
import type { Writable } from 'svelte/store';
import { writable } from 'svelte/store';

interface CountdownStore {
  [id: string]: number;
}

interface Timers {
  [id: string]: number; // Node.Timeout 대신 number 사용
}

function createCountDownStore(): {
  subscribe: Writable<CountdownStore>['subscribe'],
  start: (id: string, endDate: Date) => void,
  stop: (id: string) => void,
  pause: (id: string) => void,
  run: (id: string, endDate: Date) => void
} {
  const store: Writable<CountdownStore> = writable({});
  const timers: Timers = {};
  const syncInterval: number = 60; // 동기화 간격 (초)

  function start(id: string, endDate: Date): void {
    stop(id); // 기존에 실행 중인 타이머가 있다면 중단

    // 남은 시간을 계산하고 스토어를 즉시 업데이트하는 함수
    const updateRemainingTime = () => {
        const now = new Date();
        let remainingSeconds = Math.round((endDate.getTime() - now.getTime()) / 1000);
        if (remainingSeconds <= 0) {
            remainingSeconds = 0; // 남은 시간을 0으로 설정
            clearInterval(timers[id]); // 타이머 종료
            delete timers[id]; // 타이머 삭제
        }
        store.update(s => ({ ...s, [id]: remainingSeconds }));
        return remainingSeconds;
    };

    // 타이머 시작 전 즉시 남은 시간 업데이트
    let remainingSeconds = updateRemainingTime();
    if (remainingSeconds <= 0) return; // 남은 시간이 없으면 종료

    let counter: number = 0; // 1초마다 증가할 카운터
    const interval: number = window.setInterval(() => {
        counter += 1;

        if (counter % syncInterval === 0 || remainingSeconds <= 0) {
            // 지정한 간격마다 남은 시간 재계산
            remainingSeconds = updateRemainingTime();
            counter = 0; // 카운터 초기화
        } else {
            // 매 초마다 기존 값에서 1초 감소, 단 남은 시간이 이미 0초인 경우는 감소하지 않음
            store.update(s => {
                const currentRemaining = s[id];
                return { ...s, [id]: currentRemaining > 0 ? currentRemaining - 1 : 0 };
            });
        }
    }, 1000);

    timers[id] = interval;
}

  function stop(id: string): void {
    if (timers[id]) {
      clearInterval(timers[id]);
      delete timers[id];
      store.update(s => {
        delete s[id];
        return s;
      });
    }
  }

  function pause(id: string): void {
    if (timers[id]) {
      clearInterval(timers[id]);
    }
  }

  function run(id: string, endDate: Date): void {
    if (!timers[id]) {
      start(id, endDate);
    }
  }

  return {
    subscribe: store.subscribe,
    start,
    stop,
    pause,
    run,
  };
}

export const countDownStore = createCountDownStore();

export function secondsToTimeString(seconds: number) {
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);

	if (hours > 0) {
		if (minutes % 60 === 0 && seconds % 60 === 0) {
			return `${hours}시간`;
		} else if (minutes % 60 === 0) {
			return `${hours}시간 ${seconds % 60}초`;
		} else if (seconds % 60 === 0) {
			return `${hours}시간 ${minutes % 60}분`;
		} else {
			return `${hours}시간 ${minutes % 60}분 ${seconds % 60}초`;
		}
	} else if (minutes > 0) {
		if (seconds % 60 === 0) {
			return `${minutes}분`;
		} else {
			return `${minutes}분 ${seconds % 60}초`;
		}
	} else {
		return `${seconds}초`;
	}
}