var win = Titanium.UI.currentWindow;

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
	annotations:[mountainView, apple, atlanta]
});

win.addView(mapview);
win.showView(mapview);

//
// VIEW 2
//
var view2 = Titanium.UI.createView({
	backgroundColor:'#336699'
});
var l2 = Titanium.UI.createLabel({
	color:'white',
	text:'I am View 2',
	width:'auto',
	height:'auto'
});
win.addView(view2);
view2.add(l2);

//
// VIEW 3
//
var view3 = Titanium.UI.createView({
	backgroundColor:'maroon'
});
var l3 = Titanium.UI.createLabel({
	color:'white',
	text:'I am View 3',
	width:'auto',
	height:'auto'
});
win.addView(view3);
view3.add(l3);

//
// VIEW 4
//
var view4 = Titanium.UI.createView({
	backgroundColor:'pink'
});
var l4 = Titanium.UI.createLabel({
	color:'white',
	text:'I am View 4',
	width:'auto',
	height:'auto'
});
win.addView(view4);
view4.add(l4);

//
// CREATE TOOLBAR BUTTONS
//
var b1 = Titanium.UI.createButton({
	title:'View 1',
	style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
	
});
b1.addEventListener('click', function()
{
	var animation = Ti.UI.createAnimation();
	animation.transition = Ti.UI.iPhone.AnimationStyle.CURL_UP;
	animation.opacity = 0.8;
	animation.addEventListener('complete',function()
	{
		view2.opacity = 1.0;
	});
	
	win.showView(mapview, animation);
});

var b2 = Titanium.UI.createButton({
	title:'View 2',
	style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
	
});
b2.addEventListener('click', function()
{
	var animation = Ti.UI.createAnimation();
	animation.transition = Ti.UI.iPhone.AnimationStyle.FLIP_FROM_LEFT;	
	win.showView(view2, animation);	
});

var b3 = Titanium.UI.createButton({
	title:'View 3',
	style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
	
});
b3.addEventListener('click', function()
{
	var animation = Ti.UI.createAnimation();
	animation.transition = Ti.UI.iPhone.AnimationStyle.FLIP_FROM_RIGHT;	
	win.showView(view3, animation);	
	
});

var b4 = Titanium.UI.createButton({
	title:'View 4',
	style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED	
});
b4.addEventListener('click', function()
{
	var animation = Ti.UI.createAnimation();
	animation.transition = Ti.UI.iPhone.AnimationStyle.CURL_DOWN;	
	win.showView(view4, animation);	
	
});

var flexSpace = Titanium.UI.createButton({
	style:Titanium.UI.iPhone.SystemButtonStyle.FLEXIBLE_SPACE
});

win.toolbar = [b1,flexSpace,b2,flexSpace,b3,flexSpace,b4];