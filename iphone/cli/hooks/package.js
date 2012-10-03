/*
 * pacakge.js: Titanium iOS CLI package hook
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	afs = appc.fs,
	path = require('path'),
	parallel = require('async').parallel,
	cp = require('child_process'),
	exec = cp.exec,
	spawn = cp.spawn;

exports.init = function (logger, config, cli) {
	
	cli.addHook('postbuild', {
		priority: 8000,
		post: function (build, finished) {
			if (!/dist-(appstore|adhoc)/.test(cli.argv.target)) return finished();
			
			if (cli.argv['build-only']) {
				logger.info('Performed build only, skipping packaging');
				return finished();
			}
			
			switch (cli.argv.target) {
				case 'dist-appstore':
					logger.info('Packaging for App Store distribution');
					/*
					process.chdir(build.buildDir);
					distribute_xc4(name, applogo, o)
					
					def distribute_xc4(name, icon, log):
						# Locations of bundle, app binary, dsym info
						log.write("Creating distribution for xcode4...\n");	
						timestamp = datetime.datetime.now()
						date = timestamp.date().isoformat()
						time = timestamp.time().strftime('%H-%M-%S')
						archive_name = os.path.join(date,'%s_%s' % (name, time))
						archive_bundle = os.path.join(os.path.expanduser("~/Library/Developer/Xcode/Archives"),"%s.xcarchive" % archive_name)
						archive_app = os.path.join(archive_bundle,"Products","Applications","%s.app" % name)
						archive_dsym = os.path.join(archive_bundle,"dSYM")
						
						# create directories
						if not os.access(archive_bundle, os.F_OK): os.makedirs(archive_bundle)
						if not os.access(archive_app, os.F_OK): os.makedirs(archive_app)
						if not os.access(archive_dsym, os.F_OK): os.makedirs(archive_dsym)
					
						# copy app bundles into the approps. places
						os.system('ditto "%s.app" "%s"' % (name,archive_app))
						os.system('ditto "%s.app.dSYM" "%s"' % (name,archive_dsym))
						
						# plist processing time - this is the biggest difference from XC3.
						archive_info_plist = os.path.join(archive_bundle,'Info.plist')
						log.write("Writing archive plist to: %s\n\n" % archive_info_plist)
						
						# load existing plist values so that we can use them in generating the archive
						# plist
						os.system('/usr/bin/plutil -convert xml1 -o "%s" "%s"' % (os.path.join(archive_bundle,'Info.xml.plist'),os.path.join(archive_app,'Info.plist')))
						project_info_plist = plistlib.readPlist(os.path.join(archive_bundle,'Info.xml.plist'))
						appbundle = "Applications/%s.app" % name
						# NOTE: We chop off the end '.' of 'CFBundleVersion' to provide the 'short' version
						version = project_info_plist['CFBundleVersion']
						app_version_ = version.split('.')
						if(len(app_version_) > 3):
							version = app_version_[0]+'.'+app_version_[1]+'.'+app_version_[2]	
						archive_info = {
							'ApplicationProperties' : {
								'ApplicationPath' : appbundle,
								'CFBundleIdentifier' : project_info_plist['CFBundleIdentifier'],
								'CFBundleShortVersionString' : version,
								'IconPaths' : [os.path.join(appbundle,icon), os.path.join(appbundle,icon)]
							},
							'ArchiveVersion' : float(1),
							'CreationDate' : datetime.datetime.utcnow(),
							'Name' : name,
							'SchemeName' : name
						}
						
						# write out the archive plist and clean up
						log.write("%s\n\n" % archive_info)
						plistlib.writePlist(archive_info,archive_info_plist)
						os.remove(os.path.join(archive_bundle,'Info.xml.plist'))
						
						# Workaround for dumb xcode4 bug that doesn't update the organizer unless
						# files are touched in a very specific manner
						temp = os.path.join(os.path.expanduser("~/Library/Developer/Xcode/Archives"),"temp")
						os.rename(archive_bundle,temp)
						os.rename(temp,archive_bundle)
					
					# open xcode + organizer after packaging
					# Have to force the right xcode open...
					xc_path = run.run(['xcode-select','-print-path'],True,False).rstrip()
					xc_app_index = xc_path.find('/Xcode.app/')
					if (xc_app_index >= 0):
						xc_path = xc_path[0:xc_app_index+10]
					else:
						xc_path = os.path.join(xc_path,'Applications','Xcode.app')
					os.system('open -a %s' % xc_path)
					
					ass = os.path.join(template_dir,'xcode_organizer.scpt')
					cmd = "osascript \"%s\"" % ass
					os.system(cmd)
					*/
					break;
					
				case 'dist-adhoc':
					logger.info('Packaging for Ad Hoc distribution');
					var pkgapp = path.join(build.xcodeEnv.path, 'Platforms', 'iPhoneOS.platform', 'Developer', 'usr', 'bin', 'PackageApplication');
					exec(pkgapp + ' "' + build.xcodeAppDir + '"', function (err, stdout, stderr) {
						if (err) {
							logger.error(__('Failed to package application'));
							stderr.split('\n').forEach(logger.error);
							return finished();
						}
						
						var ipa = path.join(path.dirname(build.xcodeAppDir), build.tiapp.name + '.ipa'),
							dest = ipa;
						
						if (cli.argv['output-dir']) {
							dest = path.join(cli.argv['output-dir'], build.tiapp.name + '.ipa');
							afs.exists(dest) && fs.unlink(dest);
							afs.copyFileSync(ipa, dest, { logger: logger.debug });
						}
						
						logger.info(__('Packaging complete'));
						logger.info(__('Package location: %s', dest.cyan));
						
						finished();
					});
					break;
			}
		}
	});
	
};
