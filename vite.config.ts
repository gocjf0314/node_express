import { defineConfig } from 'vite';
import babel from 'vite-plugin-babel';

export default defineConfig({
    plugins: [
        // Babel will try to pick up Babel config files (.babelrc or .babelrc.json)
        babel({
            babelConfig: {
                babelrc: true,
                configFile: true,
                // plugins: ['@babel/plugin-proposal-decorators']
            }
        }),
        // ...
    ],
    // ...
});

/*
    "dev": "npm run build && nodemon",
    "start": "npm run build && nodemon ./dist/index.js",
    "type-check": "tsc --noEmit",
    "type-check:watch": "npm run type-check --watch",
    "build": "npm run build:js",
    "build:js": "babel src --out-dir dist --extensions \".ts,.tsx\" --source-maps inline"
*/