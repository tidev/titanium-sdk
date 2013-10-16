/*
 * package_wp8.js: Titanium Mobile Web CLI library for packaging in a Windows Phone 8 app
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var path = require('path'),
	fs = require('fs'),
	wrench = require('wrench'),
	ejs = require('ejs'),
	uuid = require('node-uuid');

exports.cliVersion = '>=3.X';

exports.init = function (logger, config, cli) {

	cli.addHook('build.post.compile', {
		priority: 8000,
		post: function (build, finished) {
			if (cli.argv.target != 'wp8') {
				finished();
				return;
			}
			var source = path.resolve(build.buildDir),
				destination = path.resolve(path.join(source, '..', 'mobileweb-wp8')),
				tiapp = build.tiapp,
				templateData = {
					projectName: tiapp.name,
					projectVersion: tiapp.version,
					projectGUID: tiapp.guid,
					publisherGUID: cli.argv['wp8-publisher-guid'],
					company: 'not specified', // Hopefully we can support this some day
					projectDescription: tiapp.description,
					author: tiapp.publisher,
					copyright: tiapp.copyright
				};
			console.log(templateData);
			return finished();
			/*var templateDir = path.join(__dirname, '..', '..', 'templates', 'packages', 'wp8'),
				filenameReplacementRegex = /\{\{ProjectName\}\}/g,
				templateFiles = [
					'{{ProjectName}}.sln',
					path.join('{{ProjectName}}', '{{ProjectName}}.csproj'),
					path.join('{{ProjectName}}', 'MainPage.xaml'),
					path.join('{{ProjectName}}', 'MainPage.xaml.cs'),
					path.join('{{ProjectName}}', 'LocalizedStrings.cs'),
					path.join('{{ProjectName}}', 'App.xaml'),
					path.join('{{ProjectName}}', 'App.xaml.cs'),
					path.join('{{ProjectName}}', 'Resources', 'AppResources.Designer.cs'),
					path.join('{{ProjectName}}', 'Properties', 'AssemblyInfo.cs'),
					path.join('{{ProjectName}}', 'Properties', 'WMAppManifest.xml')
				];*/

			// Validate the optional and internal template information
			/*templateData.assemblyGUID = uuid.v4();
			templateData.copyright = templateData.copyright || 'Copyright © 2013';
			templateData.company = templateData.company || '';
			templateData.projectDescription = templateData.projectDescription || '';

			// Create the destination folder if it doesn't exist
			if (!fs.existsSync(destination)) {
				wrench.mkdirSyncRecursive(destination);
			}

			// Copy the template files over
			wrench.readdirSyncRecursive(templateDir).forEach(function (file) {
				var sourcePath = path.join(templateDir, file),
					sourceData,
					destinationPath = path.join(destination,
						file.replace(filenameReplacementRegex, templateData.projectName || 'Project'));

				// If this is a folder, just create the destination folder directly
				if (fs.statSync(sourcePath).isDirectory()) {
					wrench.mkdirSyncRecursive(destinationPath);
				} else {
					// Otherwise, run the file through EJS if it needs to be templated, else just copy it
					sourceData = fs.readFileSync(sourcePath);
					if (templateFiles.indexOf(file) != -1) {
						fs.writeFileSync(destinationPath, ejs.render(sourceData.toString(), templateData));
					} else {
						fs.writeFileSync(destinationPath, sourceData);
					}
				}
			});*/
		}
	});
};
/*
exports.package('', 'C:\\Users\\Bryan\\Downloads\\Temp', {
	projectName: 'Foo',
	projectVersion: '0.1.0',
	projectGUID: '7ec15836-2b90-4fb0-9562-a289e61b482d',
	publisherGUID: '78f61323-e27b-4511-a556-98da1df024a4',
	company: 'Appcelerator',
	projectDescription: 'A test app',
	author: 'Bryan Hughes',
	copyright: 'Copyright 2013'
});
*/