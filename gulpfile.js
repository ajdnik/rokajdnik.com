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
		'docs/**'
	]);
});

gulp.task('pack-img', ['clean'], function() {
	return gulp.src(['images/**'])
		.pipe(imagemin())
		.pipe(gulp.dest('docs/images'));
});

gulp.task('pack-js', ['clean'], function () {
	return gulp.src(['js/jquery-3.1.1.min.js', 'js/scripts.js'])
		.pipe(concat('bundle.js'))
		.pipe(minify({
			ext:{
				min:'.js'
			},
			noSource: true
		}))
    .pipe(gulp.dest('docs/js'));
});

gulp.task('pack-css', ['clean'], function () {
	return gulp.src(['css/bootstrap.min.css', 'css/style.css', 'css/responsive.css'])
		.pipe(concat('stylesheet.css'))
		.pipe(cleancss())
		.pipe(uncss({
			html: ['index.html']
		}))
    .pipe(gulp.dest('docs/css'));
});

gulp.task('pack-html', ['clean'], function () {
	return gulp.src(['index.html'])
		.pipe(htmlmin({collapseWhitespace: true}))
		.pipe(gulp.dest('docs'));
});

gulp.task('pack', ['pack-img', 'pack-js', 'pack-css', 'pack-html']);

gulp.task('default', ['clean', 'pack']);
