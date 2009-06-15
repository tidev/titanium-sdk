/**
 * Appcelerator Mobile Developer
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 */

var sso_url = 'https://api.appcelerator.net/p/v1/sso-login';

function showProfileDetail()
{
	$('login_error').style.visibility='hidden';
	$('login_table').style.display='none';
	$('profile_table').style.display='block';
}
function showLogin()
{
	$('login_error').style.visibility='hidden';
	$('login_table').style.display='block';
	$('profile_table').style.display='none';
}

window.onload = function()
{
	if (Titanium.App.Properties.getString("login.sessionid"))
	{
		showProfileDetail();
	}

	Titanium.Network.addConnectivityListener(function(online,type)
	{
		Titanium.API.info("network status change = "+online+", type="+type);
	});

	$('logout').onclick = function()
	{
		showLogin();
		Titanium.App.Properties.setString("login.sessionid",null);
		Titanium.App.Properties.setInt("login.uid",-1);
		$('pw').value = '';
	};

	$('login').onclick = function()
	{
		Titanium.API.debug("Login clicked?");
		$('login_error').innerHTML = "Attempting login...";
		$('login_error').style.visibility='visible';

		var un = $('un').value;
		var pw = $('pw').value;
		var pwe = encode64(hex_sha1(un+"-"+pw));

		var xhr = Titanium.Net.createHTTPClient();
		xhr.onreadystatechange = function()
		{
			if (this.readyState == 4)
			{
				var results = eval('('+this.responseText+')');
				if (results.success)
				{
					showProfileDetail();
					// if success, save them off
					Titanium.App.Properties.setString("login.sessionid",results.sid);
					Titanium.App.Properties.setInt("login.uid",results.uid);
				}
				else
				{
					$('login_error').innerHTML = "I'm sorry, please try your login again";
				}
			}
		};
		xhr.open('POST',sso_url);
		xhr.send('un='+encodeURIComponent(un)+'&pw='+pwe);
	};

};
