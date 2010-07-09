var win = Titanium.UI.currentWindow;

var android = Ti.Platform.name == 'android';

var username = Ti.UI.createTextField({
	autocapitalization:Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
	width:300,
	top:10,
	height: android ? 45 : 35,
	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
	hintText:'Google Username'
});
win.add(username);

var password = Ti.UI.createTextField({
	autocapitalization:Titanium.UI.TEXT_AUTOCAPITALIZATION_NONE,
	width:300,
	top:android ? 65 : 55,
	height:android ? 45 : 35,
	borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
	passwordMask:true,
	hintText:'Google Password'
});
win.add(password);

var button = Titanium.UI.createButton({
	title:'Test Login Cookie',
	top: android ? 120 : 100,
	width:300,
	height: android ? 45 : 40
});
win.add(button);

var label = Titanium.UI.createLabel({
	text:'Please login',
	font:{fontSize:18},
	color:'white',
	width:250,
	height:'auto',
	textAlign:'center'
});

var navActInd = Titanium.UI.createActivityIndicator();
win.setRightNavButton(navActInd);


var gReader = 
{ 
	Username:null, 
	Password:null,
	Sid:null, 
	Auth:null,
	Token:null, 
	getSid : function()
	{
		var requestUrl = 'https://www.google.com/accounts/ClientLogin?service=reader&Email=' + Username + '&Passwd=' + Password;
		var MyRequest = Ti.Network.createHTTPClient(); 
		MyRequest.open('GET', requestUrl);
		MyRequest.onerror = function(e) {
			Ti.API.info("Error: " + e.error);
			label.text = "Error: " + e.error + "; (Http status " + this.status + ")";
			navActInd.hide();
		};
		MyRequest.onload = function() 
		{ 
			try
			{ 
				var results = this.responseText; 
				Ti.API.info("Request result: "+results);
				var tokens = results.split("\n");
				for (var c=0;c<tokens.length;c++)
				{
					var token = tokens[c];
					var kv = token.split("=");
					if (kv[0]=='SID')
					{
						gReader.Sid = kv[1];
					}
					if (kv[0]=='Auth') {
						gReader.Auth = kv[1];
					}
				}
				gReader.getToken(); //Get Token 
			} 
			catch(err) 
			{ 
				Ti.API.info('>>>>>>> Error In getSid ' + err ); 
				navActInd.hide();
				label.text="Failed: "+err;
			} 
		};
		MyRequest.send(); 
	}, 

	getToken: function()
	{ 
		var tokenUrl = 'http://www.google.com/reader/api/0/token'; 
		var tokenRequest = Ti.Network.createHTTPClient(); 
		tokenRequest.open('GET', tokenUrl);

		tokenRequest.onload = function() 
		{ 
			navActInd.hide();
			try
			{ 
				var results = this.responseText; 
				gReader.Token=results; 
								
				label.text = /^[a-zA-Z0-9-]+$/.test(gReader.Token) ? ("Passed: "+results) : ("Failed: "+results);
			} 
			catch(err) { 
				Ti.API.info('>>>>>>> Error In getToken ' + err ); 
				label.text="Failed: "+err;
			} 
		};
		var requestCookies = "SID=" + gReader.Sid; 
		var authorization = "GoogleLogin auth=" + gReader.Auth;
		tokenRequest.setRequestHeader("Cookie", requestCookies); 
		tokenRequest.setRequestHeader("Authorization", authorization);
		tokenRequest.send(); 
	}, 
	connect : function(username,password)
	{ 
		Username=username; 
		Password=password; 
		gReader.getSid(); //Get SID 
	} 
};



var scrollView = Titanium.UI.createScrollView({
	top: android ? 180 : 150,
	contentHeight:'auto',
	contentWidth:'auto',
	backgroundColor:'#13386c',
	width:300,
	height:200,
	borderRadius:10
});
win.add(scrollView);

scrollView.add(label);


button.addEventListener('click', function()
{
	label.text = "Testing Cookie";
	navActInd.show();
	password.blur();
	gReader.connect(username.value,password.value);
});



