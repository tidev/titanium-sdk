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
	}
});
