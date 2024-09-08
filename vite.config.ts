import { sveltekit } from '@sveltejs/kit/vite';
import path from 'path';
import { defineConfig } from 'vitest/config';
export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 8080,
		host: '0.0.0.0',
		proxy: {
			'/api': {
				target: 'http://localhost:9001',
				changeOrigin: true,
				xfwd: true
			},
			'/socket': {
				target: 'wss://localhost:8080', // WebSocket의 경우 wss://로 설정
				ws: true,
				changeOrigin: true,
				secure: true, // secure를 true로 설정
			},
		},
	},
	build: {
		sourcemap: false
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	css: {
		preprocessorOptions: {
			scss: {
				additionalData: `
				@import '$lib/scss/global';
				`,
				
			},
		}
	},
	resolve: {
		alias: {
			'@': path.resolve('./src')
		},
		mainFields: ['browser']
	}
});
