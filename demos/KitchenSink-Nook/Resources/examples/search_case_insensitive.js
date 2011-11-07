var win = Ti.UI.currentWindow;

var l = Ti.UI.createLabel({
	text:'Check console output',
	font: {
		fontSize: 24	
	}
});

win.add(l);

var mystring = "Add to Address Book";

// with /i modifier Ti.API.info(mystring.search(/s/i)); // -1 (incorrect) (string length: odd)
Ti.API.info(mystring.search(/ss/i)); // 12 (correct) (string length: even)
Ti.API.info(mystring.search(/ess/i)); // -1 (incorrect) (string length: odd)
Ti.API.info(mystring.search(/ress/i)); // 10 (correct) (string length: even)
Ti.API.info(mystring.search(/dress/i)); // -1 (incorrect) (string length: odd)
Ti.API.info(mystring.search(/ddress/i)); // 8 (correct) (string length: even)
Ti.API.info(mystring.search(/address/i)); // -1 (incorrect) (string length: odd)
Ti.API.info(mystring.search(/address /i)); // 7 (correct) (string length: even)

// no modifier Ti.API.info(mystring.search(/address/)); // -1 (correct) (both cases correct here)
Ti.API.info(mystring.search(/ddress/)); // 8 (correct)