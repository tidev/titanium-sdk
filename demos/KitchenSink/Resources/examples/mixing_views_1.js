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
	bottom:10,
	height:200,
	left:10,
	right:10,
	borderWidth:3,
	borderRadius:10,
	borderColor:'#999',
	annotations:[mountainView, apple, atlanta]
});

win.add(mapview);

//
//  grouped view
//
var buttonData = [
	{title:'Button 1'},
	{title:'Button 2'},
	{title:'Button 3'}

];

var buttonSection = Titanium.UI.iPhone.createGroupedSection({
	footer:'Button Footer',
	header:'Button Header',
	type:'button',
	data:buttonData
});

// var groupedView = Titanium.UI.createGroupedView({
// 	top:0,
// 	height:100
// });
// groupedView.addSection(buttonSection);

//win.add(groupedView);