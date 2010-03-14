var win = Titanium.UI.currentWindow;


var username = Ti.UI.createTextField({
	autocapitalization:Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
	width:300,
	top:10,
	height:35,
	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
	hintText:'Foursquare Username'
});
win.add(username);

var password = Ti.UI.createTextField({
	autocapitalization:Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
	width:300,
	top:55,
	height:35,
	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
	passwordMask:true,
	hintText:'Foursquare Password'
});
win.add(password);

var button = Titanium.UI.createButton({
	title:'Get Venues Nearby',
	top:100,
	width:300,
	height:40
});
win.add(button);

var navActInd = Titanium.UI.createActivityIndicator();
win.setRightNavButton(navActInd);

button.addEventListener('click', function()
{
	label.text = "Determining your location...";
	navActInd.show();
	password.blur();
	Ti.API.info("starting geo");
	Titanium.Geolocation.getCurrentPosition(function(e)
	{
		Ti.API.info("received geo response");
		if (e.error)
		{
			alert(e.error);
			return;
		}

		var longitude = e.coords.longitude;
		var latitude = e.coords.latitude;

		label.text = "You are at: "+longitude+"\n"+latitude+"\n\nFinding venues...";
		
		var xhr = Titanium.Network.createHTTPClient();
		xhr.onerror = function(e)
		{
			Ti.API.info("ERROR " + e.error);
			navActInd.hide();
			alert(e.error);
		}
		xhr.onload = function()
		{
			label.hide();
//			Ti.API.info("foursquare response was "+this.responseText);
			
			var resp =  eval('('+this.responseText+')');
			var venues = resp.groups[0].venues;
			for (var i=0;i<venues.length;i++)
			{
				status.text += venues[i].name+'\n\n';

			}
			scrollView.add(status);
			
			navActInd.hide();
		};
		// open the client and encode our URL
		xhr.open('GET','http://api.foursquare.com/v1/venues.json?geolat='+latitude+'&geolong='+longitude);
		// base64 encode our Authorization header
		xhr.setRequestHeader('Authorization','Basic '+Ti.Utils.base64encode(username.value+':'+password.value));

		// send the data
		xhr.send();
		Ti.API.info("sending foursquare API request for "+latitude+","+longitude);
	});
});
var scrollView = Titanium.UI.createScrollView({
	top:150,
	contentHeight:'auto',
	contentWidth:'auto',
	backgroundColor:'#13386c',
	width:300,
	height:200,
	borderRadius:10
});
win.add(scrollView);

var label = Titanium.UI.createLabel({
	text:'Please login',
	font:{fontSize:18},
	color:'white',
	width:250,
	height:'auto',
	textAlign:'center'
});
scrollView.add(label);

var status = Titanium.UI.createLabel({
	font:{fontSize:18},
	color:'white',
	width:250,
	height:'auto',
	top:20,
	text:'',
	textAlign:'center'
});



