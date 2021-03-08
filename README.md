# vite-plugin-cesium 

[![npm](https://img.shields.io/npm/v/vite-plugin-cesium.svg)](https://www.npmjs.com/package/vite-plugin-cesium)

Easily set up a [`Cesium`] project in [`Vite`].

[`Cesium`]: https://github.com/CesiumGS/cesium
[`Vite`]: https://github.com/vitejs/vite

[中文教程](https://segmentfault.com/a/1190000039344137)

## Install

```bash
npm i cesium -D # yarn add cesium -D
npm i vite-plugin-cesium -D # yarn add vite-plugin-cesium -D
```

## Usage

add this plugin to `vite.config.js`

```js
import { defineConfig } from 'vite';
import cesium from 'vite-plugin-cesium';
export default defineConfig({
    plugins: [cesium()],
});
```

## Options

**rebuildCesium**

- **Type :** `boolean`
- **Default :** `false`

Default copy min cesium file to dist. if `true` will rebuild cesium. 

```js
import { defineConfig } from 'vite';
import cesium from 'vite-plugin-cesium';
export default defineConfig({
    plugins: [cesium({
        rebuildCesium: false
    })],
});
```

## Demo


`src/index.js`

```js
import { Viewer } from 'cesium';
import "./css/main.css";

const viewer = new Viewer('cesiumContainer');
```

`index.html`

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>cesium-vite</title>
    <script type="module" src="/src/index.js"></script>
</head>

<body>
    <div id="cesiumContainer"></div>
</body>

</html>
```

`src/css/main.css`

```css
html, body, #cesiumContainer {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
}
```

Add `dev` and `build` commands to `package.json`

```
"scripts": {
    "dev": "vite",
    "build": "vite build"
},
```
Run `yarn dev` 

For full demo project please check [./demo](https://github.com/nshen/vite-plugin-cesium/tree/main/demo) folder.

## License

MIT