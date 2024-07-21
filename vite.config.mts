// Plugins
import Vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { VitePWA } from 'vite-plugin-pwa'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

// Utilities
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

const target = 'http://localhost:11090';

// https://vitejs.dev/config/
export default defineConfig({
	build: {
		rollupOptions: {
			onwarn: (warning, warn) => (warning.code !== 'EVAL') ? warn(warning) : undefined // suppress eval warnings (@vue/devtools)
		}
	},
	plugins: [
		Vue({
			template: { transformAssetUrls },
		}),
		// https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
		Vuetify(),
		// only use pwa in production, and not in the plugin.
		...[process.env.SCRYPTED_PWA ? VitePWA({
			workbox: {
				maximumFileSizeToCacheInBytes: 10000000,
				clientsClaim: true,
				skipWaiting: true,
			},
			useCredentials: true,
			registerType: 'autoUpdate',
			devOptions: {
				enabled: process.env.NODE_ENV !== 'production',
			},
			manifest: {
				"name": "Scrypted Management Console",
				"orientation": "any",
				"short_name": "Scrypted",
				"icons": [
					{
						"src": "img/icons/manifest-icon-192.maskable.png",
						"sizes": "192x192",
						"type": "image/png",
						"purpose": "any"
					},
					{
						"src": "img/icons/manifest-icon-192.maskable.png",
						"sizes": "192x192",
						"type": "image/png",
						"purpose": "maskable"
					},
					{
						"src": "img/icons/manifest-icon-512.maskable.png",
						"sizes": "512x512",
						"type": "image/png",
						"purpose": "any"
					},
					{
						"src": "img/icons/manifest-icon-512.maskable.png",
						"sizes": "512x512",
						"type": "image/png",
						"purpose": "maskable"
					}
				],
				"start_url": "./index.html",
				"display": "standalone",
				"background_color": "#000000",
				"theme_color": "#424242"
			}
		})
			: undefined,
		],
		Components(),
	],
	base: './',
	define: { 'process.env': {} },
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
		extensions: [
			'.js',
			'.json',
			'.jsx',
			'.mjs',
			'.ts',
			'.tsx',
			'.vue',
		],
	},
	server: {
		host: '0.0.0.0',
		port: 4000,
		proxy: {
			'^/(login|logout|endpoint|engine.io|web/component/backup|web/component/restore)': {
				target,
				changeOrigin: true,
				secure: false,
				ws: true,
			},
		}
	},
})
