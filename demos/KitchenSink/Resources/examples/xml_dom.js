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

var result = fooBarList!=null && fooBarList.length == 1 && fooBarList.item(0).nodeValue=="true";
var result = result && fooBarList.item(0).nodeName=="FooBar";

var label = Ti.UI.createLabel({
	text:'Should be true.\nResult was: ' + result,
	color:'white',
	textAlign:'center',
	font:{fontFamily:'Helvetica Neue',fontSize:24}
});

win.add(label);



