
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

var scrollView = Ti.UI.createScrollView({
	top: 0, left: 0,
	right: 0, bottom: 0,
	scrollType: 'vertical',
	showVerticalScrollIndicator: true,
	backgroundColor: 'black',
	contentHeight: 'auto',
	contentWidth: 'auto'
});

var harnessConsole = Ti.UI.createLabel({
	top: 0, left: 5, right: 5,
	height: 'auto',
	backgroundColor: 'black',
	font: {
		fontFamily: 'monospace',
		fontSize: '14'
	},
	color: 'white'
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
	Ti.Android.currentActivity.addEventListener("instrumentationReady", function(e) {
		DrillbitTest.instrumentation = e.instrumentation;
		runTests();
	});
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
		harnessConsole.text += msg + "\n";
	}
}
