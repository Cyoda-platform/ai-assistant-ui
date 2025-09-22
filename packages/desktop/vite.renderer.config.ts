import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import svgLoader from 'vite-svg-loader';

// https://vitejs.dev/config
export default defineConfig({
    plugins: [
        vue(),
        svgLoader({
            svgoConfig: {
                multipass: true,
                plugins: [
                    {
                        name: 'preset-default',
                        params: {
                            overrides: {
                                // viewBox is required to resize SVGs with CSS.
                                // @see https://github.com/svg/svgo/issues/1128
                                removeViewBox: false,
                            },
                        },
                    },
                ],
            },
        }),
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, '../web/src'),
        },
    },
});