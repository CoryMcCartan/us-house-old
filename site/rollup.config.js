import resolve from 'rollup-plugin-node-resolve';
import cjs from 'rollup-plugin-commonjs';

export default {
    entry: "js/main.js",
    format: "iife",
    dest: "../output/compiled.js",
    plugins: [ 
        cjs(),
        resolve(),
    ],
    sourceMap: true,
};
