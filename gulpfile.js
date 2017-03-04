var gulp = require('gulp');
var concat = require('gulp-concat');
var minify = require('gulp-minify');
var cleancss = require('gulp-clean-css');
var del = require('del');
var imagemin = require('gulp-imagemin');
var uncss = require('gulp-uncss');
var htmlmin = require('gulp-htmlmin');

gulp.task('clean', function () {
	return del([
		'dist/**'
	]);
});

gulp.task('pack-img', ['clean'], function() {
	return gulp.src(['images/**'])
		.pipe(imagemin())
		.pipe(gulp.dest('dist/images'));
});

gulp.task('pack-js', ['clean'], function () {
	return gulp.src(['js/scripts.js'])
		.pipe(concat('bundle.js'))
		.pipe(minify({
			ext:{
				min:'.js'
			},
			noSource: true
		}))
    .pipe(gulp.dest('dist/js'));
});

gulp.task('pack-css', ['clean'], function () {
	return gulp.src(['css/style.css', 'css/responsive.css'])
		.pipe(concat('stylesheet.css'))
		.pipe(cleancss())
		.pipe(uncss({
			html: ['index.html']
		}))
    .pipe(gulp.dest('dist/css'));
});

gulp.task('pack-html', ['clean'], function () {
	return gulp.src(['index.html'])
		.pipe(htmlmin({collapseWhitespace: true}))
		.pipe(gulp.dest('dist'));
});

gulp.task('pack', ['pack-img', 'pack-js', 'pack-css', 'pack-html']);

gulp.task('default', ['clean', 'pack']);
