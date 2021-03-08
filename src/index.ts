import path from 'path';
import { Plugin, UserConfig, HtmlTagDescriptor } from 'vite';
import fs from 'fs-extra';
import externalGlobals from "rollup-plugin-external-globals";

type options = { rebuildCesium: boolean; };

export default function ({ rebuildCesium }: options = { rebuildCesium: false }): Plugin {

    const cesiumBuildPath = 'node_modules/cesium/Build/Cesium/';
    let publicPath = 'public';

    return {
        name: 'vite-plugin-cesium',

        config(config, { command }) {
            const userConfig: UserConfig = {
                build: {
                    assetsInlineLimit: 0,
                    chunkSizeWarningLimit: 4000
                },
                define: {
                    CESIUM_BASE_URL: '/cesium/'
                }
            };
            if (command === 'build' && !rebuildCesium) {
                userConfig.build!.rollupOptions = {
                    external: ['cesium'],
                    plugins: [
                        externalGlobals({ cesium: "Cesium" })
                    ]
                };
            }
            return userConfig;
        },

        configResolved(resolvedConfig) {
            publicPath = resolvedConfig.publicDir;
        },

        async buildStart(options) {
            try {
                const exists = await fs.pathExists(path.join(publicPath, 'cesium'));
                if (!exists) {
                    await fs.copy(path.join(cesiumBuildPath, 'Assets'), path.join(publicPath, 'cesium/Assets'));
                    await fs.copy(path.join(cesiumBuildPath, 'ThirdParty'), path.join(publicPath, 'cesium/ThirdParty'));
                    await fs.copy(path.join(cesiumBuildPath, 'Workers'), path.join(publicPath, 'cesium/Workers'));
                    await fs.copy(path.join(cesiumBuildPath, 'Widgets'), path.join(publicPath, 'cesium/Widgets'));

                }
                if (rebuildCesium) {
                    await fs.remove(path.join(publicPath, 'cesium/Cesium.js'));
                } else {
                    await fs.copy(path.join(cesiumBuildPath, 'Cesium.js'), path.join(publicPath, 'cesium/Cesium.js'));
                }

            } catch (err) {
                console.error('copy failed', err);
            }
        },

        transformIndexHtml() {
            const tags: HtmlTagDescriptor[] = [{ tag: 'link', attrs: { rel: 'stylesheet', href: 'cesium/Widgets/widgets.css' } }];
            if (!rebuildCesium) {
                tags.push({ tag: 'script', attrs: { src: 'cesium/Cesium.js' } });
            }
            return tags;
        },
    };
}