Ti.include("appdata://test.js");

var android = Ti.Platform.name == 'android';
var iphone = Ti.Platform.name == 'iPhone OS';

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

var scrollView = Ti.UI.createScrollView({
	top: 35, left: 10, right: 10, bottom: 10,
	borderWidth: 2, borderColor: 'black', borderRadius: 5,
	contentWidth: 'auto', contentHeight: 'auto',
	scrollType: 'vertical',
	showVerticalScrollIndicator: true
});

var messageArea = Ti.UI.createTextArea({
	top: 0, left: 10, right: 0, bottom: 0,
	color: '#333', backgroundColor: 'white',
	text: "--- test suite messages ---",
	editable: false
});
scrollView.add(messageArea);

w.add(scrollView);
w.open();

function appendMessage(msg) {
	messageArea.text += "\n"+msg;
	if (android) {
		scrollView.scrollToBottom();
	}
}

runTests();