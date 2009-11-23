/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

Ti.facebookProxy = window.TitaniumFacebook;

Ti.Facebook = {
	
	setup: function(key,secret,callback)
	{
		Ti.facebookProxy.setup(key,secret,registerCallback(this,callback));
	},
	
	isLoggedIn: function()
	{
		return Ti.facebookProxy.isLoggedIn();
	},
	
	getUserId: function()
	{
		return Ti.facebookProxy.getUserId();
	},
	
	query: function(fql, callback)
	{
		Ti.facebookProxy.query(fql,registerOneShot(this, callback));
	},
	
	execute: function(method,params,data,callback)
	{
		Ti.facebookProxy.execute(method,params,data,registerOneShot(this, callback));
	},
	
	login: function(callback)
	{
		Ti.facebookProxy.login(callback ? registerOneShot(this, callback) : null);
	},
	
	logout: function(callback)
	{
		Ti.facebookProxy.logout(callback ? registerOneShot(this, callback) : null);
	},

	hasPermission: function(permission)
	{
		return Ti.facebookProxy.hasPermission(permission);
	},
	
	requestPermission: function(permission, callback)
	{
		Ti.facebookProxy.requestPermission(permission, registerOneShot(this, callback));
	},
	
	publishStream: function(title, data, target, callback)
	{
		var o = transformObjectValue(data, null);
		var json = o ? Ti.JSON.stringify(o) : null;
		Ti.facebookProxy.publishStream(title, json, target, callback ? registerOneShot(this, callback) : null);
	},
	
	publishFeed: function(templateBundleId, data, body, callback)
	{
		var o = transformObjectValue(data, null);
		var json = o ? Ti.JSON.stringify(o) : null;
		var tid = typeof(templateBundleId)=='string' ? parseLong(templateBundleId) : templateBundleId;
		Ti.facebookProxy.publishFeed(tid, json, body, callback ? registerOneShot(this, callback) : null);
	},
	
	createLoginButton: function(props)
	{
		var el = document.getElementById(props.id);
		el.id = "ti_fbconnect_button";
		var btn = document.createElement('button');
		var self = this;
		var listeners = {};
		function updateButton(state)
		{
			Ti.API.debug("Facebook updateButton called with "+state);
			if (state)
			{
				btn.innerHTML = state ? 'Logout' : 'Login';
			}
			else
			{
				btn.innerHTML = self.isLoggedIn() ? 'Logout' : 'Login';
			}
		};
		function fire(name,evt)
		{
			Ti.API.debug("Facebook fire called with "+name);
			var l = listeners[name];
			if (l && l.length > 0)
			{
				for (var c=0;c<l.length;c++)
				{
					l[c].call(self,evt);
				}
			}
		};
		function stateChange(evt)
		{
			if (self.isLoggedIn())
			{
				Ti.API.debug("Facebook state changed - logged in");
				updateButton(true);
				fire('login',evt);
			}
			else
			{
				Ti.API.debug("Facebook state changed - logged out");
				updateButton(false);
				fire('logout',evt);
			}
		};
		btn.onclick = function()
		{
			if (self.isLoggedIn())
			{
				self.logout(stateChange);
			}
			else
			{
				self.login(stateChange);
			}
		};
		updateButton();
		var style = props.style;
		el.appendChild(btn);
		this.setup(props.apikey,props.secret,stateChange);
		var obj = 
		{
			addEventListener: function(name,cb)
			{
				var l = listeners[name];
				if (l==null)
				{
					listeners[name]=[cb];
				}
				else
				{
					l.push(cb);
				}
			},
			removeEventListener: function(name,cb)
			{
				var l = listeners[name];
				if (l)
				{
					for (var c=0;c<l.length;c++)
					{
						if (cb==l[c])
						{
							l.splice(1,c);
							break;
						}
					}
				}
			}
		};
		return obj;
	}
};
