/**
 * Gulp configuration
 */

const config = {
  dest: {
    scss: 'dist/css/',
    theme: 'dist/',
    modules: 'dist/modules',
    templates: 'dist/templates',
    images: 'dist/images',
    js: 'dist/js',
    dist: 'dist/',
  },
  dirs: {
    scss: 'src/scss/',
    theme: 'src/',
    modules: 'src/modules/',
    templates: 'src/templates/',
    images: 'src/images/',
  },
  src: {
    scss: 'src/scss/main.scss',
    theme: 'src/*',
    modules: 'src/modules/**/*',
    templates: 'src/templates/**/*',
    images: 'src/images/*',
  },
};

export default config;