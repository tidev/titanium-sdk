var win = Ti.UI.currentWindow;
win.backgroundColor = '#fff';
win.barColor = '#385292';

//
// Create table view and search bar
//
var search = Titanium.UI.createSearchBar({barColor:'#385292', showCancel:true});
search.addEventListener('cancel', function(e)
{
   search.blur();
});

var tableView = Ti.UI.createTableView({search:search,minRowHeight:100});
tableView.addEventListener('click', function()
{
	var rowData = eventObject.rowData;
	if (eventObject.searchMode)
	{
		search.blur();
	}
	
	Titanium.Facebook.publishStream("What to say?",null,rowData.uid,function(pr)
	{
		Ti.API.info("received publish stream response = "+Titanium._JSON(pr));
		
		if (pr.success)
		{
			playEarcon();
		}
		
		Titanium.API.info("received wall response = "+Titanium._JSON(pr));
		// var message = pr.cancel ? 'Message Cancelled' : pr.success ? 'Message Posted' : 'Message Failed';
		// var data = {
		// 		backgroundColor:'#385292', 
		// 		selectedBackgroundColor:'#385292',
		// 		message:message,
		// 		layout:[{
		// 			name:'message', 
		// 			type:'text', 
		// 			color:'#fff', 
		// 			fontWeight:'bold', 
		// 			fontSize:20,
		// 			top:40,
		// 			height:27,
		// 			left:50
		// 		}]
		// };
		// tableView.updateRow(eventObject.index,data,{
		// 		animationStyle:Titanium.UI.iPhone.RowAnimationStyle.LEFT
		// });
		// setTimeout(function()
		// {
		// 	tableView.updateRow(eventObject.index,rowData,{
		// 			animationStyle:Titanium.UI.iPhone.RowAnimationStyle.RIGHT
		// 	});
		// },cancelDelay);
	});
	
}) ;
win.add(tableView);

//
// create toolbar buttons
//
var refreshButton = Titanium.UI.createButton({
	systemButton:Titanium.UI.iPhone.SystemButton.REFRESH
});

var feedButton = Titanium.UI.createButton({
	title:'Event',
	style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
});

var streamButton = Titanium.UI.createButton({
	title:'Stream',
	style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
});

var statusButton = Titanium.UI.createButton({
	title:'Status',
	style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
});
var flexSpace = Titanium.UI.createButton({
	systemButton:Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
});
var logout = Titanium.UI.createButton({
	title:'Logout',
	style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
});
logout.addEventListener('click',function()
{
	Ti.API.info('logout clickd')
	logout();
});

// create activity indicator and sound for iphone
var sound = null;
var activityIndicator = Titanium.UI.createActivityIndicator();
var isAndroid = Titanium.Platform.name == 'android';
var cancelDelay;

if (!isAndroid)
{
	// CAF is a specific iphone sound format - ignore for android for now
	sound = Titanium.Media.createSound({url:'../pop.caf'});
	cancelDelay = 750;
}
else
{
  	activityIndicator.setMessage('Loading Stream...');
    activityIndicator.setLocation(Titanium.UI.ActivityIndicator.DIALOG);
    activityIndicator.setType(Titanium.UI.ActivityIndicator.INDETERMINANT);
	cancelDelay = 5;
}


// just play the facebook earcon -- nice little example of combining sounds
function playEarcon()
{
	if (sound) sound.play();
}

function logout()
{
	Ti.API.info('Logout clicked');
	Titanium.Facebook.logout(loggedOut);

}


function fetchStream()
{
	if (!isAndroid)
	{
		win.setRightNavButton(activityIndicator);
		activityIndicator.show();
	}
	else
	{
		activityIndicator.show();
	}
	
	Titanium.Facebook.query("SELECT uid, name, pic_square, status FROM user where uid IN (SELECT uid2 FROM friend WHERE uid1 = " + Titanium.Facebook.getUserId() + ") order by last_name",function(r)
	{
		try
		{
			var data = [];
			for (var c=0;c<r.data.length;c++)
			{
				var row = r.data[c];
				
				var tvRow = Ti.UI.createTableViewRow({
					height:'auto',
					selectedBackgroundColor:'#fff',
					backgroundColor:'#fff'
				});
				
				var imageView = Ti.UI.createImageView({
					url:row.pic_square == null ? 'images/custom_tableview/user.png' : row.pic_square,
					left:10,
					width:50,
					height:50
				});
				tvRow.add(imageView);
				
				var b = Ti.UI.createButton({
					right:5,
					width:36,
					height:34,
					backgroundImage:'../images/custom_tableview/commentButton.png'
				});
				tvRow.add(b);
				
				var userLabel = Ti.UI.createLabel({
					font:{fontSize:16, fontWeight:'bold'},
					left:70,
					top:5,
					right:5,
					height:20,
					color:'#576996',
					text:row.name
				});
				tvRow.add(userLabel);

				var statusLabel = Ti.UI.createLabel({
					font:{fontSize:13},
					left:70,
					top:25,
					right:50,
					height:'auto',
					color:'#222',
					text:(!row.status || !row.status.message ? 'No status message' : row.status.message)
				});
				tvRow.add(statusLabel);
				
				tvRow.uid = row.uid
				
				data[c] = tvRow;
			}
			tableView.setData(data,{animationStyle:Titanium.UI.iPhone.RowAnimationStyle.DOWN});
			Ti.API.info('setting data ' + data.length + ' rows')

			activityIndicator.hide();
			win.setRightNavButton(refreshButton);
			
	
		}
		catch(EX)
		{
			Titanium.API.error("Error loading friends UI: "+EX);
		}
	});
}

function loggedOut()
{
	Ti.API.info('LoggedOut called');
	loginWindow.open({modal:true})
	win.setToolbar(null);
	
};
function loggedIn()
{
	Ti.API.info('LoggedIn called');
	
	loginWindow.close();
	if (!Titanium.Facebook.hasPermission("read_stream"))
	{
		win.setRightNavButton(activityIndicator);
		
		Titanium.Facebook.requestPermission("read_stream",function(evt)
		{
			if (evt.success)
			{
				fetchStream();
			}
		});
	}
	else
	{
		fetchStream();
	}
	
	initialView = false;
	
	if (!isAndroid)
	{
		win.setRightNavButton(refreshButton);
		win.setToolbar([flexSpace,logout,statusButton,feedButton,streamButton,flexSpace]);
	}
	else
	{
		var menu = Titanium.UI.createMenu();
		menu.addItem('Update Status',pushStatus,Titanium.UI.Android.SystemIcon.ADD);
		menu.addItem('Post Feed',postActivity,Titanium.UI.Android.SystemIcon.SHARE);
		menu.addItem('Post Stream',postStream,Titanium.UI.Android.SystemIcon.SEND);
		menu.addItem('Logout',logout,Titanium.UI.Android.SystemIcon.STOP);
		Titanium.UI.setMenu(menu);
	}
	
}



function postActivity()
{
	var id = 167397171331;
	var data = {"event":"Fake Event 2010","eventURL":"http://www.appcelerator.com"};
	Titanium.Facebook.publishFeed(id,data,"Hello, this is a test from Titanium FBConnect!",function(r)
	{
		Titanium.API.info("received response = "+Titanium._JSON(r));
		if (r.success)
		{
			playEarcon();
		}
	});
}

function postStream()
{
	try
	{
		// see http://wiki.developers.facebook.com/index.php/Attachment_(Streams)
		// for description of the contents of this data object
		var data = {
			name:"Facebook Connect for Appcelerator Titanium",
			href:"http://www.appcelerator.com",
			caption:"Testing API",
			description: "It worked",
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
		Titanium.Facebook.publishStream("Share some love...",data,null,function(r)
		{
			Titanium.API.info("received publish stream response = "+Titanium._JSON(r));
			if (r.success)
			{
				playEarcon();
			}
		});
	}
	catch(E)
	{
		alert(E);
	}
}

function pushStatus()
{
	// pass null as data parameter for publishing to your stream - this will set your
	// status. the dialog will collect the status to display on your wall
	Titanium.Facebook.publishStream("Set your status",null,null,function(r)
	{
		Titanium.API.info("received status response = "+Titanium._JSON(r));
		if (r.success)
		{
			playEarcon();
		}
	});
}

function showFriends()
{
	win.setRightNavButton(activityIndicator);
}

feedButton.addEventListener('click',postActivity);
streamButton.addEventListener('click',postStream);
statusButton.addEventListener('click',pushStatus);
refreshButton.addEventListener('click',fetchStream);

var loginWindow = Ti.UI.createWindow({title:'Facebook Login', barColor:'#385292'});

var loginButton = Titanium.Facebook.createLoginButton({
	'style':'wide',
	'apikey':'9494e611f2a93b8d7bfcdfa8cefdaf9f',
	'sessionProxy':'http://api.appcelerator.net/p/fbconnect/'
});
loginWindow.add(loginButton);

loginButton.addEventListener('login',loggedIn);
loginButton.addEventListener('logout', loggedOut);

if (Titanium.Facebook.isLoggedIn())
{
	Ti.API.info('User is logged in');
	loggedIn();
}
else
{
	Ti.API.info('User is not logged in')
	loggedOut();
}

