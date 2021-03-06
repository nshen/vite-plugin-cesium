import path from 'path';
import { Plugin } from 'vite';
import fs from 'fs-extra';

export default function (): Plugin {

    const cesiumBuildPath = 'node_modules/cesium/Build/Cesium/';
    let publicPath = 'public';

    return {
        name: 'vite-plugin-cesium',

        configResolved(resolvedConfig) {
            publicPath = resolvedConfig.publicDir;
        },

        async buildStart(options) {
            try {
                const exists = await fs.pathExists('public/cesium/Assets');
                if (!exists) {
                    await fs.copy(path.join(cesiumBuildPath, 'Assets'), path.join(publicPath, 'cesium/Assets'));
                    await fs.copy(path.join(cesiumBuildPath, 'ThirdParty'), path.join(publicPath, 'cesium/ThirdParty'));
                    await fs.copy(path.join(cesiumBuildPath, 'Workers'), path.join(publicPath, 'cesium/Workers'));
                    await fs.copy(path.join(cesiumBuildPath, 'Widgets'), path.join(publicPath, 'cesium/Widgets'));
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