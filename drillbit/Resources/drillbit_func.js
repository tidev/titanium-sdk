var TitaniumTest = 
{
	currentTest:null,
	results:[],
	tests:[],
	success:0,
	failed:0,
	totalAssertions:0,
	
	runningTest:function(suite,name)
	{
		//Titanium.App.stdout('DRILLBIT_TEST: '+suite+','+name);
		Titanium.API.debug('DRILLBIT_TEST: '+suite+','+name);
	},
	
	assertion:function(subject)
	{
		//Titanium.App.stdout('DRILLBIT_ASSERTION: ' + TitaniumTest.currentTest + "," + subject.lineNumber);
		Titanium.API.debug('DRILLBIT_ASSERTION: ' + TitaniumTest.currentTest + "," + subject.lineNumber);
		TitaniumTest.totalAssertions++;
	},
	
	testPassed:function(name, lineNumber)
	{
		this.success++;
		this.results.push({
			name:name,
			passed:true,
			message: "Success",
			lineNumber: lineNumber
		});
		//Titanium.App.stdout("DRILLBIT_PASS: "+name);
		Titanium.API.debug("DRILLBIT_PASS: "+name);
		TitaniumTest.run_next_test();
	},
	
	testFailed:function(name,e)
	{
		this.failed++;
		this.results.push({
			name:name,
			passed:false,
			lineNumber:e.line,
			message:e.message || String(e)
		});
		
		//Titanium.App.stdout("DRILLBIT_FAIL: "+name+","+e.line+" --- "+String(e).replace("\n","\\n"));
		Titanium.API.debug("DRILLBIT_FAIL: "+name+","+e.line+" --- "+String(e).replace("\n","\\n"));
		TitaniumTest.run_next_test();
	},
	
	complete: function()
	{
		try
		{
			if (Ti.Platform.name == "android") {
				// we can just save to /sdcard and read it from ADB in android, not sure about iPhone?
				var results_json = Ti.Filesystem.getFile("appdata://" + TitaniumTest.NAME + ".json");
				this.write_results_to_json(results_json);
			}
			/*Titanium.API.info("test complete");
			var results_dir = Titanium.API.getApplication().getArgumentValue('results-dir');
			if (results_dir==null)
			{
				Titanium.API.error("INVALID ARGUMENT VALUE FOUND FOR ARG: results-dir");
			}
			var rd = Titanium.Filesystem.getFile(results_dir);
			if (!rd.exists())
			{
				rd.createDirectory(true);
			}
			var f = Titanium.Filesystem.getFile(rd.nativePath(), TitaniumTest.NAME+'.json');
			this.write_results_to_json(f);

			// Only write the failure report HTML if we have failed -- it's very expensive
			var f = Titanium.Filesystem.getFile(rd.nativePath(), TitaniumTest.NAME+'.html');
			this.write_results_to_single_html(f);
			
			var f = Titanium.Filesystem.getFile(rd.nativePath(), "results.html");
			this.write_results_to_results_html(f);*/
		}
		catch(e)
		{
			Titanium.API.error("Exception on completion: "+e);
		}
		Titanium.API.debug("DRILLBIT_COMPLETE");
	},
	
	write_results_to_json: function(f)
	{
		var data = {
			'results':this.results,
			'count':this.results.length,
			'success':this.success,
			'failed':this.failed,
			'assertions':this.assertions
		};
		f.write(JSON.stringify(data));
	},

	write_results_to_single_html: function(f)
	{
		var text = [];
		text.push("<html><body>");
		text.push("<style>.failed{background-color:yellow;} body {background-color: white;}</style>");
		
		this.get_results_html(text);
		
		text.push("</body></html>");
		f.write(text.join("\n"));
	},
	
	write_results_to_results_html: function(f)
	{
		var text = [];
		this.get_results_html(text);
		
		f.write(text.join("\n"), true);
	},
	
	get_results_html: function(text)
	{
		text.push("<table>");

		text.push("<tr>");
		text.push("<td><b>Test name</b></td>");
		text.push("<td><b>Passed?</b></td>");
		text.push("<td><b>Line number</b></td>");
		text.push("<td><b>Message</b></td>");
		text.push("</tr>");

		var failed = false, failedLines = [];
		for (var i = 0; i < this.results.length; i++)
		{
			var lineno = this.results[i].lineNumber;
			if (!this.results[i].passed)
			{
				failed = true;
				failedLines.push(lineno);
			}

			text.push("<tr>");
			text.push("<td>" + this.results[i].name + "</td>");
			text.push("<td>" + this.results[i].passed + "</td>");
			text.push('<td><a href="#l' + lineno + '">' + lineno + "</a></td>");
			text.push("<td>" + this.results[i].message + "</td>");
			text.push("</tr>");
		}
		text.push("</table>");

		if (failed)
		{
			var app = Titanium.API.getApplication();
			//var script = Titanium.Filesystem.getFile(
			//app.getResourcesPath(), "userscripts", TitaniumTest.NAME + "_driver.js");
			var scriptText = Titanium.Filesystem.getFile(TitaniumTest.SOURCE).read();
			var lines = scriptText.toString().split("\n");

			text.push('<table style="font-family: monospace; font-size: 10pt;">');
			for (var i = 0; i < lines.length; i++)
			{
				var num = i + 1;
				var line = lines[i].replace(/&/g,'&amp;').replace(/>/g,'&gt;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
				var failed = failedLines.indexOf(num)!=-1;
				var cls = failed ? 'failed':'passed';
				text.push('<tr>');
				text.push('<td class="'+cls+'"><a name="l' + num + '">' + num + '</a></td>');
				text.push('<td class="'+cls+'">' + line + '</td>');
				text.push('</tr>');
			}
			text.push("</table>");
		}
	},
	
	on_complete: function()
	{
		this.complete();
	},
	
	run_next_test:function()
	{
		Titanium.API.info("test run_next_test "+this.tests.length);
		if (this.tests.length == 0)
		{
			this.on_complete();
		}
		else
		{
			var t = this.tests.shift();
			t();
		}
	}
};

TitaniumTest.gscope = {};
TitaniumTest.currentSubject = null;

function value_of(obj)
{
	var subject = new TitaniumTest.Subject(obj);
	TitaniumTest.currentSubject = subject;
	return subject;
}

TitaniumTest.Error = function(message,line)
{
	this.message = message;
	this.line = line;
};

TitaniumTest.Error.prototype.toString = function()
{
	return this.message;
};

TitaniumTest.Subject = function(target) {
	this.target = target;
	this.lineNumber = 0;
};

TitaniumTest.Subject.prototype.toString = function()
{
	return 'Subject[target='+this.target+',line='+this.lineNumber+']';
};

TitaniumTest.Scope = function(name) {
	this._testName = name;
	this._completed = false;
	// copy in the global scope
	for (var p in TitaniumTest.gscope)
	{
		this[p] = TitaniumTest.gscope[p];
	}
}

TitaniumTest.Scope.prototype.passed = function()
{
	if (!this._completed)
	{
		this._completed = true;
		if (TitaniumTest.currentSubject)
		{
			TitaniumTest.testPassed(this._testName,TitaniumTest.currentSubject.lineNumber);
		}
		else
		{
			TitaniumTest.testPassed(this._testName,-1);
		}
		TitaniumTest.currentSubject = null;
	}
}

TitaniumTest.Scope.prototype.failed = function(ex)
{
	if (!this._completed)
	{
		this._completed = true;
		TitaniumTest.testFailed(this._testName,ex);
		TitaniumTest.currentSubject = null;
	}
}

TitaniumTest.Subject.prototype.should_be = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	TitaniumTest.assertion(this);
	if (this.target != expected)
	{
		throw new TitaniumTest.Error('should be: "'+expected+'", was: "'+this.target+'"',lineNumber);
	}
};

TitaniumTest.Subject.prototype.should_not_be = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	TitaniumTest.assertion(this);
	if (this.target == expected)
	{
		throw new TitaniumTest.Error('should not be: '+expected+', was: '+this.target,lineNumber);
	}
};

TitaniumTest.Subject.prototype.should_not_be_null = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	TitaniumTest.assertion(this);
	if (this.target === null)
	{
		throw new TitaniumTest.Error('should not be null, was: '+this.target,lineNumber);
	}
};

TitaniumTest.Subject.prototype.should_not_be_undefined = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	TitaniumTest.assertion(this);
	if (this.target === undefined)
	{
		throw new TitaniumTest.Error('should not be undefined, was: '+this.target,lineNumber);
	}
};

TitaniumTest.Subject.prototype.should_be_exactly = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	TitaniumTest.assertion(this);
	if (this.target !== expected)
	{
		throw new TitaniumTest.Error('should be exactly: '+expected+', was: '+this.target,lineNumber);
	}
};

TitaniumTest.Subject.prototype.should_be_null = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	TitaniumTest.assertion(this);
	if (this.target !== null)
	{
		throw new TitaniumTest.Error('should be null, was: '+this.target,lineNumber);
	}
};

TitaniumTest.Subject.prototype.should_be_string = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	TitaniumTest.assertion(this);
	if (typeof this.target !== 'string')
	{
		throw new TitaniumTest.Error('should be string, was: '+typeof(this.target),lineNumber);
	}
};

TitaniumTest.Subject.prototype.should_be_undefined = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	TitaniumTest.assertion(this);
	if (this.target !== undefined)
	{
		throw new TitaniumTest.Error('should be undefined, was: '+this.target,lineNumber);
	}
};


TitaniumTest.Subject.prototype.should_be_function = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	TitaniumTest.assertion(this);
	if (typeof(this.target) != 'function')
	{
		throw new TitaniumTest.Error('should be a function, was: '+typeof(this.target),lineNumber);
	}
};

TitaniumTest.Subject.prototype.should_be_object = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	TitaniumTest.assertion(this);
	if (typeof(this.target) != 'object')
	{
		throw new TitaniumTest.Error('should be a object, was: '+typeof(this.target),lineNumber);
	}
};

TitaniumTest.Subject.prototype.should_be_number = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	TitaniumTest.assertion(this);
	if (typeof(this.target) != 'number')
	{
		throw new TitaniumTest.Error('should be a number, was: '+typeof(this.target),lineNumber);
	}
};

TitaniumTest.Subject.prototype.should_be_boolean = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	TitaniumTest.assertion(this);
	if (typeof(this.target) != 'boolean')
	{
		throw new TitaniumTest.Error('should be a boolean, was: '+typeof(this.target),lineNumber);
	}
};

TitaniumTest.Subject.prototype.should_be_true = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	TitaniumTest.assertion(this);
	if (this.target!==true)
	{
		throw new TitaniumTest.Error('should be true, was: '+this.target,lineNumber);
	}
};

TitaniumTest.Subject.prototype.should_be_false = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	TitaniumTest.assertion(this);
	if (this.target!==false)
	{
		throw new TitaniumTest.Error('should be false, was: '+this.target,lineNumber);
	}
};

TitaniumTest.Subject.prototype.should_be_zero = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	TitaniumTest.assertion(this);
	if (this.target!==0)
	{
		throw new TitaniumTest.Error('should be 0 (zero), was: '+this.target+' ('+typeof(this.target)+')',lineNumber);
	}
};

TitaniumTest.Subject.prototype.should_be_array = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	TitaniumTest.assertion(this);
	// better way to check? we need to support our duck-typing too..
	if (this.target.constructor != Array)
	{
		throw new TitaniumTest.Error('should be an array, was: '+this.target,lineNumber);
	}
};

TitaniumTest.Subject.prototype.should_contain = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	TitaniumTest.assertion(this);
	if (this.target.indexOf(expected)==-1)
	{
		throw new TitaniumTest.Error('should contain: '+expected+', was: '+this.target,lineNumber);
	}
};

TitaniumTest.Subject.prototype.should_be_one_of = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	TitaniumTest.assertion(this);
	if (expected.indexOf(this.target)==-1)
	{
		throw new TitaniumTest.Error('should contain one of: ['+expected.join(",")+'] was: '+this.target,lineNumber);
	}
};

TitaniumTest.Subject.prototype.should_match_array = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	TitaniumTest.assertion(this);
	if (this.target.length && expected.length && this.target.length == expected.length) {
		for (var i = 0; i < expected.length; i++) {
			if (expected[i] != this.target[i]) {
				throw new TitaniumTest.Error('element ' + i + ' should be: '+expected[i]+' was: '+this.target[i],lineNumber);
			}
		}
	}
	else {
		throw new TitaniumTest.Error('array lengths differ, expected: '+expected+', was: '+this.target,lineNumber);
	}
};

TitaniumTest.Subject.prototype.should_be_greater_than = function(expected, lineNumber)
{
	this.lineNumber = lineNumber;
	TitaniumTest.assertion(this);
	if (this.target <= expected)
	{
		throw new TitaniumTest.Error('should be greater than, was ' + this.target + ' <= ' + expected,lineNumber);
	}
};

TitaniumTest.Subject.prototype.should_be_less_than = function(expected, lineNumber)
{
	this.lineNumber = lineNumber;
	TitaniumTest.assertion(this);
	if (this.target >= expected)
	{
		throw new TitaniumTest.Error('should be less than, was ' + this.target + ' >= ' + expected,lineNumber);
	}
};

TitaniumTest.Subject.prototype.should_be_greater_than_equal = function(expected, lineNumber)
{
	this.lineNumber = lineNumber;
	TitaniumTest.assertion(this);
	if (this.target < expected)
	{
		throw new TitaniumTest.Error('should be greater than equal, was ' + this.target + ' < ' + expected,lineNumber);
	}
};

TitaniumTest.Subject.prototype.should_be_less_than_equal = function(expected, lineNumber)
{
	this.lineNumber = lineNumber;
	TitaniumTest.assertion(this);
	if (this.target > expected)
	{
		throw new TitaniumTest.Error('should be greater than, was ' + this.target + ' > ' + expected,lineNumber);
	}
};

TitaniumTest.Subject.prototype.should_throw_exception = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	TitaniumTest.assertion(this);
	if (typeof(this.target) == 'function')
	{
		try {
			this.target();
		} catch (e) { return; }
		throw new TitaniumTest.Error("should throw exception, but didn't",lineNumber);
	}
	else throw new TitaniumTest.Error("should throw exception, but target isn't a function",lineNumber);
};

TitaniumTest.Subject.prototype.should_not_throw_exception = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	TitaniumTest.assertion(this);
	if (typeof(this.target) == 'function')
	{
		try {
			this.target();
		} catch (e) { 
			throw new TitaniumTest.Error("should not throw exception, but did",lineNumber);	
		}
	}
	else throw new TitaniumTest.Error("should not throw exception, but target isn't a function",lineNumber);
};