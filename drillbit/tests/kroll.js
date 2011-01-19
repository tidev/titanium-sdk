describe("Kroll tests",
{
	tiSanity: function() {
		valueOf(Ti).shouldNotBeNull();
		valueOf(Titanium).shouldNotBeNull();
		valueOf(Ti).shouldBe(Titanium);
	},
	
	functionSanity: function() {
		// Titanium API methods should report a typeof 'function'
		// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2288-drillbit-shouldbefunction-fails-on-proxy-methods
		valueOf(Ti.API.info).shouldBeFunction();
		valueOf(Ti.API.debug).shouldBeFunction();
	},
	
	functionWrap: function() {
		// Make sure functions that get wrapped by Kroll still have a return value
		// https://appcelerator.lighthouseapp.com/projects/32238/tickets/2221-regression-methods-passed-through-contexts-not-returning-values
		Ti.testFunction = function() {
			return 1+1;
		}
		
		valueOf(Ti.testFunction).shouldBeFunction();
		
		var result = Ti.testFunction();
		valueOf(result).shouldBe(2);
	},
	
	customProxyMethods: function() {
		// You should be able to add custom proxy instance methods and use "this" to refer to the proxy instance
		// https://appcelerator.lighthouseapp.com/projects/32238/tickets/1005-functions-and-currentwindow-on-android-broken
		
		var x = Ti.Filesystem.getFile("app://app.js");
		x.customMethod = function() {
			return this.getNativePath();
		};
		
		valueOf(x.customMethod).shouldBeFunction();
		
		var path = x.customMethod();
		valueOf(path).shouldBe(x.getNativePath());
	},
	
	customObjects: function() {
		// ensure custom objects work when wrapped/unwrapped by Kroll
		// https://appcelerator.lighthouseapp.com/projects/32238/tickets/2027-android-weird-behavior-when-setting-custom-sub-properties-on-proxies

		var view = Ti.UI.createView();
		view.customObj = "hello";
		valueOf(view.customObj).shouldBe("hello");
		view.customObj = {};
		view.customObj.test = "hello";
		valueOf(view.customObj.test).shouldBe("hello");
		view.customObj = { test: "hello" };
		valueOf(view.customObj.test).shouldBe("hello");
		
		var X = function() { this.y = 1; };
		X.prototype.getY = function() {
			return this.y;
		};

		var x = new X();
		var row = Ti.UI.createTableViewRow();
		row.x = x;

		valueOf(x.getY()).shouldBe(1);
		valueOf(row.x.getY()).shouldBe(1);

		// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2204-150-regression-errors-accessing-custom-attributes-off-of-tableviewrow-objects-includes-testcase
		var testDate = new Date();
		var dateObj = {bla:"foo", testDateObj:testDate};
		var noDateObj = {bla:"foo"};

		var row = Ti.UI.createTableViewRow({
		    _dateObj: dateObj,
		    _noDateObj: noDateObj,
		    _testDate: testDate
		});

		valueOf(row._noDateObj.bla).shouldBe("foo");
		valueOf(row._dateObj.bla).shouldBe("foo");
		valueOf(row._dateObj.testDateObj).shouldBe(testDate);
		
		valueOf(row._testDate.getTime()).shouldBe(testDate.getTime());
		valueOf(row._testDate).shouldBe(testDate);
	},
	
	// https://appcelerator.lighthouseapp.com/projects/32238/tickets/2341-android-incorrect-method-parameter-binding-if-first-parameter-is-object-and-a-value-is-passed-for-second-parameter
	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2065-android-behavior-change-in-set-row-data-test-case#ticket-2065-5
	varArgs: function() {
		valueOf(Ti.App.Properties.getList("x.y.z", ["abcdefg"])).shouldMatchArray(["abcdefg"]);
		var tv = Ti.UI.createTableView();
		valueOf(function() {
			tv.setData([{ title: "test" }], {options: "x"});
		}).shouldNotThrowException();
	},
	
	arrayMixedTypeAndConstructor: function() {
		valueOf(function() {
			Ti.a = ["abc", "def", 123];
		}).shouldNotThrowException();

		valueOf(Ti.a[0]).shouldBe("abc");
		valueOf(Ti.a[1]).shouldBe("def");
		valueOf(Ti.a[2]).shouldBe(123);

		Ti.x = [1, 2, 3, 4, 5];
		valueOf(Ti.x.constructor).shouldNotBeUndefined();
		valueOf(Ti.x.constructor.toString()).shouldContain("Array");
	}
});
