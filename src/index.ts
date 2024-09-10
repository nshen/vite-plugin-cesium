import fs from 'fs-extra';
import path from 'path';
import externalGlobals from 'rollup-plugin-external-globals';
import serveStatic from 'serve-static';
import { HtmlTagDescriptor, normalizePath, Plugin, UserConfig } from 'vite';

interface VitePluginCesiumOptions {
  /**
   * rebuild cesium library, default: false
   */
  rebuildCesium?: boolean;
  devMinifyCesium?: boolean;
  cesiumBuildRootPath?: string;
  cesiumBuildPath?: string;
  cesiumBaseUrl?: string;
}

export default function vitePluginCesium(options: VitePluginCesiumOptions = {}): Plugin {
  const {
    rebuildCesium = false,
    devMinifyCesium = false,
    cesiumBuildRootPath = 'node_modules/cesium/Build',
    cesiumBuildPath = 'node_modules/cesium/Build/Cesium/',
    cesiumBaseUrl = 'cesium/'
  } = options;

  let CESIUM_BASE_URL = cesiumBaseUrl;
  if (!CESIUM_BASE_URL.endsWith('/')) {
    CESIUM_BASE_URL += '/';
  }
  let outDir = 'dist';
  let base: string = '/';
  let isBuild: boolean = false;

  return {
    name: 'vite-plugin-cesium',

    config(c, { command }) {
      isBuild = command === 'build';
      if (c.base !== undefined) {
        base = c.base;
        if (base === '') base = './';
      }
      if (c.build?.outDir) {
        outDir = c.build.outDir;
      }
      CESIUM_BASE_URL = path.posix.join(base, CESIUM_BASE_URL);
      const userConfig: UserConfig = {};
      if (!isBuild) {
        // -----------dev-----------
        userConfig.define = {
          CESIUM_BASE_URL: JSON.stringify(CESIUM_BASE_URL)
        };
      } else {
        // -----------build------------
        if (rebuildCesium) {
          // build 1) rebuild cesium library
          userConfig.build = {
            assetsInlineLimit: 0,
            chunkSizeWarningLimit: 5000,
            rollupOptions: {
              output: {
                intro: `window.CESIUM_BASE_URL = ${JSON.stringify(CESIUM_BASE_URL)};`
              }
            }
          };
        } else {
          // build 2) copy Cesium.js later
          userConfig.build = {
            rollupOptions: {
              external: ['cesium'],
              plugins: [externalGlobals({ cesium: 'Cesium' })]
            }
          };
        }
      }
      return userConfig;
    },

    configureServer({ middlewares }) {
      const cesiumPath = path.join(cesiumBuildRootPath, devMinifyCesium ? 'Cesium' : 'CesiumUnminified');
      middlewares.use(path.posix.join('/', CESIUM_BASE_URL), serveStatic(cesiumPath, {
        setHeaders: (res, path, stat) => {
          res.setHeader('Access-Control-Allow-Origin', '*')
        }
      }));
    },

    async closeBundle() {
      if (isBuild) {
        try {
          await fs.copy(path.join(cesiumBuildPath, 'Assets'), path.join(outDir, CESIUM_BASE_URL, 'Assets'));
          await fs.copy(path.join(cesiumBuildPath, 'ThirdParty'), path.join(outDir, CESIUM_BASE_URL, 'ThirdParty'));
          await fs.copy(path.join(cesiumBuildPath, 'Workers'), path.join(outDir, CESIUM_BASE_URL, 'Workers'));
          await fs.copy(path.join(cesiumBuildPath, 'Widgets'), path.join(outDir, CESIUM_BASE_URL, 'Widgets'));
          if (!rebuildCesium) {
            await fs.copy(path.join(cesiumBuildPath, 'Cesium.js'), path.join(outDir, CESIUM_BASE_URL, 'Cesium.js'));
          }
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
        }
      ];
      if (isBuild && !rebuildCesium) {
        tags.push({
          tag: 'script',
          attrs: {
            src: normalizePath(path.join(CESIUM_BASE_URL, 'Cesium.js')),
          }
        });
      }
      return tags;
    }
  };
}
