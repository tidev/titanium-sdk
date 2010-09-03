(function() {
	var Drillbit = function() {
		var TFS = Titanium.Filesystem;
		var TA  = Titanium.App;
		
		this.frontend = null;
		this.auto_close = false;
		this.debug_tests = false;
		this.run_tests_async = false;
		this.window = null;
		
		this.tests = {};
		this.test_names = [];
		this.total_assertions = 0;
		this.total_tests = 0;
		this.total_files = 0;
		this.current_test = null;
		this.tests_started = 0;
		this.test_duration = 0;
		
		var current_test_load = null;
		var excludes = ['before','before_all','after','after_all','timeout'];
		var running_tests = 0;
		var running_completed = 0;
		var running_passed = 0;
		var running_failed = 0;
		var test_failures = false;
		var specific_tests = null;
		var executing_tests = [];
		var current_passed = 0;
		var current_failed = 0;
		var current_timer = 0;
		
		this.results_dir = TFS.getFile(TA.appURLToPath('app://test_results'));
		var app_dir = TFS.getApplicationDirectory();
		var drillbit_funcs = TFS.getFile(TA.appURLToPath('app://drillbit_func.js')).read();
		var user_scripts_dir = null;
		var app = Titanium.API.getApplication();
		var tiapp_backup = null, tiapp = null;
		var manifest_backup = null, manifest = null;
		var non_visual_ti = null;
		var self = this;
		
		var mobile_sdk = null;
		var android_sdk = null;
		for (var i = 0; i < Titanium.App.arguments.length; i++) {
			if (Titanium.App.arguments[i].indexOf('--mobile-sdk=') >= 0) {
				mobile_sdk = Titanium.App.arguments[i].substring('--mobile-sdk='.length);
			} else if (Titanium.App.arguments[i].indexOf('--android-sdk=') >= 0) {
				android_sdk = Titanium.App.arguments[i].substring('--android-sdk='.length);
			}
		}
		
		var android_emulator_process = null;
		var iphone_simulator_process = null;
		
		var resources_dir = app.getResourcesPath();
		var test_harness_dir = TFS.getFile(resources_dir, 'test_harness').nativePath();
		var test_harness_resources_dir = TFS.getFile(test_harness_dir, 'Resources').nativePath();
		var test_harness_id = 'org.appcelerator.titanium.testharness';
		
		var titanium_py = TFS.getFile(mobile_sdk, 'titanium.py').nativePath();
		var android_builder_py = TFS.getFile(mobile_sdk, 'android', 'builder.py').nativePath();
		var wait_for_device_py = TFS.getFile(mobile_sdk, 'android', 'wait_for_device.py').nativePath();
		var python = "python";
		if (Titanium.platform == "win32") {
			python += ".exe";
		}
		var adb = TFS.getFile(android_sdk, 'tools', 'adb').nativePath();
		if (Titanium.platform == "win32") {
			adb += ".exe";
		}
		var drillbit_module = null;
		var test_harness_running = false;
		
		var modules = Titanium.API.getApplication().getModules();
		for (var i = 0; i < modules.length; i++)
		{
			if (modules[i].getName() == "drillbit") {
				drillbit_module = modules[i]; 
				break;
			}
		}
				
		this.getTestHarnessPID = function() {
			var ps_process = Titanium.Process.createProcess([adb, '-e', 'shell', 'ps']);
			var processes = ps_process().toString().split(/\r?\n/);
			
			for (var i = 0; i < processes.length; i++) {
				var columns = processes[i].split(/\s/);
				var pid = columns[1];
				var id = columns[columns.length-1];
				if (id == test_harness_id) {
					return pid;
				}
			}
			return null;
		};
		
		this.isTestHarnessRunning = function() {
			return this.getTestHarnessPID() != null;
		};
		
		this.require = function(app_url) {
			this.include(TA.appURLToPath(app_url));
		};

		this.include = function(path)
		{
			var code = TFS.getFile(path).read();
			try {
				with (this) {
					eval(code.toString());
				}
			} catch (e) {
				Titanium.App.stdout("Error: "+String(e)+", "+path+", line:"+e.line);
			}
		};
		
		this.frontend_do = function()
		{
			try {
				var args = Array.prototype.slice.call(arguments);
			
				var fn_name = args[0];
				args.shift();
			
				if (this.frontend &&
					fn_name in this.frontend && typeof this.frontend[fn_name] == 'function')
				{
					this.frontend[fn_name].apply(this.frontend, args);
				}
			}
			catch (e)
			{
				Titanium.App.stderr("Error: " +e);
			}
		}
		
		function findLine(needle,haystack)
		{
			var lines = haystack.split('\n');
			for (var i = 0; i < lines.length; i++)
			{
				if (needle.test(lines[i]))
				{
					if (/^[\t ]*{[\t ]*$/.test(lines[i+1]))
					{
						//offset by 1 when the bracket is on a seperate line
						// Function.toString show an inline bracket, so we need to compensate
						return i+1;
					}
					return i;
				}
			}
			return -1;
		}
		
		function describe(description,test)
		{
			current_test_load.description = description;
			current_test_load.test = test;
			current_test_load.line_offsets = {};
			current_test_load.timeout = test.timeout || 5000;
			current_test_load.assertions = {};
			current_test_load.assertion_count = 0;
			current_test_load.source_file = TFS.getFile(current_test_load.dir, current_test_load.name+".js");
			var testSource = current_test_load.source_file.read().toString();
			
			for (var p in test)
			{
				if (excludes.indexOf(p)==-1)
				{
					var fn = test[p];
					if (typeof fn == 'function')
					{
						self.total_tests++;
						current_test_load.assertion_count++;
						current_test_load.assertions[p]=false;
						var r = new RegExp(p+" *: *function *\\(");
						current_test_load.line_offsets[p] = findLine(r,testSource);
					}
				}
			}

			self.total_files++;
			current_test_load = null;
		};
		
		this.loadTestFile = function(test_file)
		{
			var name = test_file.name();
			var ext = test_file.extension();
			name = name.replace('.'+ext,'');
			var dir = test_file.parent();
			var jsfile = TFS.getFile(dir,name+'.js');
			if (!jsfile.exists() || dir.name() != name)
			{
				return;
			}
			var entry = this.tests[name];
			if (!entry)
			{
				entry = {name:name,dir:dir};
				this.tests[name] = entry;
				this.test_names.push(name);
			}
			entry[ext] = test_file;
			current_test_load = entry;
			try
			{
				eval(String(jsfile.read()));
			}
			catch(EX)
			{
				this.frontend_do('error', "error loading: "+test_file+". Exception: "+EX+" (line: "+EX.line+")");
			}
		};
		
		this.loadTestDir = function(test_dir)
		{
			var dirname = test_dir.name();
			var test_file = TFS.getFile(test_dir, dirname+".js");
			if (test_file.exists()) {
				this.loadTestFile(test_file);
			}
		};
		
		this.loadTests = function(test_files)
		{
			this.results_dir.createDirectory();

			var f = Titanium.Filesystem.getFile(this.results_dir, "results.html");
			if (f.exists()) {
				f.deleteFile();
			}
		
			for (var c=0;c<test_files.length;c++)
			{
				var file = TFS.getFile(test_files[c]);
				if (file.isDirectory())
				{
					this.loadTestDir(file);
				}
				else
				{
					this.loadTestFile(file);
				}
			}

			this.test_names.sort();
		};
	
		this.setupTestHarness = function(harness_manifest)
		{	
			var self = this;
			function suiteFinished() {
				self.frontend_do('suite_finished', self.current_test.name);
				try
				{
					if (this.window) this.window.clearInterval(current_timer);
					if (!self.current_test.failed)
					{
						var get_results_process = Titanium.Process.createProcess(
							[adb, '-e', 'shell', 'cat', '/sdcard/'+test_harness_id+'/'+self.current_test.name+'.json']);
						var json_data = get_results_process();
						
						var rs = '(' + json_data + ');';
						var results = eval(rs);
						self.current_test.results = results;
						self.frontend_do('test_status', self.current_test.name,results.failed>0?'Failed':'Passed');
						self.frontend_do('update_status', self.current_test.name + ' complete ... '+results.passed+' passed, '+results.failed+' failed');
						if (!test_failures && results.failed>0)
						{
							test_failures = true;
						}
					}
					else
					{
						test_failures = true;
					}
				}
				catch(E)
				{
					self.frontend_do('error', "onexit failure = "+E+" at "+E.line);
				}
				self.run_next_test();	
			}
			
			function isEmulatorRunning() {
				var devices_process = Titanium.Process.createProcess([adb, 'devices']);
				var devices = devices_process();
				if (devices.indexOf('emulator') >= 0) {
					return true;
				}
				return false;
			}
			
			
			var test_harness_tiapp = TFS.getFile(test_harness_dir, 'tiapp.xml');
			if (!test_harness_tiapp.exists()) {
				var create_project_process = Titanium.Process.createProcess([python, titanium_py, 'create', '--platform=iphone,android',
				'--dir='+resources_dir, '--name=test_harness', '--id='+test_harness_id, '--android='+android_sdk]);
			
				create_project_process();
			}
			
			var android_emulator_process = null;
			var emulator_running = isEmulatorRunning();
			if (emulator_running) {
				// just launch logcat on the existing emulator, we need to clear it first though or we get tons of backscroll
				var logcat_clear_process = Titanium.Process.createProcess([adb, '-e', 'logcat', '-c']);
				logcat_clear_process();
				
				android_emulator_process = Titanium.Process.createProcess([adb, '-e', 'logcat'])
				test_harness_running = this.isTestHarnessRunning();
			} else {
				// launch the (si|e)mulator async
				android_emulator_process = Titanium.Process.createProcess([python, android_builder_py,
					'emulator', 'test_harness', android_sdk, test_harness_dir, test_harness_id, '4', 'HVGA']);
			}
			
			android_emulator_process.setOnReadLine(function(data)
			{
				var i = data.indexOf('DRILLBIT_');
				if (i != -1)
				{
					var index = -1;
					if ((index = data.indexOf('DRILLBIT_TEST:')) != -1) {
						var comma = data.indexOf(',', index);
						var suite_name = data.substring(index+15, comma);
						var test_name = data.substring(comma+1);
						self.frontend_do('show_current_test', suite_name, test_name);
						return;
					}
					else if ((index = data.indexOf('DRILLBIT_ASSERTION:')) != -1) {
						var comma = data.indexOf(',', index);
						var test_name = data.substring(index+'DRILLBIT_ASSERTION:'.length+1, comma);
						var line_number = data.substring(comma+1);
						self.total_assertions++;
						self.frontend_do('add_assertion', test_name, line_number);
						return;
					} else if (data.indexOf('DRILLBIT_COMPLETE') != -1) {
						suiteFinished();
					}

					index = data.indexOf("DRILLBIT_PASS");
					if (index == -1) {
						index = data.indexOf("DRILLBIT_FAIL");
					}
					
					if (index != -1) {
						var test_name = data.substring(index+15);
						var test_passed = data.indexOf('_PASS:')!=-1;
						running_completed++;
						if (test_passed) {
							current_passed++; running_passed++;
							self.frontend_do('test_passed', self.current_test.name, test_name);
						}
						else {
							current_failed ++; running_failed++;
							var dashes = test_name.indexOf(" --- ");
							var error = test_name.substring(dashes+5);
							var test_args = test_name.substring(0,dashes).split(',');
							test_name = test_args[0];
							line_number = test_args[1];
							self.frontend_do('test_failed', self.current_test.name, test_name, line_number, error);
						}

						self.frontend_do('total_progress', running_passed, running_failed, self.total_tests);

						var msg = "Completed: " +self.current_test.name + " ... " + running_completed + "/" + running_tests;
						self.frontend_do('update_status', msg);
					}
				}
				else
				{
					//self.frontend_do('process_data', data);
				}
			});
			android_emulator_process.launch();
			// after we launch, double-check that ADB can see the emulator. if it can't we probably need to restart the ADB server
			// ADB will actually see the emulator within a second or two of launching, i pause 5 seconds just in case
			if (this.window) {
				this.window.setTimeout(function() {
					if (!isEmulatorRunning()) {
						Titanium.API.debug("emulator not found by ADB, force-killing the ADB server");
						// emulator not found yet, restart ADB
						var restart_process = Titanium.Process.createProcess([adb, 'kill-server']);
						restart_process();
					}
				}, 5000);
			}
			
			/*var wait_for_device_process = Titanium.Process.createProcess([python, wait_for_device_py, android_sdk, 'emulator', '5']);
			wait_for_device_process.setOnRead(function(e) {
				Titanium.API.debug("wait_for_device: " + e.data.toString());
			});
			wait_for_device_process.setOnExit(function(e) {*/
				
			//});
			
			//wait_for_device_process.launch();
			
			if (!emulator_running) {
				self.frontend_do('status', 'pre-building initial APK');
				var app_js = TFS.getFile(resources_dir, 'app.js');
				var test_app_js = TFS.getFile(test_harness_resources_dir, 'app.js');
				test_app_js.write(app_js.read());

				var prebuild_launch_process = Titanium.Process.createProcess([python, android_builder_py, "simulator", "test_harness", android_sdk, test_harness_dir, test_harness_id, '4', 'HVGA']);
				prebuild_launch_process.setOnExit(function(e) {
					Titanium.API.info("==> Finished waiting for android emualtor to boot");
			
					self.frontend_do('status', 'unlocking android screen...');
					var unlock_screen_apk = TFS.getFile(resources_dir, 'android', 'UnlockScreen', 'bin', 'UnlockScreen.apk');
					var unlock_screen_args = [adb, '-e', 'install', '-r', unlock_screen_apk.nativePath()];
					var unlock_screen_process = Titanium.Process.createProcess(unlock_screen_args);
					Titanium.API.debug(unlock_screen_args)
					unlock_screen_process();
			
					var start_unlock_screen_args = [adb, '-e', 'shell', 'am', 'start', '-n', 'org.appcelerator.titanium/.UnlockScreenActivity'];
					var start_unlock_screen_process = Titanium.Process.createProcess(start_unlock_screen_args);
					Titanium.API.debug(start_unlock_screen_args);
					start_unlock_screen_process();
					
					test_harness_running = true;
					self.frontend_do('status', 'screen unlocked, ready to run tests');
					self.frontend_do('setup_finished');	
				});
				prebuild_launch_process.launch();
			} else {
				self.frontend_do('status', 'ready to run tests');
				self.frontend_do('setup_finished');
			}
		};
	
		this.runTests = function(tests_to_run)
		{
			if (!tests_to_run)
			{
				tests_to_run = [];
				for (var i = 0; i < this.test_names.length; i++)
				{
					tests_to_run.push({suite: this.test_names[i], tests:'all'});
				}
			}
			
			for (var i = 0; i < tests_to_run.length; i++)
			{
				var name = tests_to_run[i].suite;
				var entry = this.tests[name];
				entry.tests_to_run = tests_to_run[i].tests;
				
				executing_tests.push(entry);
				running_tests+=entry.assertion_count;
			}
		
			this.tests_started = new Date().getTime();
			if (this.run_tests_async)
			{
				this.window.setTimeout(function(){self.run_next_test();}, 1);
			}
			else
			{
				this.run_next_test();
			}
		};
	
		this.run_test = function(entry)
		{
			// make sure we cleanup
			/*var list = user_scripts_dir.getDirectoryListing();
			for (var c=0;c<list.length;c++)
			{
				var lf = list[c];
				if (lf.isFile())
				{
					lf.deleteFile();
				}
			}
		
			// we always initially override
			tiapp_backup.copy(tiapp);
			manifest_backup.copy(manifest);

			// make sure we have an index file always
			var tofile = TFS.getFile(dir,'index.html');
			var html = '<html><head><script type="text/javascript"></script></head><body>Running...'+entry.name+'</body></html>';
			tofile.write(html);

			var html_found = false;
			var tiapp_found = false;*/
			function strip_extension(f)
			{
				var name = f.name();
				return name.replace('.'+f.extension(),'');
			}

			var files = entry.dir.getDirectoryListing();
			for (var c=0;c<files.length;c++)
			{
				var src = files[c];
				var same_as_testname = strip_extension(src) == entry.name;
				if (src.name() == entry.name+'.js')
				{
					continue;
				}
				if (same_as_testname)
				{
					var ext = src.extension();
					switch(ext)
					{
						case 'xml':
						{
							tiapp_found=true;
							var srcIn = src.open();
							tiapp.write(srcIn.read());
							srcIn.close();
							break;
						}
						case 'html':
						{
							var tofile = TFS.getFile(test_harness_resources_dir,'index.html');
							src.copy(tofile);
							html_found = true;
							break;
						}
						case 'usjs':
						{
							var tofile = TFS.getFile(user_scripts_dir,entry.name+'.js');
							src.copy(tofile);
							break;
						}
						case 'manifest':
						{
							var tofile = TFS.getFile(app.base,'manifest');
							src.copy(tofile);
							break;
						}
						default:
						{
							// just copy the file otherwise
							Titanium.API.debug("copying "+src+" to "+test_harness_resources_dir);
							src.copy(test_harness_resources_dir);
							break;
						}
					}
				}
				else
				{
					// just copy the file otherwise
					src.copy(test_harness_resources_dir);
				}
			}

			// make it non-visual if no HTML found
			/*if (!html_found && !tiapp_found)
			{
				tiapp.write(non_visual_ti);
			}*/
			
			var file = TFS.getFile(drillbit_module.getPath(), "ejs.js");
			var template = TFS.getFile(drillbit_module.getPath(), "template.js").read().toString();
			
			this.include(file.nativePath());
			//var app_js = TFS.getFile(test_harness_resources_dir, 'app.js');
			var data = {entry: entry, Titanium: Titanium, excludes: excludes};
			var test_script = null;
			
			try {
				test_script = new EJS({text: template, name: "template.js"}).render(data);
			} catch(e) {
				this.frontend_do('error',"Error rendering template: "+e+",line:"+e.line);
			}
			
			//TFS.getFile(module.getPath(),"template_out.js").write(user_script);
			
			// copy the test to the sdcard
			var test_js = TFS.createTempFile();
			test_js.write(test_script);
			var test_js_copy_process = Titanium.Process.createProcess([
				adb, '-e', 'push', test_js.nativePath(), '/sdcard/'+test_harness_id+'/test.js']);
			test_js_copy_process();
			
			var profile_path = TFS.getFile(this.results_dir,entry.name+'.prof');
			var log_path = TFS.getFile(this.results_dir,entry.name+'.log');

			profile_path.deleteFile();
			log_path.deleteFile();

			/*var args = [app.executable.nativePath(), '--profile="'+profile_path+'"']
			args.push('--logpath="'+log_path+'"')
			args.push('--bundled-component-override="'+app_dir+'"')
			args.push('--no-console-logging');
			args.push('--debug');
			if (this.debug_tests) {
				args.push('--attach-debugger');
			}

			args.push('--results-dir="' + this.results_dir + '"');*/

			current_passed = 0;
			current_failed = 0;
			///////////////////////////////////////////
			
			var size = 0;
			current_timer = null;
			var start_time = new Date().getTime();
			var original_time = start_time;

			if (!test_harness_running) {
				var process = Titanium.Process.createProcess([python, android_builder_py, "simulator", "test_harness", android_sdk, test_harness_dir, test_harness_id, '4', 'HVGA']);
				Titanium.App.stdout("running: " + process);
				
				process.setOnExit(function(e) {
					test_harness_running = true;
				});
				process.launch();
			} else {
				// restart the app
				var pid = this.getTestHarnessPID();
				if (pid != null) {
					var kill_process = Titanium.Process.createProcess([adb, '-e', 'shell', 'kill', pid]);
					kill_process();
				}
				
				var start_app_process = Titanium.Process.createProcess([adb, '-e', 'shell', 'am', 'start',
					'-a', 'android.intent.action.MAIN',
					'-c', 'android.intent.category.LAUNCHER',
					'-n', test_harness_id + '/.Test_harnessActivity']);
				start_app_process();
			}
			
			// start a stuck process monitor in which we check the 
			// size of the profile file -- if we're not doing anything
			// we should have a file that hasn't changed in sometime
			// TODO we need a way to monitor from cmdline, though it probably
			// isn't as important there
			if (this.window) {
				/*var self = this;
				current_timer = this.window.setInterval(function()
				{
					var t = new Date().getTime();
					var newsize = profile_path.size();
					var timed_out = (t-original_time) > 40000;
					if (newsize == size || timed_out)
					{
						if (timed_out || t-start_time>=self.current_test.timeout)
						{
							self.window.clearInterval(current_timer);
							self.current_test.failed = true;
							update_status(self.current_test.name + " timed out");
							test_status(self.current_test.name,'Failed');
							//process.terminate();
							return;
						}
					}
					else
					{
						size = newsize;
					}
					start_time = t;
				},1000);*/
			}
		};
	
		this.run_next_test = function()
		{
			if (executing_tests==null || executing_tests.length == 0)
			{
				this.test_duration = (new Date().getTime() - this.tests_started)/1000;
				this.frontend_do('all_finished');
				executing_tests = null;
				this.current_test = null;
				self.frontend_do('update_status', 'Testing complete ... took ' + this.test_duration + ' seconds',true);
				var f = TFS.getFile(this.results_dir,'drillbit.json');
				f.write("{\"success\":" + String(!test_failures) + "}");
				if (self.auto_close)
				{
					Titanium.App.exit(test_failures ? 1 : 0);
				}
				return;
			}
			var entry = executing_tests.shift();
			Titanium.API.debug(" -----> SETTING CURRENT_TEST = " + entry.name);
			this.current_test = entry;
			this.current_test.failed = false;
			self.frontend_do('update_status', 'Executing: '+entry.name+' ... '+running_completed + "/" + running_tests);
			self.frontend_do('suite_started', entry.name);
			this.run_tests_async ? this.window.setTimeout(function(){self.run_test(entry)},1) : this.run_test(entry);
		};
		
		this.reset = function()
		{
			executing_tests = [];
			running_tests = 0;
			running_completed = 0;
			running_passed = running_failed = this.total_assertions = 0;
		}
	};
	
	Titanium.Drillbit = new Drillbit();
})();
