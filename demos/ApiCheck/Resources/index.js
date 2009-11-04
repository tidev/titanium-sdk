window.onload = function()
{
	var suite = new Tester.TestSuite();
	
	var tcAPI = new Tester.TestCase("Titanium.API");
	suite.addTestCase(tcAPI);
	
	tcAPI.assertHasMethods ("Titanium.API", Titanium.API, [
		'debug', 'info', 'fred'
	]);
	
	suite.performTests();
};
