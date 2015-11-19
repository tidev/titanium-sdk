// This is a test harness for your module
// You should do something interesting in this harness 
// to test out the module and to provide instructions 
// to users on how to use it by example.


// open a single window
var win = Ti.UI.createWindow({
	backgroundColor:'white'
});
var label = Ti.UI.createLabel();
win.add(label);
win.open();


var touchTestModule = require("com.soasta.touchtest");
var cloudTestURL = Ti.App.getArguments().url;
if (cloudTestURL != null)
{
	// The URL will be null if we don't launch through TouchTest.
    touchTestModule.initTouchTest(cloudTestURL);
}

Ti.App.addEventListener('resumed',function(e){
	// Hook the resumed event and if url present then restore TouchTest.
	var cloudTestURL = Ti.App.getArguments().url;
	if (cloudTestURL != null)
    {
		touchTestModule.initTouchTest(cloudTestURL);
	}
});