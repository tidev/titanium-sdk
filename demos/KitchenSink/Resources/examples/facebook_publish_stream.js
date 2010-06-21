var win = Ti.UI.currentWindow;
//
// Login Button
//
var fbButton = Titanium.Facebook.createLoginButton({
	'style':'wide',
	'apikey':'9494e611f2a93b8d7bfcdfa8cefdaf9f',
	'sessionProxy':'http://api.appcelerator.net/p/fbconnect/',
	bottom:10
});
win.add(fbButton);

var b1 = Ti.UI.createButton({
	title:'Publish Stream',
	width:200,
	height:40,
	top:10
});
win.add(b1);

var b2 = Ti.UI.createButton({
	title:'Publish Status',
	width:200,
	height:40,
	top:60
});
win.add(b2);

b2.addEventListener('click', function()
{
	if (Titanium.Facebook.isLoggedIn()==false)
	{
		Ti.UI.createAlertDialog({title:'Facebook', message:'Login before publishing to your stream'}).show();
		return;
	}

	Titanium.Facebook.publishStream("Set your status",null,null,function(r)
	{
		Titanium.API.info("received status response = "+JSON.stringify(r));
		if (r.success)
		{
			Ti.UI.createAlertDialog({title:'Facebook', message:'Your status was published'}).show();
		}
		else
		{
			Ti.UI.createAlertDialog({title:'Facebook', message:'Error ' + r.error}).show();
			
		}
	});

	
});

b1.addEventListener('click', function()
{
	if (Titanium.Facebook.isLoggedIn()==false)
	{
		Ti.UI.createAlertDialog({title:'Facebook', message:'Login before publishing to your stream'}).show();
		return;
	}

	// see http://wiki.developers.facebook.com/index.php/Attachment_(Streams)
	// for description of the contents of this data object
	var data = {
		name:"Facebook Connect for Appcelerator Titanium",
		href:"http://www.appcelerator.com",
		caption:"Testing API",
		description: "Trying the Facebook Connect API ",
		media:[
			{
				type:"image",
				src:"http://img.skitch.com/20091027-dick5esbjx9kg63rnfhtfgdre1.jpg",
				href:"http://www.appcelerator.com"
			}
		],
		properties:
		{
			"Homepage":{
				"text":"Appcelerator Home Page",
				"href":"http://www.appcelerator.com"
			}
		}
	};
	Titanium.Facebook.publishStream("Say something witty",data,null,function(r)
	{
		Titanium.API.info("received publish stream response = "+JSON.stringify(r));
		if (r.success)
		{
			Ti.UI.createAlertDialog({title:'Facebook', message:'Your stream was published'}).show();
		}
		else
		{
			Ti.UI.createAlertDialog({title:'Facebook', message:'Error: ' + r.error}).show();
			
		}
	});

});

