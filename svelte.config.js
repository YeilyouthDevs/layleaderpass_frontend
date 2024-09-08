import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			pages: '../backend/frontend-build',  // 빌드된 HTML 파일의 경로
			assets: '../backend/frontend-build', // 빌드된 자산 파일의 경로
			fallback: 'index.html',
			precompress: false
		}),
		paths: {
			base: '',
			assets: ''
		},
	}
};

export default config;
