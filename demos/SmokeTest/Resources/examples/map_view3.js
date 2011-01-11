var win = Titanium.UI.currentWindow;

var annotation = Titanium.Map.createAnnotation({
	latitude:42.334537,
	longitude:-71.170101,
	title:"Drag Me",
	animate:true,
	draggable:true,
	leftButton:'../images/atlanta.jpg',
	image:"../images/boston_college.png"
});

var boston = {latitude:42.334537,longitude:-71.170101,latitudeDelta:0.010, longitudeDelta:0.018};

//
// CREATE MAP VIEW
//
var mapview = Titanium.Map.createView({
	mapType: Titanium.Map.STANDARD_TYPE,
	region: boston,
	animate:true,
	regionFit:true,
	userLocation:true,
	annotations:[annotation]
});


win.add(mapview);

// map view pin change drag state event listener
mapview.addEventListener('pinchangedragstate', function(evt)
{
	if (evt.oldState == "dragging") {
		annotation.subtitle = [annotation.latitude, ':', annotation.longitude].join(' ');
	}
	Ti.API.info(['newState:', evt.newState, 'oldState', evt.oldState].join(' '));
});