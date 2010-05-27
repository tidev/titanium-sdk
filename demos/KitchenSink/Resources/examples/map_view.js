var win = Titanium.UI.currentWindow;

var isAndroid = false;

if (Titanium.Platform.name == 'android') {
	isAndroid = true;
	menu = Titanium.UI.Android.OptionMenu.createMenu();
}

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
	rightButton: '../images/apple_logo.jpg',
	myid:2 // CUSTOM ATTRIBUTE THAT IS PASSED INTO EVENT OBJECTS
});

var atlantaParams = {
		latitude:33.74511,
		longitude:-84.38993,
		title:"Atlanta, GA",
		subtitle:'Atlanta Braves Stadium\nfoo',
		animate:true,
		leftButton:'../images/atlanta.jpg',
		rightButton: Titanium.UI.iPhone.SystemButton.DISCLOSURE,
		myid:3 // CUSTOM ATTRIBUTE THAT IS PASSED INTO EVENT OBJECTS
	};

if (!isAndroid) {
	atlantaParams.pincolor = Titanium.Map.ANNOTATION_PURPLE;
} else {
	atlantaParams.pinImage = "../images/map-pin.png";
}
var atlanta = Titanium.Map.createAnnotation(atlantaParams);

//
// CREATE MAP VIEW
//
var mapview = Titanium.Map.createView({
	mapType: Titanium.Map.STANDARD_TYPE,
	region: {latitude:33.74511, longitude:-84.38993, latitudeDelta:0.5, longitudeDelta:0.5},
	animate:true,
	regionFit:true,
	userLocation:true,
	annotations:[apple, atlanta]
});

win.add(mapview);

//
// PRE-DEFINED REGIONS
//
var regionAtlanta = {latitude:33.74511,longitude:-84.38993,animate:true,latitudeDelta:0.04, longitudeDelta:0.04};
var regionSV = {latitude:37.337681,longitude:-122.038193,animate:true,latitudeDelta:0.04, longitudeDelta:0.04};

//
// NAVBAR BUTTONS
//
var removeAll = null;

if (!isAndroid) {
	removeAll = Titanium.UI.createButton({
		style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED,
		title:'Remove All'
	});
} else {
	removeAll = Titanium.UI.Android.OptionMenu.createMenuItem({title:'Remove All'});
}
removeAll.addEventListener('click', function()
{
	mapview.removeAllAnnotations();
});
if (!isAndroid) {
	win.rightNavButton = removeAll;
}
//
// TOOLBAR BUTTONS
//

// button to change to ATL
var atl = null;

if (!isAndroid) {
	atl = Titanium.UI.createButton({
		style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED,
		title:'ATL'
	});
} else {
	atl = Titanium.UI.Android.OptionMenu.createMenuItem({title : 'ATL'});
}
// activate annotation
mapview.selectAnnotation(mapview.annotations[1].title,true);

atl.addEventListener('click', function()
{
	// set location to atlanta
	mapview.setLocation(regionAtlanta);

	// activate annotation
	mapview.selectAnnotation(mapview.annotations[1].title,true);
});

// button to change to SV
var sv = null;

if (!isAndroid) {
	sv = Titanium.UI.createButton({
		style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED,
		title:'SV'
	});
} else {
	sv = Titanium.UI.Android.OptionMenu.createMenuItem({title : 'SV'});
}
sv.addEventListener('click', function()
{
	Ti.API.info('IN SV CHANGE');
	// set location to sv
	mapview.setLocation(regionSV);

	// activate annotation
	mapview.selectAnnotation(mapview.annotations[0].title,true);
});
mapview.addEventListener('complete', function()
{
	Ti.API.info("map has completed loaded region");
})


var flexSpace = Titanium.UI.createButton({
	systemButton:Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
});

// button to change map type to SAT
var sat = null;
if (!isAndroid) {
	sat = Titanium.UI.createButton({
		title:'Sat',
		style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
	});
} else {
	sat = Titanium.UI.Android.OptionMenu.createMenuItem({title : 'Sat'});
}
sat.addEventListener('click',function()
{
	// set map type to satellite
	mapview.setMapType(Titanium.Map.SATELLITE_TYPE);
});

// button to change map type to STD
var std = null;
if (!isAndroid) {
	std = Titanium.UI.createButton({
		title:'Std',
		style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
	});
} else {
	std = Titanium.UI.Android.OptionMenu.createMenuItem({title : 'Std'});
}
std.addEventListener('click',function()
{
	// set map type to standard
	mapview.setMapType(Titanium.Map.STANDARD_TYPE);
});

// button to change map type to HYBRID
var hyb = null;
if (!isAndroid) {
	hyb = Titanium.UI.createButton({
		title:'Hyb',
		style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
	});
} else {
	hyb = Titanium.UI.Android.OptionMenu.createMenuItem({title : 'Hyb'});
}
hyb.addEventListener('click',function()
{
	// set map type to hybrid
	mapview.setMapType(Titanium.Map.HYBRID_TYPE);
});

// button to zoom-in
var zoomin = null;
if (!isAndroid) {
	zoomin = Titanium.UI.createButton({
		title:'+',
		style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
	});
} else {
	zoomin = Titanium.UI.Android.OptionMenu.createMenuItem({title : "Zoom In"});
}
zoomin.addEventListener('click',function()
{
	mapview.zoom(1);
});

// button to zoom-out
var zoomout = null;
if (!isAndroid) {
	zoomout = Titanium.UI.createButton({
		title:'-',
		style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
	});
} else {
	zoomout = Titanium.UI.Android.OptionMenu.createMenuItem({title : 'Zoom Out'});
}
zoomout.addEventListener('click',function()
{
	mapview.zoom(-1);
});

if (!isAndroid) {
	win.setToolbar([flexSpace,std,flexSpace,hyb,flexSpace,sat,flexSpace,atl,flexSpace,sv,flexSpace,zoomin,flexSpace,zoomout,flexSpace]);
} else {
	menu.add(atl);
	menu.add(sv);
	menu.add(std);
	menu.add(hyb);
	menu.add(sat);
	menu.add(zoomin);
	menu.add(zoomout);
	menu.add(removeAll);
	Titanium.UI.Android.OptionMenu.setMenu(menu);
}

//
// EVENT LISTENERS
//

// region change event listener
mapview.addEventListener('regionChanged',function(evt)
{
	Titanium.API.info('maps region has updated to '+evt.longitude+','+evt.latitude);
});

var annotationAdded = false;

// map view click event listener
mapview.addEventListener('click',function(evt)
{

	// map event properties
	var annotation = evt.annotation;
	var title = evt.title;
	var clickSource = evt.clicksource;

	// custom annotation attribute
	var myid = (evt.annotation)?evt.annotation.myid:-1;

	Ti.API.info('mapview click clicksource = ' + clickSource)
	// use custom event attribute to determine if atlanta annotation was clicked
	if (myid == 3 && evt.clicksource == 'rightButton')
	{
		//  change the annotation on the fly
		evt.annotation.rightView = Titanium.UI.createView({width:20,height:20,backgroundColor:'red'});
		evt.annotation.leftView = Titanium.UI.createView({width:20,height:20,backgroundColor:'#336699'});
		evt.annotation.title = "Atlanta?";
		evt.annotation.pincolor = Titanium.Map.ANNOTATION_GREEN;
		evt.annotation.subtitle = 'Appcelerator used to be near here';
		evt.annotation.leftButton = 'images/appcelerator_small.png';

	}
	if (myid == 2 && annotationAdded==false)
	{
		mapview.addAnnotation(mountainView);
		annotationAdded=true;
	}
	else
	{
		mapview.removeAnnotation(mountainView);
		annotationAdded=false;
	}
});

// annotation click event listener (same as above except only fires for a given annotation)
atlanta.addEventListener('click', function(evt)
{
	// get event properties
	var annotation = evt.source;
	var clicksource = evt.clicksource;
	Ti.API.info('atlanta annotation click clicksource = ' + clicksource)
});

apple.addEventListener('click', function(evt)
{

	// get event properties
	var annotation = evt.source;
	var clicksource = evt.clicksource;
	Ti.API.info('atlanta annotation click clicksource = ' + clicksource)


});
