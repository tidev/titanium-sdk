var Tester = {
	
    skipIndicator : true,

    TestCase : function(name, desc) {
        this.name = name;
        this.desc = desc;
        this.passCount = 0;
        this.failCount = 0;
        this.exceptionCount = 0;
        this.tests = [];

        this.addTest = function(s, f, p) {
            if (p === null || p === undefined || Titanium.Platform.name == p) {
                this.tests.push({
                    desc: s,
                    test: f
                });
            }
        };

        this.assertUndefined = function(s, v, p) {
            this.addTest(s + " is undefined", function() {
                return v === undefined;
            }, p);
        };

        this.assertFunction = function(s, f, p) {
            this.addTest(s + " is function", function() {
                return typeof f == 'function';
            }, p);
        };

        this.assertReadOnlyProperty = function(s, o, n, p) {
            this.addTest(s + " is read-only property", function() {
                return (typeof o.__lookupGetter__(n) == 'function') && (typeof o.__lookupSetter__(n) == 'undefined');
            }, p);
        };

		this.toHash = function(a) {
			var h = {};
			for(var i = 0; i < a.length; i++) {
				h[a[i]] = true;
			}
			return h;
		};
		
		this.assertHasMethods = function(s, o, l, p) {
			var add = function(tc, name, o) {
				var f1 = function() {
					return (name in o);
				};
				tc.addTest(s + "." + name + " exists", f1);
				var f2 = function() {
					return (name in o && typeof o[name] == "function");
				};
				tc.addTest(s + "." + name + " is function", f2);
				
			};
			for(var i = 0; i < l.length; i++) {
				add(this, l[i], o);
			}
			
			this.addTest("Additional methods on " + s, function(){
				var other = [];
				var h = this.toHash(l);
				for(var k in o) {
					if (typeof o[k] == "function") {
						if (!(k in h)) {
							other.push(k);
						}
					}
				}
				return { result : (other.length == 0), msg : "Unexpected: " + other.join(" ")};
			});
		};

        this.performTests = function(suite) {
            document.getElementById('tests').innerHTML += "<div class='testcase'>" + this.name + "</div>";
            for (var i = 0; i < this.tests.length; i++) {
                var t = this.tests[i];
                var h = "<div class='test-";
				var success = false;
				var msg = "";
                try {
					var r = t.test.apply(this);
					if (typeof r == "object") {
						success = r.result;
						msg = r.msg;
					} else {
						success = r;
					}
                    if (success) {
                        h += "pass'><span class='pass'>PASS: </span>";
                        this.passCount++;
                        suite.pass();
                    } else {
                        h += "fail'><span class='fail'>FAIL: </span>";
                        this.failCount++;
                        suite.fail();
                    }
                } catch(E1) {
                    h += "exception'><span class='exception'>" + E1 + ": </span>";
                    this.exceptionCount++;
                    suite.exception();
                }

                h += "<span class='test-desc'>" + t.desc + "</span>";
				if (!success && msg.length > 0) {
					h += " <span class='test-msg'>" + msg + "</span>";
				}
				h += "</div>";
                document.getElementById("tests").innerHTML += h;
            }
        };
    },

    TestSuite : function() {
        this.passCount = 0;
        this.failCount = 0;
        this.exceptionCount = 0;
        this.testCount = 0;
        this.testCases = [];
        this.progress = null;

        this.addTestCase = function(tc) {
            this.testCases.push(tc);
        };

        this.performTests = function() {
            var testsToRun = 0;
            for (var i = 0; i < this.testCases.length; i++) {
                testsToRun += this.testCases[i].tests.length;
            }

            Titanium.API.info("Creating Activity Indicator");
			if (!Tester.skipIndicator) {
	            try {
	                this.progress = Titanium.UI.createActivityIndicator({
	                    'location': Titanium.UI.ActivityIndicator.DIALOG,
	                    'type': Titanium.UI.ActivityIndicator.DETERMINANT,
	                    'message': 'Testing...',
	                    'min': 0,
	                    'max': testsToRun,
	                    'value': 0
	                });
	            } catch(E1) {
	                Titanium.API.error("W? " + E1);
	            }

	            this.progress.show();
			}

            Titanium.API.info("There are " + this.testCases.length + " testcases");
            for (i = 0; i < this.testCases.length; i++) {
                Titanium.API.info("TC: " + i);
                var tc = this.testCases[i];
				try {
	                if (tc.setup !== undefined) {
	                    tc.setup();
	                }

	                tc.performTests(this);

	                if (tc.teardown !== undefined) {
	                    tc.teardown();
	                }
				} catch (E) {
					Titanium.API.error("Error during testcase: " + i + ": " + E);
				}
            }
			if (!Tester.skipIndicator) {
            	this.progress.hide();
            	this.progress = null;
			}
        };
        this.postResult = function(id, count) {
            Titanium.API.debug("id: " + id + " count: " + count);
            document.getElementById(id).innerHTML = String(count);
            document.getElementById("suite-total").innerHTML = String(++this.testCount);
			if (!Tester.skipIndicator) {
            	this.progress.setValue(this.testCount);
			}
        };
        this.pass = function() {
            this.postResult("suite-pass", ++this.passCount);
        };
        this.fail = function() {
            this.postResult("suite-fail", ++this.failCount);
        };
        this.exception = function() {
            this.postResult("suite-exception", ++this.exceptionCount);
        };
    }
};

