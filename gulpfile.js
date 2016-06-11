'use strict';

var async = require('async');
var browserify = require('browserify');
var buffer = require('gulp-buffer');
var del = require('del');
var gulp = require('gulp');
var header = require('gulp-header');
var istanbul = require('gulp-istanbul');
var jshint = require('gulp-jshint');
var mocha  = require('gulp-mocha');
var pkg = require('./package');
var source = require('vinyl-source-stream');
// Browser Unit Tests
var Karma = require('karma').Server;
var karmaConfig = require('./karma.conf');
var assign = require('object.assign');
var connect = require('gulp-connect');
var cors = require('connect-cors');

// This is a workaround for this bug...https://github.com/feross/buffer/issues/79 
// Please refactor this, when the bug is resolved!
// PS: you need to depend on buffer@3.4.3
var OldBuffer = require.resolve('buffer/');
var builtinsOverride = require('browserify/lib/builtins');
builtinsOverride.buffer = OldBuffer;

var banner = ['/**',
  ' * <%= pkg.name %> - <%= pkg.description %>',
  ' * @version v<%= pkg.version %>',
  ' * @link <%= pkg.homepage %>',
  ' * @license <%= pkg.license %>',
  ' */',
  ''].join('\n');
var basename = 'swagger-client';
var paths = {
  sources: ['index.js', 'lib/**/*.js'],
  tests: ['test/*.js', 'test/compat/*.js', 'test/both/*.js'],
  dist: 'browser'
};

paths.all = paths.sources.concat(paths.tests).concat(['gulpfile.js']);

gulp.task('clean', function (cb) {
  del([
    paths.dist + '/' + basename + '.*',
    'coverage',
    'test/browser/' + basename + '-browser-tests.js'
  ], cb);
});

gulp.task('lint', function () {
  return gulp
    .src(paths.all)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('coverage', function () {
  process.env.NODE_ENV = 'test';

  return gulp
    .src(paths.sources)
    .pipe(istanbul({includeUntested: true}))
    .pipe(istanbul.hookRequire()) // Force `require` to return covered files
    .on('finish', function () {
      gulp
        .src(paths.tests)
        .pipe(mocha({reporter: 'spec'}))
        .pipe(istanbul.writeReports());
    });
});

gulp.task('build', function (cb) {
  // Builds  browser binaries:
  //
  // 1 (swagger-client.js): Standalone build without uglification and including source maps
  // 2 (swagger-client.min.js): Standalone build uglified and without source maps

  async.map([0,1], function (n, callback) {
    var useDebug = n % 2 === 0;
    var b = browserify('./index.js', {
      debug: useDebug,
      builtins: builtinsOverride,
      standalone: 'SwaggerClient'
    });

    if (!useDebug) {
      b.transform({global: true}, 'uglifyify');
    }

    b.transform('brfs')
      .bundle()
      .pipe(source(basename + (!useDebug ? '.min' : '') + '.js'))
      .pipe(buffer())
      .pipe(header(banner, {pkg: pkg}))
      .pipe(gulp.dest('./browser/'))
      .on('error', function (err) {
        callback(err);
      })
      .on('end', function () {
        callback();
      });
  }, function (err) {
    cb(err);
  });
});

gulp.task('test', function () {
  process.env.NODE_ENV = 'test';
  return gulp
    .src(paths.tests)
    .pipe(mocha({reporter: 'spec'}))
    .on('error', console.log);
});

gulp.task('watch', ['test'], function () {
  gulp.watch(paths.all, ['test']);
});

gulp.task('watch:build', ['build'], function() {
  gulp.watch(paths.all, ['build']);
});

gulp.task('browsertest', function(done) {
  new Karma(karmaConfig, done).start();
});

gulp.task('connect', function () {
  connect.server({
    livereload: false,
    root: __dirname + '/test/spec/v2',
    port: 8000,
    middleware: function (a,b) {
      return [ cors(a,b) ];
    }
  });
});

gulp.task('watch-browsertest', function(done){
  var opts = assign({}, karmaConfig, {singleRun: false});
  new Karma(opts, done).start();
});


gulp.task('default', ['clean', 'lint', 'test', 'build']);
