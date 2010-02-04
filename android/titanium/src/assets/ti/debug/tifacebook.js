/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

Ti.facebookProxy = window.TitaniumFacebook;

Ti.Facebook = {
	
	setup: function(key,secret,sessionProxy,callback)
	{
		return Ti.facebookProxy.setup(key,transformObjectValue(secret,null),transformObjectValue(sessionProxy,null),registerCallback(this,callback));
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
		Ti.facebookProxy.execute(method,transformObjectValue(params,null),transformObjectValue(data,null),registerOneShot(this, callback));
		switch (method)
		{
			case "comments.add": { Ti.Analytics.featureEvent("tiSocial.Facebook.commentsAdd"); break; }
			case "links.post": { Ti.Analytics.featureEvent("tiSocial.Facebook.linksPost"); break; }
			case "notes.create": { Ti.Analytics.featureEvent("tiSocial.Facebook.notesCreate"); break; }
			case "status.set": // fall through to following case
			case "users.setStatus": { Ti.Analytics.featureEvent("tiSocial.Facebook.setStatus"); break; }
			case "stream.publish": { Ti.Analytics.featureEvent("tiSocial.Facebook.streamPublish"); break; }
			case "video.upload": { Ti.Analytics.featureEvent("tiSocial.Facebook.videoUpload"); break; }
			case "sms.send": { Ti.Analytics.featureEvent("tiSocial.Facebook.smsSend"); break; }
			case "photos.addTag": { Ti.Analytics.featureEvent("tiSocial.Facebook.photosAddTag"); break; }
			case "photos.createAlbum": { Ti.Analytics.featureEvent("tiSocial.Facebook.photosCreateAlbum"); break; }
			case "photos.upload": { Ti.Analytics.featureEvent("tiSocial.Facebook.photosUpload"); break; }
		}
	},
	
	login: function(callback)
	{
		Ti.facebookProxy.login(callback ? registerOneShot(this, callback) : null);
		Ti.Analytics.featureEvent("tiSocial.Facebook.login");
	},
	
	logout: function(callback)
	{
		Ti.facebookProxy.logout(callback ? registerOneShot(this, callback) : null);
		Ti.Analytics.featureEvent("tiSocial.Facebook.logout");
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
		Ti.Analytics.featureEvent("tiSocial.Facebook.publishStream");
	},
	
	publishFeed: function(templateBundleId, data, body, callback)
	{
		var o = transformObjectValue(data, null);
		var json = o ? Ti.JSON.stringify(o) : null;
		var tid = typeof(templateBundleId)=='string' ? parseLong(templateBundleId) : templateBundleId;
		Ti.facebookProxy.publishFeed(tid, json, body, callback ? registerOneShot(this, callback) : null);
		Ti.Analytics.featureEvent("tiSocial.Facebook.publishFeed");
	},
	
	createLoginButton: function(props)
	{
		var el = document.getElementById(props.id);
		var s = props.style || 'normal';
		var b = (s == 'normal') ? '' : '2';
		var logged_in = this.isLoggedIn();
		var l = (logged_in ? 'logout' : 'login');
    	var imgsrc = 'modules/facebook/images/' + l + b + '.png';
		var btnhtml = "<button id='ti_fbconnect_button' style='border:none;margin:0;padding:0;background:none;-webkit-tap-highlight-color: rgba(0,0,0,0.0);'><img id='ti_fbconnect_button_img' style='margin:0;padding:0;-webkit-tap-highlight-color: rgba(0,0,0,0.0);' src='"+imgsrc+"'/></button>";
		el.innerHTML = btnhtml;
		var img = document.getElementById('ti_fbconnect_button_img');
		var self = this;
		var listeners = {};
		function updateButton(state)
		{
			var lo = typeof(state)!='undefined' ? state : logged_in;
			var part = lo ? 'logout' : 'login' + b;
			img.src = 'modules/facebook/images/' + part + '.png';
			img.ontouchstart = function()
			{
				img.src = 'modules/facebook/images/' + part + '_down.png';
			};
			img.ontouchend = function()
			{
				img.src = 'modules/facebook/images/' + part + '.png';
			};
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
			var cur_login = logged_in;
			if (evt.state == 'login' || evt.loggedin)
			{
				logged_in = evt.success;
			}
			else
			{
				logged_in = false;
			}
			if (logged_in)
			{
				updateButton(true);
				if (cur_login!=logged_in) 
				{
					fire('login',evt);
				}
			}
			else
			{
				updateButton(false);
				if (cur_login!=logged_in) 
				{
					fire('logout',evt);
				}
			}
		};
		img.onclick = function()
		{
			if (logged_in)
			{
				self.logout(stateChange);
			}
			else
			{
				self.login(stateChange);
			}
		};
		logged_in = this.setup(props.apikey,props.secret,props.sessionProxy,stateChange);
		updateButton(logged_in);
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
