/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Purpose: utility file for tests
 *
 * Description: contains utility functions used while running individual tests such as assertion 
 * checks etc.  Also contains error state and callback management.
 */

module.exports = new function() {
	var self = this;
	this.callback;

	this.reportError = function(testRun, message) {
		if (testRun.resultSet) {
			return;
		}
		testRun.resultSet = true;

		try {
			throw new Error(message);

		} catch(e) {
			var errorDetails;

			if (e.stack) {
				errorDetails = e.stack;

			} else if (e.lineNumber) {
				errorDetails = e.lineNumber;

			} else if (e.line) {
				/*
				this is all we can get on iOS which isn't that useful compared to
				an actual trace.  If the error is a test definition issue rather than 
				platform specific bug you should run the test against android for a 
				better trace
				*/
				errorDetails = e.line;

			} else {
				errorDetails = "unable to get exception details";
			}

			self.callback(testRun, "error", "<" + errorDetails + ">");
		}
	};

	this.finish = function(testRun) {
		if (testRun.resultSet) {
			return;
		}
		testRun.resultSet = true;

		self.callback(testRun);
	};

	this.valueOf = function(testRun, obj) {
		return new Value(testRun, obj);
	};

	var Value = function(testRun, obj) {
		this.testRun = testRun;
		this.obj = obj;
	};

	Value.prototype.shouldBe = function(expected) {
		if (this.testRun.resultSet) {
			return;
		}

		if (this.obj != expected) {
			self.reportError(this.testRun, "should be: '" + expected + "', was: '" + this.obj + "'");
		}
	};
	Value.prototype.shouldBeEqual = Value.prototype.shouldBe;

	Value.prototype.shouldNotBe = function(expected) {
		if (this.testRun.resultSet) {
			return;
		}

		if (this.obj == expected) {
			self.reportError(this.testRun, "should not be: '" + expected + "', was: '" + this.obj + "'");
		}
	};
	Value.prototype.shouldNotBeEqual = Value.prototype.shouldNotBe;


	Value.prototype.shouldNotBeNull = function() {
		if (this.testRun.resultSet) {
			return;
		}

		if (this.obj === null) {
			self.reportError(this.testRun, "should not be null, was: " + this.obj);
		}
	};

	Value.prototype.shouldNotBeUndefined = function() {
		if (this.testRun.resultSet) {
			return;
		}

		if ((typeof this.obj) === "undefined") {
			self.reportError(this.testRun, "should not be undefined, was: " + (typeof this.obj));
		}
	};

	Value.prototype.shouldBeExactly = function(expected) {
		if (this.testRun.resultSet) {
			return;
		}

		if (this.obj !== expected) {
			self.reportError(this.testRun, "should be exactly: " + expected + ", was: " + this.obj);
		}
	};

	Value.prototype.shouldNotBeExactly = function(expected) {
		if (this.testRun.resultSet) {
			return;
		}

		if (this.obj === expected) {
			self.reportError(this.testRun, "should not be exactly: " + expected + ", was: " + this.obj);
		}
	};

	Value.prototype.shouldBeNull = function() {
		if (this.testRun.resultSet) {
			return;
		}

		if (this.obj !== null) {
			self.reportError(this.testRun, "should be null, was: " + this.obj);
		}
	};

	Value.prototype.shouldBeString = function() {
		if (this.testRun.resultSet) {
			return;
		}

		if ((typeof this.obj) !== "string") {
			self.reportError(this.testRun, "should be string, was: " + (typeof this.obj));
		}
	};

	Value.prototype.shouldBeUndefined = function() {
		if (this.testRun.resultSet) {
			return;
		}

		if ((typeof this.obj) !== "undefined") {
			self.reportError(this.testRun, "should be undefined, was: " + (typeof this.obj));
		}
	};

	Value.prototype.shouldBeFunction = function() {
		if (this.testRun.resultSet) {
			return;
		}

		if (((typeof this.obj) != "function") && !(this.obj instanceof Function)) {
			self.reportError(this.testRun, "should be a function, was: " + (typeof this.obj));
		}
	};

	Value.prototype.shouldBeObject = function() {
		if (this.testRun.resultSet) {
			return;
		}

		if (((typeof this.obj) != "object") && !(this.obj instanceof Object)) {
			self.reportError(this.testRun, "should be a object, was: " + (typeof this.obj));
		}
	};

	Value.prototype.shouldBeNumber = function() {
		if (this.testRun.resultSet) {
			return;
		}

		if ((typeof this.obj) != "number") {
			self.reportError(this.testRun, "should be a number, was: " + (typeof this.obj));
		}
	};

	Value.prototype.shouldBeBoolean = function() {
		if (this.testRun.resultSet) {
			return;
		}

		if ((typeof this.obj) != "boolean") {
			self.reportError(this.testRun, "should be a boolean, was: " + (typeof this.obj));
		}
	};

	Value.prototype.shouldBeTrue = function() {
		if (this.testRun.resultSet) {
			return;
		}

		if (this.obj !== true) {
			self.reportError(this.testRun, "should be true, was: " + this.obj);
		}
	};

	Value.prototype.shouldBeFalse = function() {
		if (this.testRun.resultSet) {
			return;
		}

		if (this.obj !== false) {
			self.reportError(this.testRun, "should be false, was: " + this.obj);
		}
	};

	Value.prototype.shouldBeZero = function() {
		if (this.testRun.resultSet) {
			return;
		}

		if (this.obj !== 0) {
			self.reportError(this.testRun, "should be 0 (zero), was: " + this.obj + " (" + typeof(this.obj) + ")");
		}
	};

	Value.prototype.shouldBeArray = function() {
		if (this.testRun.resultSet) {
			return;
		}

		var typeDescription = Object.prototype.toString.call(this.obj);
		if (typeDescription != "[object Array]") {
			self.reportError(this.testRun, "should be an array, was: " + typeDescription);
		}
	};

	Value.prototype.shouldContain = function(expected) {
		if (this.testRun.resultSet) {
			return;
		}

		if (this.obj.indexOf(expected) == -1) {
			self.reportError(this.testRun, "should contain: " + expected + ", was: " + this.obj);
		}
	};

	Value.prototype.shouldBeOneOf = function(expected) {
		if (this.testRun.resultSet) {
			return;
		}

		if (expected.indexOf(this.obj) == -1) {
			self.reportError(this.testRun, "should contain one of: [" + expected.join(",") + "] was: " + this.obj);
		}
	};

	Value.prototype.shouldMatchArray = function(expected) {
		if (this.testRun.resultSet) {
			return;
		}

		if (this.obj.length && expected.length && this.obj.length == expected.length) {
			for (var i = 0; i < expected.length; i++) {
				if (expected[i] != this.obj[i]) {
					self.reportError(this.testRun, "element " + i + " should be: " + expected[i] + " was: " + this.obj[i]);
				}
			}

		} else {
			self.reportError(this.testRun, "array lengths differ, expected: " + expected + ", was: " + this.obj);
		}
	};

	Value.prototype.shouldBeGreaterThan = function(expected) {
		if (this.testRun.resultSet) {
			return;
		}

		if (this.obj <= expected) {
			self.reportError(this.testRun, "should be greater than, was " + this.obj + " <= " + expected);
		}
	};

	Value.prototype.shouldBeLessThan = function(expected) {
		if (this.testRun.resultSet) {
			return;
		}

		if (this.obj >= expected) {
			self.reportError(this.testRun, "should be less than, was " + this.obj + " >= " + expected);
		}
	};

	Value.prototype.shouldBeGreaterThanEqual = function(expected) {
		if (this.testRun.resultSet) {
			return;
		}

		if (this.obj < expected) {
			self.reportError(this.testRun, "should be greater than equal, was " + this.obj + " < " + expected);
		}
	};

	Value.prototype.shouldBeLessThanEqual = function(expected) {
		if (this.testRun.resultSet) {
			return;
		}

		if (this.obj > expected) {
			self.reportError(this.testRun, "should be greater than, was " + this.obj + " > " + expected);
		}
	};

	Value.prototype.shouldThrowException = function() {
		if (this.testRun.resultSet) {
			return;
		}

		if ((typeof this.obj) == "function") {
			try {
				this.obj();

			} catch (e) {
				return;
			}

			self.reportError(this.testRun, "should throw exception, but didn't");

		} else {
			self.reportError(this.testRun, "should throw exception, but target isn't a function");
		}
	};

	Value.prototype.shouldNotThrowException = function() {
		if (this.testRun.resultSet) {
			return;
		}

		if ((typeof this.obj) == "function") {
			try {
				this.obj();

			} catch (e) { 
				self.reportError(this.testRun, "should not throw exception, but did");	
			}

		} else {
			self.reportError(this.testRun, "should not throw exception, but target isn't a function");
		}
	};
};
