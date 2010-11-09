describe("Kroll tests",
{
	tiSanity: function() {
		valueOf(Ti).shouldNotBeNull();
		valueOf(Titanium).shouldNotBeNull();
		valueOf(Ti).shouldBe(Titanium);
	},
	
	functionSanity: function() {
		// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2288-drillbit-shouldbefunction-fails-on-proxy-methods
		valueOf(Ti.API.info).shouldBeFunction();
		valueOf(Ti.API.debug).shouldBeFunction();
	}
});
