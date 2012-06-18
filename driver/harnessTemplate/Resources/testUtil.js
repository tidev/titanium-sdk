/*
 * Purpose: utility file for tests
 *
 * Description: contains utility functions used while running individual tests such as assertion 
 * checks etc.  Also contains error state and callback management.
 */

module.exports = new function() {
	var self = this;
	this.callback;
	this.errorState;

	this.reportError = function(message) {
		self.errorState = true;

		try {
			throw new Error(message);

		} catch(e) {
			var errorDetails;

			if(e.stack) {
				errorDetails = e.stack;

			} else if(e.lineNumber) {
				errorDetails = e.lineNumber;

			} else if(e.line) {
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

			self.callback("error", "<" + errorDetails + ">");
		}
	}

	this.finish = function() {
		if(self.errorState) {
			return;
		}

		self.callback();
	}

	this.valueOf = function(obj) {
		return new Value(obj);
	}

	var Value = function(obj) {
		this.obj = obj;
	}

	Value.prototype.shouldBe = function(expected) {
		if(self.errorState) {
			return;
		}

		if (this.obj != expected) {
			self.reportError("should be: '" + expected + "', was: '" + this.obj + "'");
		}
	}
	Value.prototype.shouldBeEqual = Value.prototype.shouldBe;

	Value.prototype.shouldNotBe = function(expected) {
		if(self.errorState) {
			return;
		}

		if (this.obj == expected) {
			self.reportError("should not be: '" + expected + "', was: '" + this.obj + "'");
		}
	}
	Value.prototype.shouldNotBeEqual = Value.prototype.shouldNotBe;


	Value.prototype.shouldNotBeNull = function() {
		if(self.errorState) {
			return;
		}

		if (this.obj === null) {
			self.reportError("should not be null, was: " + this.obj);
		}
	}

	Value.prototype.shouldNotBeUndefined = function() {
		if(self.errorState) {
			return;
		}

		if (this.obj === undefined) {
			self.reportError("should not be undefined, was: " + this.obj);
		}
	}

	Value.prototype.shouldBeExactly = function(expected) {
		if(self.errorState) {
			return;
		}

		if (this.obj !== expected) {
			self.reportError("should be exactly: " + expected + ", was: " + this.obj);
		}
	}

	Value.prototype.shouldNotBeExactly = function(expected) {
		if(self.errorState) {
			return;
		}

		if (this.obj === expected) {
			self.reportError("should not be exactly: " + expected + ", was: " + this.obj);
		}
	}

	Value.prototype.shouldBeNull = function() {
		if(self.errorState) {
			return;
		}

		if (this.obj !== null) {
			self.reportError("should be null, was: " + this.obj);
		}
	}

	Value.prototype.shouldBeString = function() {
		if(self.errorState) {
			return;
		}

		if (typeof this.obj !== "string") {
			self.reportError("should be string, was: " + typeof(this.obj));
		}
	}

	Value.prototype.shouldBeUndefined = function() {
		if(self.errorState) {
			return;
		}

		if (this.obj !== undefined) {
			self.reportError("should be undefined, was: " + this.obj);
		}
	}

	Value.prototype.shouldBeFunction = function() {
		if(self.errorState) {
			return;
		}

		if ((typeof(this.obj) != "function") && !(this.obj instanceof Function)) {
			self.reportError("should be a function, was: " + typeof(this.obj));
		}
	}

	Value.prototype.shouldBeObject = function() {
		if(self.errorState) {
			return;
		}

		if ((typeof(this.obj) != "object") && !(this.obj instanceof Object)) {
			self.reportError("should be a object, was: " + this.obj);
		}
	}

	Value.prototype.shouldBeNumber = function() {
		if(self.errorState) {
			return;
		}

		if (typeof(this.obj) != "number") {
			self.reportError("should be a number, was: " + typeof(this.obj));
		}
	}

	Value.prototype.shouldBeBoolean = function() {
		if(self.errorState) {
			return;
		}

		if (typeof(this.obj) != "boolean") {
			self.reportError("should be a boolean, was: " + typeof(this.obj));
		}
	}

	Value.prototype.shouldBeTrue = function() {
		if(self.errorState) {
			return;
		}

		if (this.obj !== true) {
			self.reportError("should be true, was: " + this.obj);
		}
	}

	Value.prototype.shouldBeFalse = function() {
		if(self.errorState) {
			return;
		}

		if (this.obj !== false) {
			self.reportError("should be false, was: " + this.obj);
		}
	}

	Value.prototype.shouldBeZero = function() {
		if(self.errorState) {
			return;
		}

		if (this.obj !== 0) {
			self.reportError("should be 0 (zero), was: " + this.obj + " (" + typeof(this.obj) + ")");
		}
	}

	Value.prototype.shouldBeArray = function() {
		if(self.errorState) {
			return;
		}

		// better way to check? we need to support our duck-typing too..
		if (this.obj.constructor != Array) {
			self.reportError("should be an array, was: " + this.obj);
		}
	}

	Value.prototype.shouldContain = function(expected) {
		if(self.errorState) {
			return;
		}

		if (this.obj.indexOf(expected) == -1) {
			self.reportError("should contain: " + expected + ", was: " + this.obj);
		}
	}

	Value.prototype.shouldBeOneOf = function(expected) {
		if(self.errorState) {
			return;
		}

		if (expected.indexOf(this.obj) == -1) {
			self.reportError("should contain one of: [" + expected.join(",") + "] was: " + this.obj);
		}
	}

	Value.prototype.shouldMatchArray = function(expected) {
		if(self.errorState) {
			return;
		}

		if (this.obj.length && expected.length && this.obj.length == expected.length) {
			for (var i = 0; i < expected.length; i++) {
				if (expected[i] != this.obj[i]) {
					self.reportError("element " + i + " should be: " + expected[i] + " was: " + this.obj[i]);
				}
			}

		} else {
			self.reportError("array lengths differ, expected: " + expected + ", was: " + this.obj);
		}
	}

	Value.prototype.shouldBeGreaterThan = function(expected) {
		if(self.errorState) {
			return;
		}

		if (this.obj <= expected) {
			self.reportError("should be greater than, was " + this.obj + " <= " + expected);
		}
	}

	Value.prototype.shouldBeLessThan = function(expected) {
		if(self.errorState) {
			return;
		}

		if (this.obj >= expected) {
			self.reportError("should be less than, was " + this.obj + " >= " + expected);
		}
	}

	Value.prototype.shouldBeGreaterThanEqual = function(expected) {
		if(self.errorState) {
			return;
		}

		if (this.obj < expected) {
			self.reportError("should be greater than equal, was " + this.obj + " < " + expected);
		}
	}

	Value.prototype.shouldBeLessThanEqual = function(expected) {
		if(self.errorState) {
			return;
		}

		if (this.obj > expected) {
			self.reportError("should be greater than, was " + this.obj + " > " + expected);
		}
	}

	Value.prototype.shouldThrowException = function() {
		if(self.errorState) {
			return;
		}

		if (typeof(this.obj) == "function") {
			try {
				this.obj();

			} catch (e) {
				return;
			}

			self.reportError("should throw exception, but didn't");

		} else {
			self.reportError("should throw exception, but target isn't a function");
		}
	}

	Value.prototype.shouldNotThrowException = function() {
		if(self.errorState) {
			return;
		}

		if (typeof(this.obj) == "function") {
			try {
				this.obj();

			} catch (e) { 
				self.reportError("should not throw exception, but did");	
			}

		} else {
			self.reportError("should not throw exception, but target isn't a function");
		}
	}
}
