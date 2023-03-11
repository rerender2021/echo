import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default [{
    input: 'build/src/app.js',
    output: {
        file: 'dist/_/_/app.js',
        format: 'cjs'
    },
    plugins: [json(), nodeResolve(), commonjs({ ignoreDynamicRequires: true })],
}]