import { defineConfig } from 'vite';
import cesium from '../src/index.ts';
export default defineConfig({
  plugins: [cesium()]
});
