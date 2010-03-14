var win = Titanium.UI.currentWindow;
win.backgroundColor = '#13386c'

var xmlstr = "<?xml version=\"1.0\" encoding=\"utf-8\"?>"+
"<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\">"+
"<soap:Body>"+
"<FooBarResponse xmlns=\"http://foo.com/2010\">"+
"<FooBarResult>"+
"<ResponseStatus>"+
"<Status>"+
"<PassFail>Pass</PassFail>"+
"<ErrorCode />"+
"<MessageDetail />"+
"</Status>"+
"</ResponseStatus>"+
"<FooBar>true</FooBar>"+
"</FooBarResult>"+
"</FooBarResponse>"+
"</soap:Body></soap:Envelope>";

var xml = Ti.XML.parseString(xmlstr);
var fooBarList = xml.documentElement.getElementsByTagName("FooBar");

var result = fooBarList!=null && fooBarList.length == 1 && fooBarList.item(0).text=="true";
result = result && fooBarList.item(0).nodeName=="FooBar";

var label1 = Ti.UI.createLabel({
	top:20,
	text:'SOAP Test.\nShould be true.\nResult was: ' + result,
	color:'white',
	textAlign:'center',
	width:'auto',
	height:'auto',
	font:{fontFamily:'Helvetica Neue',fontSize:24}
});

win.add(label1);


var xmlstr2 = "<?xml version=\"1.0\" encoding=\"utf-8\"?>"+
"<FooBarResponse>"+
"<FooBarResult>"+
"<ResponseStatus>"+
"<Status>"+
"<PassFail>Pass</PassFail>"+
"<ErrorCode />"+
"<MessageDetail />"+
"</Status>"+
"</ResponseStatus>"+
"<FooBar>true</FooBar>"+
"</FooBarResult>"+
"</FooBarResponse>";

var xml2 = Ti.XML.parseString(xmlstr2);

fooBarList = xml2.documentElement.getElementsByTagName("FooBar");
result = fooBarList!=null && fooBarList.length == 1 && fooBarList.item(0).text=="true";
result = result && fooBarList.item(0).nodeName=="FooBar";

//TODO: remove when XPath is supported in android
if (xml2.evaluate) {
	// test XPath against Document
	result2 = xml2.evaluate("//FooBar/text()");
	result = result && result2.item(0).nodeValue == "true";
	
	// test XPath against Element
	result2 = xml2.documentElement.evaluate("//FooBar/text()");
	result = result && result2.item(0).text == "true";
	
	// test XPath against Element
	result2 = fooBarList.item(0).evaluate("text()");
	result = result && result2.item(0).text == "true";
} else {
	result = false;
}
var label2 = Ti.UI.createLabel({
	top:150,
	text:'XML Test.\nShould be true.\nResult was: ' + result,
	color:'white',
	textAlign:'center',
	width:'auto',
	height:'auto',
	font:{fontFamily:'Helvetica Neue',fontSize:24}
});

win.add(label2);
