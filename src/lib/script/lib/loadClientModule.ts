import type bootstrap from 'bootstrap';

let bootstrapDynamicImport: typeof bootstrap;

export async function loadBootstrap() {
	if (!bootstrapDynamicImport) {
		bootstrapDynamicImport = await import('bootstrap');
	}
	return bootstrapDynamicImport;
}