var win = Titanium.UI.currentWindow;

var android = Ti.Platform.name == 'android';

var username = Ti.UI.createTextField({
	autocapitalization:Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
	width:300,
	top:10,
	height: android ? 45 : 35,
	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
	hintText:'Twitter Username'
});
win.add(username);

var password = Ti.UI.createTextField({
	autocapitalization:Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
	width:300,
	top: android ? 65 : 55,
	height: android ? 45 : 35,
	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
	passwordMask:true,
	hintText:'Twitter Password'
});
win.add(password);

var button = Titanium.UI.createButton({
	title:'Get Status',
	top: android ? 120 : 100,
	width:300,
	height: android ? 45 : 40
});
win.add(button);

var statusLabel = Titanium.UI.createLabel({
	font:{fontSize:18},
	color:'white',
	width:250,
	height:'auto',
	top:20,
	text:'',
	textAlign:'center'
});

var label = Titanium.UI.createLabel({
	text:'No status',
	font:{fontSize:18},
	color:'white',
	width:250,
	height:'auto',
	textAlign:'center'
});

var scrollView = Titanium.UI.createScrollView({
	top: android ? 180 : 150,
	contentHeight:'auto',
	contentWidth:'auto',
	backgroundColor:'#13386c',
	width:300,
	height:200,
	borderRadius:10
});

button.addEventListener('click', function()
{
	password.blur();
	var xhr = Titanium.Network.createHTTPClient();
	xhr.onerror = function(e)
	{
		alert("ERROR " + e.error);
	};
	xhr.onload = function()
	{
		label.hide();
		var resp =  eval('('+this.responseText+')');
		for (var i=0;i<resp.length;i++)
		{
			statusLabel.text += resp[i].user.name + '\n' + resp[i].text + '\n\n';

		}
		scrollView.add(statusLabel);
	};
	// open the client
	xhr.open('GET','http://'+username.value+':'+password.value+'@twitter.com/statuses/friends_timeline.json?count=5');

	// send the data
	xhr.send();
});

win.add(scrollView);
scrollView.add(label);

