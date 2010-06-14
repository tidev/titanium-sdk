var win = Ti.UI.currentWindow;

var view = Ti.UI.createView({
	backgroundColor:"white",
	layout:"vertical"
});

win.add(view);

function addResult(msg)
{
	var label = Ti.UI.createLabel({
		height:"auto",
		width:"auto",
		top:20,
		text:msg
	});
	view.add(label);
}

// example of a common JS module
//
// NOTE: modules in Titanium always load *absolute* to the Resources folder
// not relative to the enclosing JS context

try
{
	var echo = require('echo');
	var result = echo.echo('hello world');
	addResult("Test 1 => "+((result == 'hello world') ? "Passed" : "Failed"));
}
catch(E)
{
	addResult("Test 1 => Failed with "+E);
}

try
{
	var result = require('echo').echo('hello world');
	addResult("Test 2 => "+((result == 'hello world') ? "Passed" : "Failed"));
}
catch(E)
{
	addResult("Test 2 => Failed with "+E);
}

try
{
	// test catching module exception on bad module
	require('__bad_module__');
	TaddResult("Test 3 = > Failed: should have raised an exception loading a missing module, but didn't");
}
catch(e)
{
	// this is good
	addResult("Test 3 => Passed");
}
