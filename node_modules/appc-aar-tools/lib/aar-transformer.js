/* jshint node: true, esversion: 6 */
'use strict';

var async = require('async');
var DOMParser = require('xmldom').DOMParser;
var extract = require('extract-zip');
var find = require('findit2');
var fs = require('fs-extra');
var path = require('path');

var TransformationResult = require('./transformation-result');

var noop = function() {};

/**
 * A transformer for Android Archive artifacts
 */
class AarTransformer {
  /**
   * Constructs a new AAR transformer
   *
   * Uses constructor injection for an optional appc-logger instance
   *
   * @param {Object} logger Instance of an appc-logger (optional)
   */
  constructor(logger) {
    if (logger) {
      this.logger = logger;
    } else {
      this.logger = {
        debug: noop,
        trace: noop
      };
    }
  }

  /**
   * Transforms an Android Archive file using the given options.
   *
   * @param {Object} object Options object
   * @param {Function} callback Callback function
   */
  transform(options, callback) {
    this.reset();

    this.logger.debug('AAR transform options: %s', JSON.stringify(options, null, 2));

    async.series([
      async.apply(this.validateAndApplyOptions.bind(this), options),
      (next) => {
        this.logger.trace('Start processing: %s', this.aarBasename + '.aar');
        next();
      },
      this.extractAndroidArchive.bind(this),
      (next) => {
        async.parallel([
          this.identifyPackageName.bind(this),
          this.registerAndCopyLibraries.bind(this),
          this.copyAssets.bind(this),
          this.copySharedLibraries.bind(this)
        ], next);
      },
      (next) => {
        this.logger.trace('Done processing: %s', this.aarBasename + '.aar');
        next();
      },
    ], (err) => {
      callback(err, this.result);
    });
  }

  /**
   * Resets this transformer for a new transform task.
   */
  reset() {
    this.result = new TransformationResult();
    this.aarPathAndFilename = null;
    this.outputPath = null;
    this.assetsDestinationPath = null;
    this.libraryDestinationPath = null;
    this.sharedLibraryDestinationPath = null;
  }

  /**
   * Validates and applies the values of the given options objects to the
   * transformers own properties.
   *
   * @param {Object} options Options object
   * @param {function} next Callback function
   */
  validateAndApplyOptions(options, next) {
    var requiredOptions = ['aarPathAndFilename', 'outputPath'];
    requiredOptions.forEach((optionName) => {
      if (!options[optionName]) {
        return next(new Error(requiredOptions.join(', ') + ' are required to start the AAR transform.'));
      }
    });

    this.aarPathAndFilename = options.aarPathAndFilename;
    if (!fs.existsSync(this.aarPathAndFilename)) {
      return next(new Error('The file ' + this.aarFile + ' does not exists.'));
    }
    this.aarBasename = path.basename(this.aarPathAndFilename, '.aar');
    this.outputPath = path.join(options.outputPath, this.aarBasename);
    this.assetsDestinationPath = options.assetsDestinationPath ? options.assetsDestinationPath : null;
    this.libraryDestinationPath = options.libraryDestinationPath ? options.libraryDestinationPath : null;
    this.sharedLibraryDestinationPath = options.sharedLibraryDestinationPath ? options.sharedLibraryDestinationPath : null;
    next();
  }

  /**
   * Extracts the android archive file.
   *
   * @param {Function} next Callback function
   */
  extractAndroidArchive(next) {
    this.logger.debug('Extracting: %s => %s', this.aarPathAndFilename, this.outputPath);
    fs.emptyDirSync(this.outputPath);
    extract(this.aarPathAndFilename, {dir: this.outputPath}, next);
  }

  /**
   * Extracts the package name from the module manifest and stores it in the
   * transformation result.
   *
   * @param {Function} next Callback function
   */
  identifyPackageName(next) {
    var manifestFile = path.join(this.outputPath, 'AndroidManifest.xml');
    var contents = fs.readFileSync(manifestFile).toString();
    var doc = new DOMParser().parseFromString(contents, 'text/xml').documentElement;
    this.result.packageName = doc.getAttribute('package');
    this.logger.trace('Package name is: %s', this.result.packageName);
    next();
  }

  /**
   * Registers all found .jar files in the result, optionally copying them to a
   * new destination.
   *
   * @param {Function} next Callback function
   */
  registerAndCopyLibraries(next) {
    var mainJarPathAndFilename = path.join(this.outputPath, 'classes.jar');
    this.logger.trace('Adding main JAR to list: %s', mainJarPathAndFilename);
    this.result.addJar(mainJarPathAndFilename);
    if (this.libraryDestinationPath !== null) {
      var dest = path.join(this.libraryDestinationPath, this.aarBasename + '.jar');
      fs.copySync(mainJarPathAndFilename, dest);
    }

    var libraryPath = path.join(this.outputPath, 'libs');
    if (!fs.existsSync(libraryPath)) {
      return next();
    }
    find(libraryPath)
      .on('file', (file, stat) => {
        if (path.extname(file) !== '.jar') {
          return;
        }

        this.logger.trace('Adding additional JAR to list: %s', file);
        this.result.addJar(file);

        if (this.libraryDestinationPath === null) {
          return next();
        }
        var dest = path.join(this.libraryDestinationPath, path.relative(libraryPath, file));
        fs.ensureDirSync(path.dirname(dest));
        this.logger.debug('Copying: %s => %s', file, dest);
        fs.copySync(file, dest, {logger: this.logger});
      })
      .on('end', next);
  }

  /**
   * Copies any assets found in the archive to a new destination.
   *
   * This will only be done when assetsDestinationPath is specified.
   *
   * @param {Function} next Callback function
   */
  copyAssets(next) {
    if (this.assetsDestinationPath === null) {
      return next();
    }
    var src = path.join(this.outputPath, 'assets');
    if (!fs.existsSync(src)) {
      return next();
    }
    this.logger.debug('Copying: %s => %s', src, this.assetsDestinationPath);
    fs.copy(src, this.assetsDestinationPath, next);
  }

  /**
   * Copies any shared libraries found in the archive to a new destination.
   *
   * This will only be done when sharedLibraryDestinationPath is specified.
   *
   * @param {Function} next Callback function
   */
  copySharedLibraries(next) {
    if (this.sharedLibraryDestinationPath === null) {
      return next();
    }
    var jniPath = path.join(this.outputPath, 'jni');
    if (!fs.existsSync(jniPath)) {
      return next();
    }

    find(jniPath)
      .on('file', (file, stat) => {
        if (path.extname(file) !== '.so') {
          return;
        }
        var dest = path.join(this.sharedLibraryDestinationPath, path.relative(jniPath, file));
        fs.ensureDirSync(path.dirname(dest));
        this.logger.debug('Copying: %s => %s', file, dest);
        fs.copySync(file, dest);
      })
      .on('end', next);
  }
}

module.exports = AarTransformer;
