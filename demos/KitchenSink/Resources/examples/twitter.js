var win = Titanium.UI.currentWindow;

var username = Ti.UI.createTextField({
	autocapitalization:Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
	width:300,
	top:10,
	height:35,
	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
	hintText:'Twitter Username'
});
win.add(username);

var password = Ti.UI.createTextField({
	autocapitalization:Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
	width:300,
	top:55,
	height:35,
	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
	passwordMask:true,
	hintText:'Twitter Password'
});
win.add(password);

var button = Titanium.UI.createButton({
	title:'Get Status',
	top:100,
	width:300,
	height:40
});
win.add(button);
button.addEventListener('click', function()
{
	var xhr = Titanium.Network.createHTTPClient();
	
	xhr.onload = function()
	{
		label.hide();
		var resp =  eval('('+this.responseText+')');
		for (var i=0;i<resp.length;i++)
		{
			status.text += resp[i].user.name + '\n' + resp[i].text + '\n\n';
			
		}
		scrollView.add(status);
	};
	// open the client
	xhr.open('GET','http://'+username.value+':'+password.value+'@twitter.com/statuses/friends_timeline.json?count=5');
	
	// send the data
	xhr.send();	
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
	text:'No status',
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
	textAlign:'center'
});
