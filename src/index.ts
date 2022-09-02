import fs from 'fs-extra';
import path from 'path';
import externalGlobals from 'rollup-plugin-external-globals';
import { HtmlTagDescriptor, normalizePath, Plugin, UserConfig } from 'vite';
import copy from 'recursive-copy'
import {
  deleteSync
} from 'del'
import { viteExternalsPlugin } from 'vite-plugin-externals'

export default function vitePluginCesium(): Plugin {
  let CESIUM_BASE_URL = '/lib/cesium/';
  let outDir = 'dist';
  let base: string = '/';
  let isBuild: boolean = false;

  const cesiumBuildPath = 'node_modules/cesium/Build/Cesium/'
  const baseDir = `node_modules/cesium/Build/CesiumUnminified`
  const targets = [
    'Assets/**/*',
    'ThirdParty/**/*',
    'Widgets/**/*',
    'Workers/**/*',
    'Cesium.js',
  ]

  return {
    name: 'vite-plugin-cesium',
    config(c, { command }) {
      isBuild = command === 'build';
      if (c.base) {
        base = c.base;
        if (base === '') base = './';
      }
      if (c.build?.outDir) {
        outDir = c.build.outDir;
      }
      CESIUM_BASE_URL = path.posix.join(base, CESIUM_BASE_URL);
      const userConfig: UserConfig = {};
      if (!isBuild) {
        userConfig.define = {
          CESIUM_BASE_URL: JSON.stringify(CESIUM_BASE_URL)
        };
        userConfig.plugins = [
          viteExternalsPlugin({
            cesium: 'Cesium'
          })
        ]
        //每次启动更新cesium
        deleteSync(targets.map((src) => `public/lib/cesium/${src}`))
        copy(baseDir, `public/lib/cesium`, {
          expand: true,
          overwrite: true,
          filter: targets
        })
      } else {
        userConfig.build = {
          rollupOptions: {
            external: ['cesium'],
            plugins: [externalGlobals({ cesium: 'Cesium' })]
          }
        };
      }
      return userConfig;
    },
    async closeBundle() {
      if (isBuild) {
        try {
          fs.removeSync(path.join(outDir, 'lib'));
          let newOutDir = `${outDir}${CESIUM_BASE_URL}`
          await fs.copy(path.join(cesiumBuildPath, 'Assets'), path.join(newOutDir, 'Assets'));
          await fs.copy(path.join(cesiumBuildPath, 'ThirdParty'), path.join(newOutDir, 'ThirdParty'));
          await fs.copy(path.join(cesiumBuildPath, 'Workers'), path.join(newOutDir, 'Workers'));
          await fs.copy(path.join(cesiumBuildPath, 'Widgets'), path.join(newOutDir, 'Widgets'));
          await fs.copy(path.join(cesiumBuildPath, 'Cesium.js'), path.join(newOutDir, 'Cesium.js'));
        } catch (err) {
          console.error('copy failed', err);
        }
      }
    },
    transformIndexHtml() {
      const tags: HtmlTagDescriptor[] = [
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: normalizePath(path.join(CESIUM_BASE_URL, 'Widgets/widgets.css')),
          }
        },
        {
          tag: 'script',
          attrs: {
            src: normalizePath(path.join(CESIUM_BASE_URL, 'Cesium.js')),
          }
        }
      ];
      return tags;
    }
  };
}
