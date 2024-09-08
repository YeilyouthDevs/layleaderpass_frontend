export function swipe(node: HTMLElement, { minDistance = 75, maxTime = 500 } = {}) {
	let startX: number, startTime: number;
	let swipeDetected = false; // 스와이프 감지 여부

	function handleTouchStart(event: TouchEvent) {
		startX = event.touches[0].clientX;
		startTime = new Date().getTime(); // 터치 시작 시간 기록
		swipeDetected = false; // 새로운 스와이프 시작 시 플래그를 초기화
	}

	function handleTouchMove(event: TouchEvent) {
		const moveX = event.touches[0].clientX;
		const currentTime = new Date().getTime();
		const diffX = moveX - startX;
		const elapsedTime = currentTime - startTime;

		// 스와이프 거리에 따라 투명도를 조절
		const opacity = 1 - Math.min(1, Math.abs(diffX) / minDistance) * 0.75;
		node.style.opacity = opacity.toString();

		// 이동 중 최소 거리 및 최대 시간 조건을 만족하는지 확인하여 스와이프 감지
		if (Math.abs(diffX) >= minDistance && elapsedTime <= maxTime) {
			swipeDetected = true;
		}
	}

	function handleTouchEnd(event: TouchEvent) {
		if (swipeDetected) {
			// 스와이프 감지되었을 경우 이벤트 발생
			const endTime = new Date().getTime();
			const elapsedTime = endTime - startTime;

			if (elapsedTime <= maxTime) {
				// 스와이프 방향에 따라 적절한 이벤트 발생
				const endX = event.changedTouches[0].clientX;
				const diffX = endX - startX;

				if (diffX < 0) {
					node.dispatchEvent(new CustomEvent('leftswipe'));
				} else {
					node.dispatchEvent(new CustomEvent('rightswipe'));
				}
			}
		}

		// 터치가 끝날 때 요소의 투명도를 초기화
		node.style.opacity = '1';
	}

	node.addEventListener('touchstart', handleTouchStart);
	node.addEventListener('touchmove', handleTouchMove);
	node.addEventListener('touchend', handleTouchEnd);

	return {
		destroy() {
			node.removeEventListener('touchstart', handleTouchStart);
			node.removeEventListener('touchmove', handleTouchMove);
			node.removeEventListener('touchend', handleTouchEnd);
		}
	};
}
