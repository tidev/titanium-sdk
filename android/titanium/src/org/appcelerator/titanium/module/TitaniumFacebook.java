/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.module;

import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumFacebook;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumJSEventManager;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONStringer;

import org.appcelerator.titanium.module.facebook.FBActivity;
import org.appcelerator.titanium.module.facebook.FBActivityDelegate;
import org.appcelerator.titanium.module.facebook.FBDialog;
import org.appcelerator.titanium.module.facebook.FBFeedDialog;
import org.appcelerator.titanium.module.facebook.FBLoginButton;
import org.appcelerator.titanium.module.facebook.FBLoginDialog;
import org.appcelerator.titanium.module.facebook.FBPermissionDialog;
import org.appcelerator.titanium.module.facebook.FBRequest;
import org.appcelerator.titanium.module.facebook.FBSession;
import org.appcelerator.titanium.module.facebook.FBStreamDialog;
import org.appcelerator.titanium.module.facebook.FBDialog.FBDialogDelegate;
import org.appcelerator.titanium.module.facebook.FBRequest.FBRequestDelegate;
import org.appcelerator.titanium.module.facebook.FBSession.FBSessionDelegate;

import android.webkit.WebView;
import android.app.Activity;
import android.content.Intent;

/**
 * Titanium Facebook Module implementation
 *
 * @author Jeff Haynie
 */
public class TitaniumFacebook extends TitaniumBaseModule implements ITitaniumFacebook, FBActivityDelegate
{
	private static final String LCAT = "TiFacebook";
	private static final boolean DBG = TitaniumConfig.LOGD;

	//public static final String EVENT_SETUP = "setup";

	//protected TitaniumJSEventManager eventManager;
   private FBSession session;

   private String setupCallback;
	private String loginCallback;
	private String logoutCallback;


	public TitaniumFacebook(TitaniumModuleManager manager, String moduleName)
	{
		super(manager, moduleName);
		//eventManager = new TitaniumJSEventManager(manager);
		//eventManager.supportEvent(EVENT_SETUP);
		
      FBActivity.registerActivity("login_dialog", this);
      FBActivity.registerActivity("permission_dialog", this);
      FBActivity.registerActivity("feed_dialog", this);
      FBActivity.registerActivity("stream_dialog", this);
	}

	@Override
	public void register(WebView webView) 
	{
		String name = super.getModuleName();
		if (DBG) 
		{
			Log.d(LCAT, "Registering TitaniumFacebook as " + name);
		}
		webView.addJavascriptInterface((ITitaniumFacebook) this, name);
	}

	public void setup(String key, String secret, String callback)
	{
		Log.d(LCAT,"setup called with key: "+key+", secret: "+secret+", callback: "+callback);

		this.setupCallback = callback;

      session = FBSession.getSessionForApplication_secret(key, secret, new FBSessionDelegateImpl());
		boolean logged_in = session.resume(getContext());
		try
		{
			JSONObject event = new JSONObject();
			event.put("success", true);
			event.put("loggedin",logged_in);
			invokeUserCallback(callback,event.toString());
		}
		catch(JSONException ex)
		{
			ex.printStackTrace();
		}
	}

	public boolean isLoggedIn()
	{
		if (session!=null)
		{
			return session.isConnected();
		}
		return false;
	}
	
	public long getUserId()
	{
		if (session!=null)
		{
			return session.getUid();
		}
		return 0L;
	}

	public void query(String fql, String callback)
	{
		Map<String, String> params = Collections.singletonMap("query", fql);
      FBRequest.requestWithDelegate(new FBQueryRequestDelegateImpl(callback)).call(
              "facebook.fql.query", params);
	}
	
	public void execute(String method, String params, String data, String callback)
	{
	}

	public void login(String callback)
	{
		this.logoutCallback = callback;
		if (isLoggedIn())
		{
			try
			{
				JSONObject event = new JSONObject();
				event.put("success", true);
				event.put("state","login");
				loggedIn(event);
			}
			catch(JSONException ex)
			{
				ex.printStackTrace();
			}
		}
		else
		{
			this.loginCallback = callback;
			Activity activity = getActivity();
			Intent intent = new Intent(activity, FBActivity.class);
         intent.setAction("login_dialog");
			intent.putExtra("callback",callback);
         activity.startActivityForResult(intent, 1);
		}
	}
	
	public void logout(String callback)
	{
		this.logoutCallback = callback;
		if (isLoggedIn())
		{
			session.logout(getContext());
		}
		else 
		{
			try
			{
				JSONObject event = new JSONObject();
				event.put("success", true);
				event.put("state","logout");
				loggedOut(event);
			}
			catch(JSONException ex)
			{
				ex.printStackTrace();
			}
		}
	}
	
	public boolean hasPermission(String permission)
	{
		if (session!=null)
		{
			return session.hasPermission(permission);
		}
		return false;
	}
	
	public void requestPermission(String permission, String callback)
	{
		if (hasPermission(permission))
		{
			try
			{
				JSONObject event = new JSONObject();
				event.put("success", true);
				event.put("permission",permission);
				invokeUserCallback(callback,event.toString());
			}
			catch(JSONException ex)
			{
				ex.printStackTrace();
			}
		}
		else
		{
			Activity activity = getActivity();
			Intent intent = new Intent(activity, FBActivity.class);
         intent.setAction("permission_dialog");
			intent.putExtra("permission",permission);
			intent.putExtra("callback",callback);
         activity.startActivityForResult(intent, 1);
		}
	}
	
	public void publishStream(String title, String data, String target, String callback)
	{
		Activity activity = getActivity();
		Intent intent = new Intent(activity, FBActivity.class);
      intent.setAction("stream_dialog");
		intent.putExtra("callback",callback);
		intent.putExtra("userMessagePrompt",title);
		intent.putExtra("targetId",target);
		intent.putExtra("attachment",data);
		//intent.putExtra("actionLinks",actionLinks);
      activity.startActivityForResult(intent, 1);
	}
	
	public void publishFeed(long templateBundleId, String data, String body, String callback)
	{
		Activity activity = getActivity();
		Intent intent = new Intent(activity, FBActivity.class);
      intent.setAction("feed_dialog");
		intent.putExtra("callback",callback);
		intent.putExtra("templateId",templateBundleId);
		intent.putExtra("templateData",data);
		intent.putExtra("bodyGeneral",body);
//		intent.putExtra("userMessagePrompt",userMessagePrompt);
      activity.startActivityForResult(intent, 1);
	}

	//-------------------------------------------------------------------------------------------------------------//
	//-------------------------------------------------------------------------------------------------------------//
	
	private void loggedIn(JSONObject event)
	{
		 if (loginCallback!=null)
		 {
			 invokeUserCallback(loginCallback,event.toString());
			 loginCallback = null; // one-shot
		 }
		 if (setupCallback!=null) invokeUserCallback(setupCallback,event.toString());
	}
	
	private void loggedOut(JSONObject event)
	{
		 if (logoutCallback!=null)
		 {
			 invokeUserCallback(logoutCallback,event.toString());
			 logoutCallback = null; // one-shot
		 }
		 if (setupCallback!=null) invokeUserCallback(setupCallback,event.toString());
	}
	
   public void forward(String action, Activity activity)
   {
       Intent data = activity.getIntent();
       FBDialog dialog = null;
       
       if (action.equals("permission_dialog"))
       {
           String permission = data.getStringExtra("permission");
           dialog = new FBPermissionDialog(activity, session, permission);
       }
       else if (action.equals("login_dialog"))
       {
           dialog = new FBLoginDialog(activity, session);
       }
       else if (action.equals("feed_dialog"))
       {
           String templateId = data.getStringExtra("templateId");
           String templateData = data.getStringExtra("templateData");
           String bodyGeneral = data.getStringExtra("bodyGeneral");
           String userMessagePrompt = data.getStringExtra("userMessagePrompt");
           dialog = new FBFeedDialog(activity, session, templateId, templateData, bodyGeneral, userMessagePrompt);
       }
       else if (action.equals("stream_dialog"))
       {
           String attachment = data.getStringExtra("attachment");
           String actionLinks = data.getStringExtra("actionLinks");
           String targetId = data.getStringExtra("targetId");
           String userMessagePrompt = data.getStringExtra("userMessagePrompt");
           dialog = new FBStreamDialog(activity, session, attachment, actionLinks, targetId, userMessagePrompt);
       }
       if (dialog!=null)
       {
           activity.setContentView(dialog);
           dialog.show();
       }
		 else
		 {
			Log.e(LCAT,"Error finding action: "+action);
		 }
   }


   private final class FBSessionDelegateImpl extends FBSessionDelegate
   {
       public void session_didLogin(FBSession session, Long uid)
       {
           Log.i(LCAT, "Facebook session login for " + uid);

           String fql = "select uid,name from user where uid == " + session.getUid();
           String fql2 = "select status_update,photo_upload,sms,create_listing,email,create_event,rsvp_event,publish_stream,read_stream,share_item,create_note from permissions where uid == " + session.getUid();
           
           String json=null;
           try
           {
               json = new JSONStringer().object().key("session").value(fql).key("permissions").value(fql2).endObject().toString();
           }
           catch (JSONException e)
           {
               e.printStackTrace();
           }
           
           Map<String, String> params = Collections.singletonMap("queries", json);
           FBRequest.requestWithDelegate(new FBLoginRequestDelegateImpl()).call("facebook.fql.multiquery", params);
       }

       public void sessionDidLogout(FBSession session)
       {
				try
				{
					JSONObject event = new JSONObject();
					event.put("success", true);
					event.put("state","logout");
					loggedOut(event);
				}
				catch(JSONException e)
				{
					e.printStackTrace();
				}
       }
   }

   private final class FBLoginRequestDelegateImpl extends FBRequestDelegate
   {
       @SuppressWarnings("unchecked")
       public void request_didLoad(FBRequest request, Object result)
       {
           String name = null;
			  long uid = 0;

           if (result instanceof JSONArray)
           {
               JSONArray jsonArray = (JSONArray) result;
               try
               {
                   for (int c=0;c<jsonArray.length();c++)
                   {
                       JSONObject jo = jsonArray.getJSONObject(c);
                       String item = jo.getString("name");
                       JSONObject items = jo.getJSONArray("fql_result_set").getJSONObject(0);
                       if (item.equals("permissions"))
                       {
                           // set the permissions on the session
                           Map<String,String> perms = new HashMap<String,String>();
                           Iterator iter = items.keys();
                           while(iter.hasNext())
                           {
                               String key = (String)iter.next();
                               String value = items.getString(key);
                               perms.put(key, value);
                           }
                           session.setPermissions(perms);
                       }
                       else
                       {
                           name = items.getString("name");
                           uid = items.getLong("uid");
                       }
                   }

						 JSONObject event = new JSONObject();
						 event.put("success", true);
						 event.put("uid", uid);
						 event.put("state","login");
						 loggedIn(event);
               }
               catch (JSONException e)
               {
						e.printStackTrace();
               }
           }
       }

       public void request_didFailWithError(FBRequest request, Throwable error)
       {
				try
				{
					JSONObject event = new JSONObject();
					event.put("success", false);
					event.put("message", error.getMessage());
					event.put("state","login");
					loggedIn(event);
				}
				catch(JSONException e)
				{
					 e.printStackTrace();
				}
       }
   }

   private final class FBQueryRequestDelegateImpl extends FBRequestDelegate
   {
		 private final String callback;
		
		 FBQueryRequestDelegateImpl(String callback)
		 {
				this.callback = callback;
		 }
       @SuppressWarnings("unchecked")
       public void request_didLoad(FBRequest request, Object result)
       {
				try
				{
					JSONObject event = new JSONObject();
					event.put("success", true);
					event.put("data", result);
					invokeUserCallback(callback,event.toString());
				}
				catch (JSONException e)
				{
			   	e.printStackTrace();
				}
       }

       public void request_didFailWithError(FBRequest request, Throwable error)
       {
				try
				{
					JSONObject event = new JSONObject();
					event.put("success", false);
					event.put("message", error.getMessage());
					invokeUserCallback(callback,event.toString());
				}
				catch(JSONException e)
				{
					e.printStackTrace();
				}
       }
   }
}
