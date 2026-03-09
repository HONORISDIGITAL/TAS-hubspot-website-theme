import gulp from 'gulp'
import * as dartSass from 'sass'
import gulpSass from 'gulp-sass'
import sassGlob from 'gulp-sass-glob-use-forward'
import webpack from 'webpack-stream'
import newer from 'gulp-newer'
import exec from 'gulp-exec'
import gulpIf from 'gulp-if'
import plumber from 'gulp-plumber'

import config from './gulpconfig.mjs'
import { config as dotenvConfig } from 'dotenv'
import webpackConfig from './webpack.config.js'

dotenvConfig()

const sass = gulpSass(dartSass)

const devPortal = process.env.DEV_PORTAL
const prodPortal = process.env.PROD_PORTAL
const devDirectory = process.env.DIRECTORY_NAME_DEV
const prodDirectory = process.env.DIRECTORY_NAME_PROD
let portal = devPortal
let dir = devDirectory

let isWatching = false

const hsCmsUpload = (src, dest) => `yarn hs upload --account=${portal} ${src} ${dest}`
const hsCmsUploadInThemeFunctions = (src) => `yarn hs cms upload --account=${portal} ${src} ${dir}/yoco.functions`
const hsCmsDeleteInThemeFunctions = () => `yarn hs cms delete --account=${portal} ${dir}/yoco.functions`
const hsCmsFunctionList = () => `yarn hs cms function list --account=${portal}`

gulp.task('scss', () => {
    const srcPath = config.src.scss
    const destPath = config.dest.scss

    return gulp.src(srcPath)
        .pipe(sassGlob())
        .pipe(sass({
            outputStyle: 'compressed',
            quietDeps: true,
            quiet: true,
            sassOptions: { silenceDeprecations: ['legacy-js-api'] },
        }).on('error', sass.logError))
        .pipe(gulp.dest(destPath))
        .pipe(gulpIf(isWatching, exec(hsCmsUpload(`${destPath}/`, `${dir}/css/`))))
        .pipe(gulpIf(isWatching, exec.reporter()))
})

gulp.task('modules', () => {
    const srcPaths = ['src/modules/**/*.json', 'src/modules/**/*.html']
    return gulp.src(srcPaths)
        .pipe(newer(config.dest.modules))
        .pipe(gulp.dest(config.dest.modules))
        .pipe(gulpIf(isWatching, exec((file) => hsCmsUpload(`${config.dest.modules}/${file.relative}`, `${dir}/modules/${file.relative}`))))
        .pipe(gulpIf(isWatching, exec.reporter()))
})

gulp.task('scss:modules', () => {
    const srcPaths = ['src/modules/**/*.scss', 'src/modules/**/*.css']
    return gulp.src(srcPaths)
        .pipe(newer({
            dest: config.dest.modules,
            map: (path) => path.replace(/\.scss$/, '.css'),
        }))
        .pipe(sassGlob())
        .pipe(sass({ outputStyle: 'compressed', quietDeps: true }).on('error', sass.logError))
        .pipe(gulp.dest(config.dest.modules))
        .pipe(gulpIf(isWatching, exec((file) => hsCmsUpload(`${config.dest.modules}/${file.relative}`, `${dir}/modules/${file.relative}`))))
        .pipe(gulpIf(isWatching, exec.reporter()))
})

gulp.task('images', () => {
    const srcPath = 'src/images/**/*'
    return gulp.src(srcPath)
        .pipe(newer(config.dest.images))
        .pipe(gulp.dest(config.dest.images))
        .pipe(gulpIf(isWatching, exec((file) => hsCmsUpload(`${config.dest.images}/${file.relative}`, `${dir}/images/${file.relative}`))))
        .pipe(gulpIf(isWatching, exec.reporter()))
})

gulp.task('theme', () => {
    const srcPaths = ['src/fields.json', 'src/theme.json']
    return gulp.src(srcPaths)
        .pipe(newer(config.dest.theme))
        .pipe(gulp.dest(config.dest.theme))
        .pipe(gulpIf(isWatching, exec((file) => hsCmsUpload(`${config.dest.theme}/${file.relative}`, `${dir}/${file.relative}`))))
        .pipe(gulpIf(isWatching, exec.reporter()))
})

gulp.task('templates', () => {
    const srcPath = 'src/templates/**/*'
    return gulp.src(srcPath)
        .pipe(newer(config.dest.templates))
        .pipe(gulp.dest(config.dest.templates))
        .pipe(gulpIf(isWatching, exec((file) => hsCmsUpload(`${config.dest.templates}/${file.relative}`, `${dir}/templates/${file.relative}`))))
        .pipe(gulpIf(isWatching, exec.reporter()))
})

gulp.task('functions', () => {
    const srcPath = 'src/functions/**/*'
    return gulp.src(srcPath)
        .pipe(newer(config.dest.functions))
        .pipe(gulp.dest(config.dest.functions))
        .pipe(gulpIf(isWatching, exec((file) => hsCmsUpload(`${config.dest.functions}/${file.relative}`, `${dir}/.functions/${file.relative}`))))
        .pipe(gulpIf(isWatching, exec.reporter()))
})

gulp.task('javascript', () => {
    const srcPaths = ['src/js/**/*.js', 'src/modules/**/*.js']
    return gulp.src(srcPaths)
        .pipe(plumber({
            errorHandler(err) {
                console.error('Webpack Error:', err.message)
                this.emit('end')
            },
        }))
        .pipe(webpack(webpackConfig))
        .pipe(gulp.dest(config.dest.js))
})

gulp.task('setNotWatching', (done) => {
    isWatching = false
    done()
})

gulp.task('upload', () => {
    portal = process.argv.includes('--prod') ? prodPortal : devPortal
    dir = process.argv.includes('--prod') ? prodDirectory : devDirectory
    return gulp.src('dist')
        .pipe(exec(`${hsCmsUpload('dist', dir)}`))
        .pipe(exec.reporter())
})

gulp.task('upload:functions:in-theme', () => {
    portal = process.argv.includes('--prod') ? prodPortal : devPortal
    dir = process.argv.includes('--prod') ? prodDirectory : devDirectory
    const inThemeFunctionsSource = config.dirs.functions.replace(/\/$/, '')
    return gulp.src(inThemeFunctionsSource, { allowEmpty: false })
        .pipe(exec(hsCmsDeleteInThemeFunctions(), { continueOnError: true }))
        .pipe(exec.reporter())
        .pipe(exec(hsCmsUploadInThemeFunctions(inThemeFunctionsSource), { continueOnError: false }))
        .pipe(exec.reporter())
})

gulp.task('check:functions:list', () => {
    portal = process.argv.includes('--prod') ? prodPortal : devPortal
    return gulp.src('dist')
        .pipe(exec(hsCmsFunctionList()))
        .pipe(exec.reporter())
})

gulp.task('upload:js:main', () => {
    portal = process.argv.includes('--prod') ? prodPortal : devPortal
    dir = process.argv.includes('--prod') ? prodDirectory : devDirectory
    return gulp.src('dist/js')
        .pipe(exec(hsCmsUpload('dist/js', `${dir}/js`)))
        .pipe(exec.reporter())
})

gulp.task('upload:modules', () => {
    portal = process.argv.includes('--prod') ? prodPortal : devPortal
    dir = process.argv.includes('--prod') ? prodDirectory : devDirectory
    return gulp.src('dist/modules')
        .pipe(exec(hsCmsUpload('dist/modules', `${dir}/modules`)))
        .pipe(exec.reporter())
})

gulp.task('watch', () => {
    isWatching = true
    portal = process.argv.includes('--prod') ? prodPortal : devPortal
    dir = process.argv.includes('--prod') ? prodDirectory : devDirectory
    console.log('Watching for changes...')

    const watchOptions = { usePolling: true }

    gulp.watch('src/scss/**/*.scss', watchOptions, gulp.series('scss'))
    gulp.watch(['src/modules/**/*.json', 'src/modules/**/*.html'], watchOptions, gulp.series('modules'))
    gulp.watch('src/modules/**/*.scss', watchOptions, gulp.series('scss:modules'))
    gulp.watch('src/images/**/*', watchOptions, gulp.series('images'))
    gulp.watch(['src/fields.json', 'src/theme.json'], watchOptions, gulp.series('theme'))
    gulp.watch('src/templates/**/*', watchOptions, gulp.series('templates'))
    gulp.watch('src/functions/**/*', watchOptions, gulp.series('functions'))
    gulp.watch('src/js/**/*.js', watchOptions, gulp.series('javascript', gulp.parallel('upload:js:main', 'upload:modules')))
    gulp.watch('src/modules/**/*.js', watchOptions, gulp.series('javascript', gulp.parallel('upload:js:main', 'upload:modules')))
})

gulp.task('build', gulp.series('setNotWatching', gulp.parallel('scss', 'modules', 'scss:modules', 'images', 'theme', 'templates', 'functions', 'javascript')))

gulp.task('default', gulp.series('build', 'watch'))
