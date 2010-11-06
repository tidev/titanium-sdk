describe("Drillbit: LH-2288",
{
	test_ticket: function() {
		valueOf(Ti.API).shouldNotBeNull();
		valueOf(Ti.API).shouldBeObject();
		valueOf(Ti.API.debug).shouldBeFunction();
	}
});
