import gulp from 'gulp'; // Gulp 5.0.0
import * as dartSass from 'sass' // SASS Support -> Compiler = Dart Sass 2 or 3
import gulpSass from 'gulp-sass'; // Gulp SASS Support (to use Sass Compiler in Gulp)
import sassGlob from 'gulp-sass-glob-use-forward'; // Gulp SASS Glob Support (to use @use and @forward globally, ex:'@use ./*')
import webpack from 'webpack-stream'; // Webpack Support (to use Webpack in Gulp)
import newer from 'gulp-newer'; // Gulp Newer Support (Pour ne traiter que les fichiers modifiés)
import exec from 'gulp-exec'; // Gulp Exec Support (to execute shell commands in Gulp)
import gulpIf from 'gulp-if'; // Gulp If Support (to use if condition in Gulp)
import plumber from 'gulp-plumber'; // Gulp Plumber Support (to handle errors in Gulp)

import config from './gulpconfig.mjs';
import { config as dotenvConfig } from 'dotenv';
import webpackConfig from './webpack.config.js';

// Initialize dotenv
dotenvConfig();

// Initialisation de gulp-sass avec dart-sass
const sass = gulpSass(dartSass);

// Variables d'environnement
const devPortal = process.env.DEV_PORTAL;
const prodPortal = process.env.PROD_PORTAL;
const devDirectory = process.env.DIRECTORY_NAME_DEV;
const prodDirectory = process.env.DIRECTORY_NAME_PROD;
let portal = devPortal;
let dir = devDirectory;

let isWatching = false; // Variable pour savoir si on est en mode watch ou non

// Tâche SCSS : compile les fichiers SCSS en CSS et les minifie ensuite
gulp.task('scss', () => {
    const srcPath = config.src.scss;
    const destPath = config.dest.scss;

    return gulp.src(srcPath)
        .pipe(sassGlob()) // Active le globbing avec @use/@forward
        .pipe(sass({
            outputStyle: 'compressed', quietDeps: true, quiet: true, sassOptions: {
                silenceDeprecations: ["legacy-js-api"], // Met en silence les avertissements spécifiques
            }
        }).on('error', sass.logError)) // Compile les fichiers SCSS en CSS et les minifie
        .pipe(gulp.dest(destPath))
        .pipe(gulpIf(isWatching, exec(`yarn hs upload --account=${portal} ${destPath + "/"} ${dir + "/css/"}`)))
        .pipe(gulpIf(isWatching, exec.reporter()));
});

// Tâche Modules : copie les fichiers JSON et HTML des modules
gulp.task('modules', () => {
    const srcPaths = ['src/modules/**/*.json', 'src/modules/**/*.html'];
    return gulp.src(srcPaths)
        .pipe(newer(config.dest.modules,)) // Ne traite que les fichiers modifiés
        .pipe(gulp.dest(config.dest.modules))
        .pipe(gulpIf(isWatching, exec((file) => `yarn hs upload --account=${portal} ${config.dest.modules}/${file.relative} ${dir}/modules/${file.relative}`)))
        .pipe(gulpIf(isWatching, exec.reporter()));
});

// Tâche SCSS Module : compile les fichiers SCSS et CSS des modules
gulp.task('scss:modules', () => {
    const srcPaths = ['src/modules/**/*.scss', 'src/modules/**/*.css'];
    return gulp.src(srcPaths)
        .pipe(newer({
            dest: config.dest.modules,
            map: function (path) {
                return path.replace(/\.scss$/, '.css');
            }
        }))
        .pipe(sassGlob())
        .pipe(sass({ outputStyle: 'compressed', quietDeps: true }).on('error', sass.logError))
        .pipe(gulp.dest(config.dest.modules))
        .pipe(gulpIf(isWatching, exec((file) => `yarn hs upload --account=${portal} ${config.dest.modules}/${file.relative} ${dir}/modules/${file.relative}`)))
        .pipe(gulpIf(isWatching, exec.reporter()));
});

// Tâche Images : copie les fichiers d'images
gulp.task('images', () => {
    const srcPath = 'src/images/**/*';
    return gulp.src(srcPath)
        .pipe(newer(config.dest.images)) // Ne traite que les fichiers modifiés
        .pipe(gulp.dest(config.dest.images))
        .pipe(gulpIf(isWatching, exec((file) => `yarn hs upload --account=${portal} ${config.dest.images}/${file.relative} ${dir}/images/${file.relative}`)))
        .pipe(gulpIf(isWatching, exec.reporter()));
});

// Tâche Theme : copie les fichiers JSON du thème
gulp.task('theme', () => {
    const srcPaths = ['src/fields.json', 'src/theme.json'];
    return gulp.src(srcPaths)
        .pipe(newer(config.dest.theme)) // Ne traite que les fichiers modifiés
        .pipe(gulp.dest(config.dest.theme))
        .pipe(gulpIf(isWatching, exec((file) => `yarn hs upload --account=${portal} ${config.dest.theme}/${file.relative} ${dir}/${file.relative}`)))
        .pipe(gulpIf(isWatching, exec.reporter()));
});

// Tâche Templates : copie les fichiers HTML des templates
gulp.task('templates', () => {
    const srcPath = 'src/templates/**/*';
    return gulp.src(srcPath)
        .pipe(newer(config.dest.templates))
        .pipe(gulp.dest(config.dest.templates))
        .pipe(gulpIf(isWatching, exec((file) => `yarn hs upload --account=${portal} ${config.dest.templates}/${file.relative} ${dir}/templates/${file.relative}`)))
        .pipe(gulpIf(isWatching, exec.reporter()));
});

// Tâche Javascript : compile les fichiers JS
gulp.task('javascript', () => {
    const srcPaths = ['src/js/**/*.js', 'src/modules/**/*.js'];
    return gulp.src(srcPaths)
        .pipe(plumber({
            errorHandler: function (err) {
                console.error('Webpack Error:', err.message);
                done();
                this.emit('end'); // Continue le watcher même après une erreur
            }
        }))
        .pipe(webpack(webpackConfig))
        .pipe(gulp.dest(config.dest.js));
});

// Tâche setNotWatching qui permet de passer la variable isWatching à false
gulp.task('setNotWatching', function (done) {
    isWatching = false;
    done(); // signal completion
});

// Tâche Upload : upload les fichiers sur HubSpot
gulp.task('upload', () => {
    portal = process.argv.includes('--prod') ? prodPortal : devPortal;
    dir = process.argv.includes('--prod') ? prodDirectory : devDirectory;
    return gulp.src('dist')
        .pipe(exec(`yarn hs upload --account=${portal} dist ${dir}`))
        .pipe(exec.reporter());
});

// Tâches spécifiques pour l'upload
gulp.task('upload:js:main', () => {
    portal = process.argv.includes('--prod') ? prodPortal : devPortal;
    dir = process.argv.includes('--prod') ? prodDirectory : devDirectory;
    return gulp.src('dist/js')
        .pipe(exec(`yarn hs upload --account=${portal} dist/js ${dir}/js`))
        .pipe(exec.reporter());
});

gulp.task('upload:modules', () => {
    portal = process.argv.includes('--prod') ? prodPortal : devPortal;
    dir = process.argv.includes('--prod') ? prodDirectory : devDirectory;
    return gulp.src('dist/modules')
        .pipe(exec(`yarn hs upload --account=${portal} dist/modules ${dir}/modules`))
        .pipe(exec.reporter());
});

// Tâche Watch : surveille les modifications des fichiers
gulp.task('watch', () => {
    isWatching = true;
    portal = process.argv.includes('--prod') ? prodPortal : devPortal;
    dir = process.argv.includes('--prod') ? prodDirectory : devDirectory;
    console.log('Watching for changes...');

    const watchOptions = {
        usePolling: true, // Active polling pour s'assurer de capter les changements sur certains systèmes
    };

    gulp.watch('src/scss/**/*.scss', watchOptions, gulp.series('scss'));
    gulp.watch(['src/modules/**/*.json', 'src/modules/**/*.html'], watchOptions, gulp.series('modules'));
    gulp.watch('src/modules/**/*.scss', watchOptions, gulp.series('scss:modules'));
    gulp.watch('src/images/**/*', watchOptions, gulp.series('images'));
    gulp.watch(['src/fields.json', 'src/theme.json'], watchOptions, gulp.series('theme'));
    gulp.watch('src/templates/**/*', watchOptions, gulp.series('templates'));
    gulp.watch('src/js/**/*.js', watchOptions, gulp.series('javascript', gulp.parallel('upload:js:main', 'upload:modules')));
    gulp.watch('src/modules/**/*.js', watchOptions, gulp.series('javascript', gulp.parallel('upload:js:main', 'upload:modules')));
});

// Tâche Build : construit le projet
gulp.task('build', gulp.series('setNotWatching', gulp.parallel('scss', 'modules', 'scss:modules', 'images', 'theme', 'templates', 'javascript')));

// Tâche par défaut : construit le projet et surveille les modifications
gulp.task('default', gulp.series('build', 'watch'));
