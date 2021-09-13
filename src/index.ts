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
}

function vitePluginCesium(
  options: VitePluginCesiumOptions = {
    rebuildCesium: false,
    devMinifyCesium: false
  }
): Plugin {
  const { rebuildCesium, devMinifyCesium } = options;

  const cesiumBuildRootPath = 'node_modules/cesium/Build';
  const cesiumBuildPath = 'node_modules/cesium/Build/Cesium/';

  let CESIUM_BASE_URL = '/cesium/';
  let outDir = 'dist';
  let base: string = '/';
  let isBuild: boolean = false;

  return {
    name: 'vite-plugin-cesium',

    config(c, { command }) {
      isBuild = command === 'build';
      if (c.build?.outDir) outDir = c.build.outDir;
      if (c.base) {
        base = c.base;
      }
      if (isBuild) CESIUM_BASE_URL = path.join(base, CESIUM_BASE_URL);
      const userConfig: UserConfig = {
        build: {
          assetsInlineLimit: 0,
          chunkSizeWarningLimit: 4000
        },
        define: {
          CESIUM_BASE_URL: JSON.stringify(CESIUM_BASE_URL)
        }
      };
      if (isBuild && !rebuildCesium) {
        userConfig.build!.rollupOptions = {
          external: ['cesium'],
          plugins: [externalGlobals({ cesium: 'Cesium' })]
        };
      }
      return userConfig;
    },

    async load(id: string) {
      if (!rebuildCesium) return null;
      // replace CESIUM_BASE_URL variable in 'cesium/Source/Core/buildModuleUrl.js'
      if (id.includes('buildModuleUrl')) {
        let file = fs.readFileSync(id, { encoding: 'utf8' });
        file = file.replace(
          /CESIUM_BASE_URL/g,
          JSON.stringify(CESIUM_BASE_URL)
        );
        return file;
      }

      return null;
    },

    configureServer({ middlewares }) {
      const cesiumPath = path.join(
        cesiumBuildRootPath,
        devMinifyCesium ? 'Cesium' : 'CesiumUnminified'
      );
      middlewares.use(CESIUM_BASE_URL, serveStatic(cesiumPath));
    },

    async closeBundle() {
      if (isBuild) {
        try {
          await fs.copy(
            path.join(cesiumBuildPath, 'Assets'),
            path.join(outDir, 'cesium/Assets')
          );
          await fs.copy(
            path.join(cesiumBuildPath, 'ThirdParty'),
            path.join(outDir, 'cesium/ThirdParty')
          );
          await fs.copy(
            path.join(cesiumBuildPath, 'Workers'),
            path.join(outDir, 'cesium/Workers')
          );
          await fs.copy(
            path.join(cesiumBuildPath, 'Widgets'),
            path.join(outDir, 'cesium/Widgets')
          );
          if (!rebuildCesium) {
            await fs.copy(
              path.join(cesiumBuildPath, 'Cesium.js'),
              path.join(outDir, 'cesium/Cesium.js')
            );
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
            href: normalizePath(
              path.join(CESIUM_BASE_URL, 'Widgets/widgets.css')
            )
          }
        }
      ];
      if (isBuild && !rebuildCesium) {
        tags.push({
          tag: 'script',
          attrs: { src: normalizePath(path.join(base, 'cesium/Cesium.js')) }
        });
      }
      return tags;
    }
  };
}

export default vitePluginCesium;
