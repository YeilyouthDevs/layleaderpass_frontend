import { initialize } from "$lib/script/initialize";
import { signin } from "$lib/stores/credentialStore";

export const prerender = false;
export const ssr = false;
export const trailingSlash = 'never';

export async function load() {
    initialize();
    await signin({ isAutoLogin: true });
}
