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
	}
});
