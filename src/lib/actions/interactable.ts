

export function interactable(node: HTMLElement) {
	const handleStart = (event: UIEvent) => {
		event.type.startsWith('touch')
			? node.dispatchEvent(new CustomEvent('interactstart', { detail: { type: 'touch' } }))
			: node.dispatchEvent(new CustomEvent('interactstart', { detail: { type: 'drag' } }));
	};

	const handleMove = (event: UIEvent) => {
		event.type.startsWith('touch')
			? node.dispatchEvent(new CustomEvent('interactmove', { detail: { type: 'touch' } }))
			: node.dispatchEvent(new CustomEvent('interactmove', { detail: { type: 'drag' } }));
	};

	const handleEnd = (event: UIEvent) => {
		event.type.startsWith('touch')
			? node.dispatchEvent(new CustomEvent('interactend', { detail: { type: 'touch' } }))
			: node.dispatchEvent(new CustomEvent('interactend', { detail: { type: 'drag' } }));
	};

	// Touch events
	node.addEventListener('touchstart', handleStart);
	node.addEventListener('touchmove', handleMove);
	node.addEventListener('touchend', handleEnd);

	// Mouse events for drag
	node.addEventListener('mousedown', handleStart);
	node.addEventListener('mousemove', handleMove);
	node.addEventListener('mouseup', handleEnd);

	return {
		destroy() {
			node.removeEventListener('touchstart', handleStart);
			node.removeEventListener('touchmove', handleMove);
			node.removeEventListener('touchend', handleEnd);
			node.removeEventListener('mousedown', handleStart);
			node.removeEventListener('mousemove', handleMove);
			node.removeEventListener('mouseup', handleEnd);
		}
	};
}
