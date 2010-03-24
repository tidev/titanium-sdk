var win = Titanium.UI.currentWindow;
win.backgroundColor = '#13386c';

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
} 



var xmlstr3 = '<?xml version="1.0" encoding="UTF-8"?>\n'+
'<response>'+
'        <nodes id="nodes">'+
'            <node id="node 1">'+
'                <node id="node 2">'+
'                    <node id="node 3"/>'+
'                </node>'+
'                <node id="node 4">'+
'                    <node id="node 5"/>'+
'                </node>'+
'                <node id="node 6">'+
'                    <node id="node 7"/>'+
'                </node>'+
'            </node>'+
'            <node id="node 8">'+
'                <node id="node 9">'+
'                    <node id="node 10"/>'+
'                </node>'+
'            </node>'+
'            <node id="node 11">'+
'                <node id="node 12">'+
'                    <node id="node 13"/>'+
'                </node>'+
'            </node>'+
'        </nodes>'+
'</response>';

var doc = Ti.XML.parseString(xmlstr3);
var nodes = doc.getElementsByTagName("nodes");

var elements = nodes.item(0).getElementsByTagName("node");
result = result && (elements!=null && elements.length==13);

elements = nodes.item(0).childNodes;
result = result && (elements!=null && elements.length==3);

result = result && (typeof elements == 'object');
result = result && (typeof elements.item == 'function');
result = result && (elements.item(0).nodeName=='node');


elements = doc.firstChild.childNodes;
result = result && (elements!=null && elements.length==3);

result = result && (doc.firstChild.nodeName=="nodes");
result = result && (doc.nodeName=="response");

result = result && doc.firstChild.getAttribute("id")=="nodes";
result = result && doc.firstChild.firstChild.getAttribute("id")=="node 1";
result = result && doc.firstChild.firstChild.firstChild.getAttribute("id")=="node 2";


var xmlstr4 = "<?xml version=\"1.0\" encoding=\"utf-8\"?>"+
"<root>"+
" <one>**"+
"  <two>*"+
"    <three/>"+
"    <three/>*"+
"  </two>**"+
"  <two>"+
"    <three/>"+
"    <three/>"+
"  </two>"+
" </one>"+
" <foo id='bar'>yo</foo>"+
"</root>";

xml = Ti.XML.parseString(xmlstr4);
var oneList = xml.documentElement.getElementsByTagName("one");
var twoList = oneList.item(0).getElementsByTagName("two");
var threeList = oneList.item(0).getElementsByTagName("three");

result = result && oneList.length==1;
result = result && twoList.length==2;
result = result && threeList.length==4;

result = result && xml.documentElement.firstChild.nodeName == "one";

result = result && xml.documentElement.firstChild.nextSibling.getAttribute("id")=="bar";

result = result && xml.documentElement.firstChild.ownerDocument.documentElement.nodeName == xml.documentElement.ownerDocument.documentElement.nodeName;


var nodeCount = 0;
function nodewalker(node) 
{
	nodeCount++;
	for (var i=0;i<node.childNodes.length;i++) 
	{
		if (i==0) 
		{
			nodewalker(node.firstChild)
		} 
		else 
		{
			var n = node.firstChild;
			for (var x=0;x<i;x++) 
			{
				n = n.nextSibling;
			}
			nodewalker(n);
		}
	}
};
nodewalker(nodes.item(0));
result = result && nodeCount==14;


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