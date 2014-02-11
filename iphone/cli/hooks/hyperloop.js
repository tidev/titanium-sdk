/**
 * hyperloop symbol de-duplication build script
 *
 * @author Jeff Haynie
 * @date 02/06/2014
 */
var fs = require('fs'),
	path = require('path'),
	os = require('os'),
	exec = require('child_process').exec;

exports.cliVersion = '>=3.2.1';

exports.init = function (logger, config, cli) {

	var cmds,
		archs,
		libfile;

	/**
	 * we need to do this before we actually write out the xcode project file
	 */
	cli.on('build.pre.compile', {
		post: function(data,next) {

			// this hook is only for darwin
			if (os.platform()!='darwin') {
				return next();
			}

			var hlmodules = [],
				nhlmodules = [],
				hash = require('crypto').createHash('sha1');
			
			cmds = [];
			archs = data.architectures.split(' ');

			for (var c=0;c<data.nativeLibModules.length;c++) {
				var m = data.nativeLibModules[c];
				if (m.native && m.manifest.hyperloop=='true') {
					hlmodules.push(m);
					// we hash each module entry so that if any of the 
					// modules change (add/remove,etc) we will rebuild
					// this merged file again
					hash.update(JSON.stringify(m));
					archs.forEach(function(arch){
						var name = path.basename(m.libFile).replace(/\.a$/,arch+'.a');
						cmds.push('/usr/bin/lipo "'+m.libFile+'" -thin '+arch+' -output "'+data.iosBuildDir+'/'+name+'"');
						cmds.push('mkdir '+arch+'; cd '+arch+'; /usr/bin/ar -x "'+data.iosBuildDir+'/'+name+'"');
					});
				}
				else {
					nhlmodules.push(m);
				}
			}
			if (hlmodules.length > 1) {
				// we have hyperloop modules (more than 1), we need to de-dup
				var libid = hash.digest('hex'),
					libname = 'lib'+libid+'.a';

				libfile = path.join(data.iosBuildDir,libname);
				
				// push our fake merged library
				nhlmodules.push({
					libName: libname,
					libFile: libfile,
				});
				data.nativeLibModules = nhlmodules;
			}	
			next();		
		}
	});

	/**
	 * we do this after since we need the project build directory
	 */
	cli.on('build.ios.xcodebuild', {
		pre: function(data,next) {
			if (libfile) {

				// set a pre-processor flag for hyperloop
				var xcode_args = data.args[1];
				xcode_args.forEach(function(arg,index){
					if (/^GCC_PREPROCESSOR_DEFINITIONS/.test(arg)) {
						xcode_args[index] = arg+' HYPERLOOP=1';
					}
				});

				if (fs.existsSync(libfile) && !data.ctx.forceRebuild) {
					return next();	
				}
				
				var savedir = process.cwd(),
					index = 0,
					bldcmd = '/usr/bin/lipo ';

				process.chdir(data.ctx.iosBuildDir);

				archs.forEach(function(arch){
					var name = libfile.replace(/\.a$/,arch+'.a');
					var cmd = 'cd '+arch+'; /usr/bin/ar -r "'+name+'" *.o';
					cmds.push(cmd);
					bldcmd+='"'+name+'" ';
				});

				// create the final lipo that is merged
				bldcmd+=' -create -output "'+libfile+'"';

				cmds.push(bldcmd);

				function processNextCommand(err) {
					if (err) {
						logger.error(err);
						process.exit(1);
					}
					var cmd = cmds[index++];
					if (cmd) {
						logger.debug(cmd);
						exec(cmd,processNextCommand);
					}
					else {
						next();
					}
				}
				return processNextCommand();
			}
			next();
		}
	});

};