import babel from 'rollup-plugin-babel';

export default {
  entry: './src/index.js',
  format: 'cjs',
  external: ['stream', 'yargs', 'fs', 'path', 'os', 'bluebird'],
  banner: '#!/usr/bin/env node',
  plugins: [
    babel({
      babelrc: false,
      presets: [
        [
          'env',
          {
            modules: false,
            targets: {
              node: 6,
            },
          },
        ],
        'stage-0',
      ],
    }),
  ],
  dest: './dist/index.js',
};
