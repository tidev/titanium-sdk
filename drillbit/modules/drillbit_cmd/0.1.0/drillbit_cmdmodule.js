(function(){
	var ti = Titanium;
	var tiFS = ti.Filesystem;
	var print = ti.API.print;
	var println = ti.App.stdout;
	var errPrint = ti.App.stderr;
	
	// Javascript with ANSI color, this might be a first.
	var ansi = (Titanium.platform != "win32" || 'MANPATH' in Titanium.API.getEnvironment());
	var show_log = false;
	
	var frontend = {
		passed: 0, failed: 0, ansi: ansi,
		error: function(msg) {
			errPrint(msg);
		},
		suite_started: function(suite)
		{
			println("Testing suite '" + suite + "'...");
		},
		show_current_test: function(suite, test)
		{
			print("  Running '"+ test + "'...");
		},
		test_passed: function(suite, test)
		{
			if (!this.ansi) println(" passed");
			else println(" [32m[1mpassed[0m");
			this.passed++;
		},
		test_failed: function(suite, test, line_number, error)
		{
			if (!this.ansi) println(" failed");
			else println(" [31m[1mfailed[0m");
			println("   => " + test + "() line " + line_number);
			println("   => " + error);
			this.failed++;
		},
		suite_finished: function(suite)
		{
			println("Finished '" + suite + "'");
		},
		all_finished: function()
		{
			println("Total: " + this.passed + " passed, " + this.failed + " failed, "
				+ ti.Drillbit.total_assertions + " assertions");
			
			if (test_files.length == 1 && show_log)
			{
				var editor = null;
				if (Titanium.platform == "win32") editor = "C:\\Windows\\system32\\notepad.exe";
				else if (Titanium.platform == "osx") editor = "/usr/bin/open";
				else editor = "/usr/bin/gedit";

				if ('EDITOR' in ti.API.getEnvironment())
				{
					editor = ti.API.getEnvironment()['EDITOR'];
				}

				var app = Titanium.API.getApplication();
				var path = ti.App.appURLToPath('app://test_results/'+tests[0].suite+'.log');
				println("opening log: " + path);

				Titanium.Process.createProcess([editor, path])();

			}
		}
	};
	
	var tests = [];
	var test_files = [];
	var load_all = false;
	for (var c=0;c<ti.App.arguments.length;c++)
	{
		var arg = ti.App.arguments[c];
		
		if (arg == '--debug-tests')
		{
			ti.Drillbit.debug_tests = true;
		}
		else if (arg == '--show-log')
		{
			show_log = true;
		}
		else if (arg == '--all')
		{
			load_all = true;
		}
		else
		{
			var tokens = arg.split(':');
			var fname = tokens[0];
			var testname = tokens[1] || null;
			var file = tiFS.getFile(fname);
			
			if (!file.exists())
			{
				var src_file = null;
				if (Titanium.platform=="osx") {
					src_file = tiFS.getFile(ti.API.getApplication().getPath(), '..', '..', "..", "..",
						'apps', 'drillbit', 'Resources', 'tests', fname, fname+'.js');
				} else {
					src_file = tiFS.getFile(ti.API.getApplication().getPath(), '..', "..", "..",
						'apps', 'drillbit', 'Resources', 'tests', fname, fname+'.js');
				}
				if (src_file.exists())
				{
					var t = 'all'
					if (testname != null) t = testname.split(',');
					
					test_files.push(src_file);
					tests.push({'suite':fname, tests:t});
				}
				else errPrint("Warning: " + arg + " doesn't exist, skipping.");
			}
			else
			{
				var suite = file.name().substring(0,file.name().length-3);
				println("Loading suite: " + suite + ", file: " + file.nativePath());
				test_files.push(file);
				tests.push({'suite':suite, tests:'all'});
			}
		}
	}
	
	if (tests.length == 0 && !load_all)
	{
		errPrint("Usage:\n\t drillbit_cmd.py [--all] [--debug-tests] suite[:test_name] [suite2..suiteN]");
		ti.App.exit();
	}
	else {
		ti.Drillbit.frontend = frontend;
		ti.Drillbit.auto_close = true;
		if (load_all)
		{
			var test_dir = tiFS.getFile(ti.App.appURLToPath('app://tests'));
			var dir_list = test_dir.getDirectoryListing();
			ti.Drillbit.loadTests(dir_list);
			for (var c=0;c<ti.Drillbit.test_names.length;c++)
			{
				var suite = ti.Drillbit.test_names[c];
				tests.push({suite: suite, tests:'all'});
			}
		}
		else
		{
			ti.Drillbit.loadTests(test_files);
		}
		
		ti.Drillbit.setupTestHarness(tiFS.getFile(tiFS.getApplicationDirectory(), 'manifest_harness'));
		ti.Drillbit.runTests(tests);
	}
})();