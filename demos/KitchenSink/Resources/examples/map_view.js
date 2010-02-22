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
	annotations:[apple, atlanta]
});

win.add(mapview);

//
// PRE-DEFINED REGIONS
//
var regionAtlanta = {latitude:33.74511,longitude:-84.38993,animate:true,latitudeDelta:0.04, longitudeDelta:0.04};
var regionSV = {latitude:37.337681,longitude:-122.038193,animate:true,latitudeDelta:0.04, longitudeDelta:0.04};

//
// TOOLBAR BUTTONS
//

// button to change to ATL
var atl = Titanium.UI.createButton({
	style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED,
	title:'ATL'
});
atl.addEventListener('click', function()
{
	// set location to atlanta
	mapview.setLocation(regionAtlanta);
	
	// activate annotation
	mapview.selectAnnotation(mapview.annotations[2].title,true);
});

// button to change to SV
var sv = Titanium.UI.createButton({
	style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED,
	title:'SV'
});
sv.addEventListener('click', function()
{
	Ti.API.info('IN SV CHANGE')
	// set location to sv
	mapview.setLocation(regionSV);
	
	// activate annotation
	mapview.selectAnnotation(mapview.annotations[1].title,true);
	
});

var flexSpace = Titanium.UI.createButton({
	systemButton:Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
});

// button to change map type to SAT
var sat = Titanium.UI.createButton({
	title:'Sat',
	style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
});
sat.addEventListener('click',function()
{
	// set map type to satellite
	mapview.setMapType(Titanium.Map.SATELLITE_TYPE);
});

// button to change map type to STD
var std = Titanium.UI.createButton({
	title:'Std',
	style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
});
std.addEventListener('click',function()
{
	// set map type to standard
	mapview.setMapType(Titanium.Map.STANDARD_TYPE);
});

// button to change map type to HYBRID
var hyb = Titanium.UI.createButton({
	title:'Hyb',
	style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
});
hyb.addEventListener('click',function()
{
	// set map type to hybrid
	mapview.setMapType(Titanium.Map.HYBRID_TYPE);
});

// button to zoom-in
var zoomin = Titanium.UI.createButton({
	title:'+',
	style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
});
zoomin.addEventListener('click',function()
{
	mapview.zoom(1);
});

// button to zoom-out
var zoomout = Titanium.UI.createButton({
	title:'-',
	style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
});
zoomout.addEventListener('click',function()
{
	mapview.zoom(-1);
});

win.setToolbar([flexSpace,std,flexSpace,hyb,flexSpace,sat,flexSpace,atl,flexSpace,sv,flexSpace,zoomin,flexSpace,zoomout,flexSpace]);

//
// EVENT LISTENERS
//

// region chnage event listener
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
	var myid = evt.annotation.myid;
	
	Titanium.API.info('MAPVIEW EVENT - you clicked on '+title+' with click source = '+clickSource);

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
		Ti.API.info('adding mountain view annotation')
		mapview.addAnnotation(mountainView);
		annotationAdded=true;
	}
	else
	{
		Ti.API.info('removing mountain view annotation')
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
	
	Titanium.API.info('ANNOTATION EVENT - you clicked on '+annotation.title+' with click source = '+clicksource);
	
});