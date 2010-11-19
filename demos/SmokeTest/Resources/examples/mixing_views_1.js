var win = Titanium.UI.currentWindow;

// simple inline web view that triggers an event
var html = '<html><body style=";color:#bbb;font-family:Helvetica Neue;text-align:center;">';
html += '<div style="font-size:20;font-weight:bold;">I am a web view</div>';
html += '<div id="foo" style="font-size:14;font-weight:bold;">click me</div>';
html += '<script>document.getElementById("foo").ontouchstart = function()';
html += '{Ti.App.fireEvent("webview_click");document.body.addEventListener("touchmove", function(e) {e.preventDefault();}, false);};</script>';
html += '</body></html>';

var webView = Ti.UI.createWebView({
	top:10,
	height:'auto',
	width:300,
	borderRadius:10,
	backgroundColor:'#13386c',
	html:html
});
win.add(webView);

var l1 = Titanium.UI.createLabel({
	text:'You clicked the web view',
	color:'#13386c',
	font:{fontSize:20},
	top:90,
	visible:false,
	width:300,
	height:'auto'
});

win.add(l1);
Ti.App.addEventListener('webview_click', function()
{
	l1.visible = true;
});
//
// CREATE ANNOTATIONS
//
var mountainView = Titanium.Map.createAnnotation({
	latitude:37.390749,
	longitude:-122.081651,
	title:"Appcelerator Headquarters",
	subtitle:'Mountain View, CA',
	pincolor:Titanium.Map.ANNOTATION_RED,
	animate:true,
	leftButton: '../images/appcelerator_small.png',
	myid:1 // CUSTOM ATTRIBUTE THAT IS PASSED INTO EVENT OBJECTS
});

var apple = Titanium.Map.createAnnotation({
	latitude:37.33168900,
	longitude:-122.03073100,
	title:"Steve Jobs",
	subtitle:'Cupertino, CA',
	pincolor:Titanium.Map.ANNOTATION_GREEN,
	animate:true,
	rightButton: '..images/apple_logo.jpg',
	myid:2 // CUSTOM ATTRIBUTE THAT IS PASSED INTO EVENT OBJECTS
});

var atlanta = Titanium.Map.createAnnotation({
	latitude:33.74511,
	longitude:-84.38993,
	title:"Atlanta, GA",
	subtitle:'Atlanta Braves Stadium',
	pincolor:Titanium.Map.ANNOTATION_PURPLE,
	animate:true,
	leftButton:'images/atlanta.jpg',
	rightButton: Titanium.UI.iPhone.SystemButton.DISCLOSURE,
	myid:3 // CUSTOM ATTRIBUTE THAT IS PASSED INTO EVENT OBJECTS	
});

//
// CREATE MAP VIEW
//
var mapview = Titanium.Map.createView({
	mapType: Titanium.Map.STANDARD_TYPE,
	region: {latitude:33.74511, longitude:-84.38993, latitudeDelta:0.01, longitudeDelta:0.01},
	animate:true,
	regionFit:true,
	userLocation:true,
	bottom:0,
	height:200,
	annotations:[mountainView, apple, atlanta]
});

win.add(mapview);

