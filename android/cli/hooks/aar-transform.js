var AarTransformer = require('appc-aar-transform');
var async = require('async');
var fs = require('fs');
var path = require('path');

exports.cliVersion = '>=3.2';

exports.init = function (logger, config, cli) {
	cli.on('build.module.pre.compile', {
		post: function (builder, callback) {
			var foundAndroidArchives = [];
			var aarOutputPath = path.join(builder.buildDir, 'intermediates/exploded-aar');
			var assetsDestinationPath = path.join(builder.buildDir, 'intermediates/assets');
			var libraryDestinationPath = path.join(builder.buildDir, 'intermediates/lib');
			var sharedLibraryDestinationPath = path.join(builder.buildGenJniLocalDir, 'jni');
			var transformer = new AarTransformer(logger);
			fs.readdirSync(builder.projLibDir).forEach(function(file) {
				if (/\.aar/.test(file)) {
					foundAndroidArchives.push(path.join(builder.projLibDir, file));
				}
			});
			logger.trace('Pre-compile hook: Transforming bundled .aar libraries');
			async.each(foundAndroidArchives, function(aarPathAndFilename, next) {
				transformer.transform({
					aarPathAndFilename: aarPathAndFilename,
					outputPath: aarOutputPath,
					assetsDestinationPath: assetsDestinationPath,
					libraryDestinationPath: libraryDestinationPath,
					sharedLibraryDestinationPath: sharedLibraryDestinationPath
				}, function(err, result) {
					if (err) {
						return next(err);
					}

					result.jars.forEach(function(jarPathAndFilename) {
						builder.classPaths[jarPathAndFilename] = 1;
					});
					builder.extraPackages[result.packageName] = 1;

					next();
				});
			}, callback);
		}
	});
};
