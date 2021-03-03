import path from 'path';
import { Plugin } from 'vite';
import fs from 'fs-extra';

export default function (): Plugin {

    const cesiumBuildPath = 'node_modules/cesium/Build/Cesium/';

    return {
        name: 'vite-plugin-cesium',

        async buildStart(options) {
            try {
                const exists = await fs.pathExists('public/cesium/Assets');
                if (!exists) {
                    await fs.copy(path.join(cesiumBuildPath, 'Assets'), 'public/cesium/Assets');
                    await fs.copy(path.join(cesiumBuildPath, 'ThirdParty'), 'public/cesium/ThirdParty');
                    await fs.copy(path.join(cesiumBuildPath, 'Workers'), 'public/cesium/Workers');
                    await fs.copy(path.join(cesiumBuildPath, 'Widgets'), 'public/cesium/Widgets');
                }

            } catch (err) {
                console.error('copy failed');
            }
        },

        config() {
            return {
                build: {
                    assetsInlineLimit: 0,
                    chunkSizeWarningLimit: 4000
                }
            };
        },

        transformIndexHtml() {
            return [
                {
                    tag: 'link',
                    attrs: { rel: 'stylesheet', href: 'cesium/Widgets/widgets.css' },
                },
                {
                    tag: 'script',
                    children: 'window.CESIUM_BASE_URL = "/cesium/"'
                }
            ];
        },
    };
}