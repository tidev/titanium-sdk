/**
 * Appcelerator Drillbit
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var DrillbitTest = 
{
	currentTest:null,
	results:[],
	tests:[],
	success:0,
	failed:0,
	totalAssertions:0,
	
	fireEvent: function(name, event) {
		event.name = name;
		event.suite = DrillbitTest.NAME;
		Titanium.API.debug('DRILLBIT_EVENT: ' + JSON.stringify(event));
	},
	
	runningTest: function(suite, name)
	{
		this.fireEvent('test', {test: name});
		appendMessage("> running test <span class=\"test\">" + name + "</span> in suite <span class=\"suite\">" + suite + "</span>");
	},
	
	assertion: function(subject)
	{
		this.fireEvent('assertion', {test: DrillbitTest.currentTest, lineNumber: subject.lineNumber});
		DrillbitTest.totalAssertions++;
	},
	
	testPassed: function(name, lineNumber)
	{
		this.success++;
		this.results.push({
			name:name,
			passed:true,
			message: "Success",
			lineNumber: lineNumber
		});
		this.fireEvent('testStatus', {test: name, lineNumber: lineNumber, passed: true, error: null});
		appendMessage('>> test <span class=\"test\">' + name + '</span> passed', 'pass');
		DrillbitTest.runNextTest();
	},
	
	testFailed: function(name,e)
	{
		this.failed++;
		this.results.push({
			name:name,
			passed:false,
			lineNumber:e.line,
			message:e.message || String(e)
		});
		
		var errorMessage = String(e).replace("\n","\\n");
		this.fireEvent('testStatus', {test: name, lineNumber: e.line, passed: false, error: errorMessage});
		
		appendMessage('>> test <span class=\"test\">' + name + '</span> failed: line ' + e.line + ", error: " + errorMessage, 'fail');
		DrillbitTest.runNextTest();
	},
	
	complete: function() {
		try {
			// we print the stringified result back over the process
			// this lets us be platform/simulator/device independent (in theory)
			this.fireEvent("complete", this.getResults());
		} catch (e) {
			Titanium.API.error("Exception on completion: "+e);
		}
	},
	
	getResults: function()
	{
		return {
			'results':this.results,
			'count':this.results.length,
			'success':this.success,
			'failed':this.failed,
			'assertions':this.assertions
		};
	},
	
	onComplete: function() {
		this.complete();
	},
	
	runNextTest: function() {
		if (this.tests.length == 0) {
			this.complete();
		} else {
			var t = this.tests.shift();
			t();
		}
	}
};

DrillbitTest.gscope = {};
DrillbitTest.currentSubject = null;

function valueOf(obj)
{
	var subject = new DrillbitTest.Subject(obj);
	DrillbitTest.currentSubject = subject;
	return subject;
}

DrillbitTest.Error = function(message,line)
{
	this.message = message;
	this.line = line;
};

DrillbitTest.Error.prototype.toString = function()
{
	return this.message;
};

DrillbitTest.Subject = function(target) {
	this.target = target;
	this.lineNumber = 0;
};

DrillbitTest.Subject.prototype.toString = function()
{
	return 'Subject[target='+this.target+',line='+this.lineNumber+']';
};

DrillbitTest.Scope = function(name) {
	this._testName = name;
	this._completed = false;
	// copy in the global scope
	for (var p in DrillbitTest.gscope)
	{
		this[p] = DrillbitTest.gscope[p];
	}
}

DrillbitTest.Scope.prototype.passed = function()
{
	if (!this._completed)
	{
		this._completed = true;
		if (DrillbitTest.currentSubject)
		{
			DrillbitTest.testPassed(this._testName,DrillbitTest.currentSubject.lineNumber);
		}
		else
		{
			DrillbitTest.testPassed(this._testName,-1);
		}
		DrillbitTest.currentSubject = null;
	}
}

DrillbitTest.Scope.prototype.failed = function(ex)
{
	if (!this._completed)
	{
		this._completed = true;
		DrillbitTest.testFailed(this._testName,ex);
		DrillbitTest.currentSubject = null;
	}
}

DrillbitTest.Subject.prototype.shouldBe = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	DrillbitTest.assertion(this);
	if (this.target != expected)
	{
		throw new DrillbitTest.Error('should be: "'+expected+'", was: "'+this.target+'"',lineNumber);
	}
};

DrillbitTest.Subject.prototype.shouldNotBe = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	DrillbitTest.assertion(this);
	if (this.target == expected)
	{
		throw new DrillbitTest.Error('should not be: '+expected+', was: '+this.target,lineNumber);
	}
};

DrillbitTest.Subject.prototype.shouldNotBeNull = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	DrillbitTest.assertion(this);
	if (this.target === null)
	{
		throw new DrillbitTest.Error('should not be null, was: '+this.target,lineNumber);
	}
};

DrillbitTest.Subject.prototype.shouldNotBeUndefined = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	DrillbitTest.assertion(this);
	if (this.target === undefined)
	{
		throw new DrillbitTest.Error('should not be undefined, was: '+this.target,lineNumber);
	}
};

DrillbitTest.Subject.prototype.shouldBeExactly = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	DrillbitTest.assertion(this);
	if (this.target !== expected)
	{
		throw new DrillbitTest.Error('should be exactly: '+expected+', was: '+this.target,lineNumber);
	}
};

DrillbitTest.Subject.prototype.shouldBeNull = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	DrillbitTest.assertion(this);
	if (this.target !== null)
	{
		throw new DrillbitTest.Error('should be null, was: '+this.target,lineNumber);
	}
};

DrillbitTest.Subject.prototype.shouldBeString = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	DrillbitTest.assertion(this);
	if (typeof this.target !== 'string')
	{
		throw new DrillbitTest.Error('should be string, was: '+typeof(this.target),lineNumber);
	}
};

DrillbitTest.Subject.prototype.shouldBeUndefined = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	DrillbitTest.assertion(this);
	if (this.target !== undefined)
	{
		throw new DrillbitTest.Error('should be undefined, was: '+this.target,lineNumber);
	}
};


DrillbitTest.Subject.prototype.shouldBeFunction = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	DrillbitTest.assertion(this);
	if (typeof(this.target) != 'function')
	{
		throw new DrillbitTest.Error('should be a function, was: '+typeof(this.target),lineNumber);
	}
};

DrillbitTest.Subject.prototype.shouldBeObject = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	DrillbitTest.assertion(this);
	if (typeof(this.target) != 'object')
	{
		throw new DrillbitTest.Error('should be a object, was: '+typeof(this.target),lineNumber);
	}
};

DrillbitTest.Subject.prototype.shouldBeNumber = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	DrillbitTest.assertion(this);
	if (typeof(this.target) != 'number')
	{
		throw new DrillbitTest.Error('should be a number, was: '+typeof(this.target),lineNumber);
	}
};

DrillbitTest.Subject.prototype.shouldBeBoolean = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	DrillbitTest.assertion(this);
	if (typeof(this.target) != 'boolean')
	{
		throw new DrillbitTest.Error('should be a boolean, was: '+typeof(this.target),lineNumber);
	}
};

DrillbitTest.Subject.prototype.shouldBeTrue = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	DrillbitTest.assertion(this);
	if (this.target!==true)
	{
		throw new DrillbitTest.Error('should be true, was: '+this.target,lineNumber);
	}
};

DrillbitTest.Subject.prototype.shouldBeFalse = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	DrillbitTest.assertion(this);
	if (this.target!==false)
	{
		throw new DrillbitTest.Error('should be false, was: '+this.target,lineNumber);
	}
};

DrillbitTest.Subject.prototype.shouldBeZero = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	DrillbitTest.assertion(this);
	if (this.target!==0)
	{
		throw new DrillbitTest.Error('should be 0 (zero), was: '+this.target+' ('+typeof(this.target)+')',lineNumber);
	}
};

DrillbitTest.Subject.prototype.shouldBeArray = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	DrillbitTest.assertion(this);
	// better way to check? we need to support our duck-typing too..
	if (this.target.constructor != Array)
	{
		throw new DrillbitTest.Error('should be an array, was: '+this.target,lineNumber);
	}
};

DrillbitTest.Subject.prototype.shouldContain = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	DrillbitTest.assertion(this);
	if (this.target.indexOf(expected)==-1)
	{
		throw new DrillbitTest.Error('should contain: '+expected+', was: '+this.target,lineNumber);
	}
};

DrillbitTest.Subject.prototype.shouldBeOneOf = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	DrillbitTest.assertion(this);
	if (expected.indexOf(this.target)==-1)
	{
		throw new DrillbitTest.Error('should contain one of: ['+expected.join(",")+'] was: '+this.target,lineNumber);
	}
};

DrillbitTest.Subject.prototype.shouldMatchArray = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	DrillbitTest.assertion(this);
	if (this.target.length && expected.length && this.target.length == expected.length) {
		for (var i = 0; i < expected.length; i++) {
			if (expected[i] != this.target[i]) {
				throw new DrillbitTest.Error('element ' + i + ' should be: '+expected[i]+' was: '+this.target[i],lineNumber);
			}
		}
	}
	else {
		throw new DrillbitTest.Error('array lengths differ, expected: '+expected+', was: '+this.target,lineNumber);
	}
};

DrillbitTest.Subject.prototype.shouldBeGreaterThan = function(expected, lineNumber)
{
	this.lineNumber = lineNumber;
	DrillbitTest.assertion(this);
	if (this.target <= expected)
	{
		throw new DrillbitTest.Error('should be greater than, was ' + this.target + ' <= ' + expected,lineNumber);
	}
};

DrillbitTest.Subject.prototype.shouldBeLessThan = function(expected, lineNumber)
{
	this.lineNumber = lineNumber;
	DrillbitTest.assertion(this);
	if (this.target >= expected)
	{
		throw new DrillbitTest.Error('should be less than, was ' + this.target + ' >= ' + expected,lineNumber);
	}
};

DrillbitTest.Subject.prototype.shouldBeGreaterThanEqual = function(expected, lineNumber)
{
	this.lineNumber = lineNumber;
	DrillbitTest.assertion(this);
	if (this.target < expected)
	{
		throw new DrillbitTest.Error('should be greater than equal, was ' + this.target + ' < ' + expected,lineNumber);
	}
};

DrillbitTest.Subject.prototype.shouldBeLessThanEqual = function(expected, lineNumber)
{
	this.lineNumber = lineNumber;
	DrillbitTest.assertion(this);
	if (this.target > expected)
	{
		throw new DrillbitTest.Error('should be greater than, was ' + this.target + ' > ' + expected,lineNumber);
	}
};

DrillbitTest.Subject.prototype.shouldThrowException = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	DrillbitTest.assertion(this);
	if (typeof(this.target) == 'function')
	{
		try {
			this.target();
		} catch (e) { return; }
		throw new DrillbitTest.Error("should throw exception, but didn't",lineNumber);
	}
	else throw new DrillbitTest.Error("should throw exception, but target isn't a function",lineNumber);
};

DrillbitTest.Subject.prototype.shouldNotThrowException = function(expected,lineNumber)
{
	this.lineNumber = lineNumber;
	DrillbitTest.assertion(this);
	if (typeof(this.target) == 'function')
	{
		try {
			this.target();
		} catch (e) { 
			throw new DrillbitTest.Error("should not throw exception, but did",lineNumber);	
		}
	}
	else throw new DrillbitTest.Error("should not throw exception, but target isn't a function",lineNumber);
};