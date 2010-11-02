
<%
Object.keys(testJSIncludes).forEach(function(platform) {
%>
if (Ti.Platform.osname == "<%= platform %>") {
	<%= testJSIncludes[platform] %>;
}
<%	
});
%>

var w = Ti.UI.createWindow({
	top: 0, left: 0, right: 0, bottom: 0,
	backgroundColor: 'white'
});

var label = Ti.UI.createLabel({
	font: {fontSize: 20},
	color: 'black',
	text: 'test suite: ' + testName,
	top: 10, left: 10, right: 10
});
w.add(label);

var harnessConsole = Ti.UI.createWebView({
	top: 5, left: 5, right: 5, bottom: 5,
	backgroundColor: 'white',
	url: 'test_harness_console.html'
});

harnessConsole.addEventListener('load', function(e) {
	harnessConsole.evalJS('tiReady()');
	runTests();
});

w.add(harnessConsole);
w.open();

function appendMessage(msg, type) {
	var event = {message: msg};
	if (type) {
		event[type] = true;
	}
	
	Ti.App.fireEvent('message', event);
}