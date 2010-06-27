var win = Titanium.UI.currentWindow;

var annotation = Titanium.Map.createAnnotation({
	latitude:42.334537,
	longitude:-71.170101,
	title:"Boston College",
	subtitle:'Newton Campus, Chestnut Hill, MA',
	animate:true,
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

// read in our routes from a comma-separated file
var f = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory,'examples','route.csv');
var csv = f.read();
var points = [];
var lines = csv.toString().split("\n");
for (var c=0;c<lines.length;c++)
{
	var line = lines[c];
	var latlong = line.split(",");
	if (latlong.length > 1)
	{
		var lat = latlong[0];
		var lon = latlong[1];
		var entry = {latitude:lat,longitude:lon};
		points[c]=entry;
	}
}

// route object
var route = {
	name:"boston",
	points:points,
	color:"red",
	width:4
};

// add a route
mapview.addRoute(route);

win.add(mapview);

// when you click the logo, remove the route
annotation.addEventListener('click',function()
{
	mapview.removeRoute(route);
});
