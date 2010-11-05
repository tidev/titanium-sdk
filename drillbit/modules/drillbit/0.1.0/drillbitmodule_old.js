(function() {
	var Ti = Titanium;
	var TFS = Ti.Filesystem;
	var TA  = Ti.App;
	var Drillbit = function() {
		this.frontend = null;
		this.platforms = ['android'];
		this.emulators = {};
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
		var app = Ti.API.getApplication();
		var tiapp_backup = null, tiapp = null;
		var manifest_backup = null, manifest = null;
		var non_visual_ti = null;
		var self = this;
		var drillbit_module = null;
		
		if (Ti.platform == 'osx') {
			this.platforms.push('iphone');
		}
		
		var modules = Ti.API.getApplication().getModules();
		for (var i = 0; i < modules.length; i++)
		{
			if (modules[i].getName() == "drillbit") {
				drillbit_module = modules[i]; 
				break;
			}
		}
		
		this.include = function(path, with_this)
		{
			var code = TFS.getFile(path).read();
			with_this = typeof(with_this) == 'undefined' ? true : with_this;
			try {
				if (with_this) {
					with (this) {
						eval(code.toString());
					}
				} else {
					eval(code.toString());
				}
			} catch (e) {
				Ti.API.error("Error: "+String(e)+", "+path+", line:"+e.line);
			}
		};
		
		this.includeLocal = function(path) {
		    var local_path = TFS.getFile(drillbit_module.getPath(), path).nativePath();
		    this.include(local_path, false);
		};
		
		function join() {
			if (arguments.length == 0) return null;
			return TFS.getFile(Array.prototype.slice.call(arguments)).nativePath();
		}
		
		function dirname(path) {
			return TFS.getFile(path).parent().nativePath();
		}
		
		function basename(path) {
			return TFS.getFile(path).name();
		}
		
		this.includeLocal('optimist.js');
		this.includeLocal('ejs.js');
		
		var mobile_sdk = null;
		var android_sdk = null;
		this.argv = Ti.Optimist.argv;
		if ('mobileSdk' in this.argv) {
			mobile_sdk = this.argv.mobileSdk;
		}
		if ('androidSdk' in this.argv) {
			android_sdk = this.argv.androidSdk;
		}
		if ('platforms' in this.argv) {
			this.platforms = this.argv.platforms.split(',');
		}

		this.mobile_sdk = mobile_sdk;
		var resources_dir = app.getResourcesPath();
		var contents_dir = dirname(resources_dir);
		var test_harness_dir = join(resources_dir, 'test_harness');
		var test_harness_resources_dir = join(test_harness_dir, 'Resources');
		var test_harness_id = 'org.appcelerator.titanium.testharness';
		
		var template = TFS.getFile(drillbit_module.getPath(), "template.js").read().toString();
		var app_template = TFS.getFile(resources_dir, 'app.js').read().toString();
		
		var titanium_py = join(mobile_sdk, 'titanium.py');
		var python = "python";
		if (Ti.platform == "win32") {
			python += ".exe";
		}
		this.python = python;
		
		if (this.platforms.indexOf('android') > -1) {
			this.includeLocal('android.js')
			this.emulators.android = new Drillbit.AndroidEmulator(this, android_sdk);
		}
		if (this.platforms.indexOf('iphone') > -1) {
			this.includeLocal('iphone.js');
			this.emulators.iphone = new Drillbit.iPhoneSimulator(this);
		}
		
		this.getResourcesDir = function() {
			return resources_dir;
		};
		
		this.getTestHarnessDir = function() {
			return test_harness_dir;
		};
		
		this.getTestHarnessResourcesDir = function() {
			return test_harness_resources_dir;
		};
		
		this.getTestHarnessID = function() {
			return test_harness_id;
		};
		
		this.createPythonProcess = function(args) {
			return Ti.Process.createProcess([this.python].concat(args));
		};
		
		this.require = function(app_url) {
			this.include(TA.appURLToPath(app_url));
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
				Ti.App.stderr("Error: " +e);
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
				Ti.API.info("found test: " + name + ", dir: " + dir);
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

			var f = Ti.Filesystem.getFile(this.results_dir, "results.html");
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
		
		this.suiteFinished = function(platform) {
			this.frontend_do('suite_finished', this.current_test.name);
			try
			{
				if (this.window) this.window.clearInterval(current_timer);
				if (!this.current_test.failed)
				{
					var testName = this.current_test.name;
					var results = this.emulators[platform].getResults(testName);
					var status = results.failed > 0 ? 'Failed' : 'Passed';
					
					this.current_test.results = results;
					this.frontend_do('test_status', testName, status, platform);
					this.frontend_do('update_status', testName + ' complete ... ' + results.passed + ' passed, ' + results.failed + ' failed');
					if (!test_failures && results.failed > 0)
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
				this.frontend_do('error', "onexit failure = "+E+" at "+E.line);
			}
			this.run_next_test();
		}
		
		this.readLine = function(platform, data)
		{
			var i = data.indexOf('DRILLBIT_');
			if (i != -1)
			{
				var index = -1;
				if ((index = data.indexOf('DRILLBIT_TEST:')) != -1) {
					var comma = data.indexOf(',', index);
					var suite_name = data.substring(index+15, comma);
					var test_name = data.substring(comma+1);
					this.frontend_do('show_current_test', suite_name, test_name);
					return;
				}
				else if ((index = data.indexOf('DRILLBIT_ASSERTION:')) != -1) {
					var comma = data.indexOf(',', index);
					var test_name = data.substring(index+'DRILLBIT_ASSERTION:'.length+1, comma);
					var line_number = data.substring(comma+1);
					this.total_assertions++;
					this.frontend_do('add_assertion', test_name, line_number);
					return;
				} else if (data.indexOf('DRILLBIT_COMPLETE') != -1) {
					this.suiteFinished(platform);
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
						this.frontend_do('test_passed', this.current_test.name, test_name, platform);
					}
					else {
						current_failed ++; running_failed++;
						var dashes = test_name.indexOf(" --- ");
						var error = test_name.substring(dashes+5);
						var test_args = test_name.substring(0,dashes).split(',');
						test_name = test_args[0];
						line_number = test_args[1];
						Ti.API.debug('test failed: ' + test_name + ' line ' + line_number + ', error: ' + error + ', suite: '+this.current_test.name);
						this.frontend_do('test_failed', this.current_test.name, test_name, line_number, error, platform);
					}

					this.frontend_do('total_progress', running_passed, running_failed, this.total_tests);

					var msg = "Completed: " +this.current_test.name + " ... " + running_completed + "/" + running_tests;
					this.frontend_do('update_status', msg);
				}
			}
			else
			{
				this.frontend_do('process_data', data);
			}
		};
		
		this.setupTestHarness = function(harness_manifest)
		{	
			var self = this;
			var test_harness_tiapp = TFS.getFile(test_harness_dir, 'tiapp.xml');
			if (!test_harness_tiapp.exists()) {
				var create_project_process = Ti.Process.createProcess([python, titanium_py, 'create', '--platform=iphone,android',
				'--dir='+resources_dir, '--name=test_harness', '--id='+test_harness_id, '--android='+android_sdk]);
			
				create_project_process();
			}
			
			var test_js_includes = {};
			Object.keys(this.emulators).forEach(function(platform) {
				test_js_includes[platform] = self.emulators[platform].getTestJSInclude();
			});
			
			var app_js_file = TFS.getFile(resources_dir, 'app.js');
			var data = {test_js_includes: test_js_includes};
			var app_js = null;
			try {
				app_js = new EJS({text: app_template, name: "app.js"}).render(data);
			} catch(e) {
				this.frontend_do('error',"Error rendering template: "+e+",line:"+e.line);
			}
			
			TFS.getFile(test_harness_resources_dir, 'app.js').write(app_js);
			TFS.getFile(resources_dir, 'test_harness_console.html').copy(test_harness_resources_dir);
			TFS.getFile(contents_dir, 'tiapp_harness.xml').copy(test_harness_tiapp);
			
			this.platforms.forEach(function(platform) {
				var emulator = self.emulators[platform];
				if (!emulator) return;
				
				emulator.run(function(data) {
					self.readLine(platform, data);
				});
			});
		};
	
		this.runTests = function(tests_to_run)
		{
			if (!tests_to_run)
			{
				tests_to_run = [];
				for (var i = 0; i < this.test_names.length; i++)
				{
					tests_to_run.push({suite: this.test_names[i], tests:'all', platforms: this.platforms});
				}
			}
			
			for (var i = 0; i < tests_to_run.length; i++)
			{
				var name = tests_to_run[i].suite;
				var entry = this.tests[name];
				entry.tests_to_run = tests_to_run[i].tests;
				entry.platforms = tests_to_run[i].platforms;
				
				executing_tests.push(entry);
				running_tests += entry.assertion_count;
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
		
		this.stageTest = function(entry) {
			var files = entry.dir.getDirectoryListing();
			files.forEach(function(src) {
				var same_as_testname = stripExtension(src) == entry.name;
				if (src.name() == entry.name+'.js') {
					continue;
				}
			});
		};
		
		this.runTest = function(entry)
		{
			
			
			var data = {entry: entry, Titanium: Titanium, excludes: excludes, Drillbit: this};
			var test_script = null;
			
			try {
				test_script = new EJS({text: template, name: "template.js"}).render(data);
			} catch(e) {
				this.frontend_do('error',"Error rendering template: "+e+",line:"+e.line);
			}
			

			var self = this;
			Object.keys(this.emulators).forEach(function(platform) {
				self.emulators[platform].pushTestJS(test_script);
			});
			
			var profile_path = TFS.getFile(this.results_dir,entry.name+'.prof');
			var log_path = TFS.getFile(this.results_dir,entry.name+'.log');

			profile_path.deleteFile();
			log_path.deleteFile();
			current_passed = 0;
			current_failed = 0;
			
			var size = 0;
			current_timer = null;
			var start_time = new Date().getTime();
			var original_time = start_time;

			entry.platforms.forEach(function(platform) {
				var emulator = self.emulators[platform];
				if (!emulator) return;
				
				self.frontend_do('suite_platform_started', entry.name, platform);
				emulator.runTestHarness();
			});
			
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
				this.frontend_do('update_status', 'Testing complete ... took ' + this.test_duration + ' seconds',true);
				var f = TFS.getFile(this.results_dir,'drillbit.json');
				f.write("{\"success\":" + String(!test_failures) + "}");
				if (this.auto_close)
				{
					Ti.App.exit(test_failures ? 1 : 0);
				}
				return;
			}
			var entry = executing_tests.shift();
			this.current_test = entry;
			this.current_test.failed = false;
			this.frontend_do('update_status', 'Executing: '+entry.name+' ... '+running_completed + "/" + running_tests);
			this.frontend_do('suite_started', entry.name, entry.platforms);
			var self = this;
			this.run_tests_async ? this.window.setTimeout(function(){self.runTest(entry)},1) : this.runTest(entry);
		};
		
		this.reset = function()
		{
			executing_tests = [];
			running_tests = 0;
			running_completed = 0;
			running_passed = running_failed = this.total_assertions = 0;
		}
	};
	
	Ti.Drillbit = new Drillbit();
})();
