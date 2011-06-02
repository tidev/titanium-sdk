
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
	scalesPageToFit: false,
	url: 'test_harness_console.html'
});

var isAndroid = Ti.Platform.osname == "android";
if (isAndroid) {
	harnessConsole.html = "<b>test suite: " + testName + "</b><br>";
} else {
	harnessConsole.text = "test suite: " + testName + "\n";
}

w.add(harnessConsole);

// in Android, we run tests through the custom Activity
if (isAndroid) {
	TestHarnessActivity.onRunnerReady(runTests);
} else {
	w.addEventListener("open", function(e) {
		runTests();
	});
}
w.open();

function appendMessage(msg, type) {
	if (isAndroid) {
		var message = "<font";
		if (type) {
			if (type == "fail") {
				message += " color=\"red\"";
			} else if (type == "pass") {
				message += " color=\"green\"";
			}
		}
		message += ">" + msg + "</font><br>";
		harnessConsole.html += message;
	} else {
		harnessConsole.text += message + "\n";
	}
}
