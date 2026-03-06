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
        functions: 'dist/.functions',
        dist: 'dist/',
    },
    dirs: {
        scss: 'src/scss/',
        theme: 'src/',
        modules: 'src/modules/',
        templates: 'src/templates/',
        images: 'src/images/',
        functions: 'src/functions/',
    },
    src: {
        scss: 'src/scss/main.scss',
        theme: 'src/*',
        modules: 'src/modules/**/*',
        templates: 'src/templates/**/*',
        images: 'src/images/*',
        functions: 'src/functions/**/*',
    },
}

export default config
