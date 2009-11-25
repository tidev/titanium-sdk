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

import org.appcelerator.titanium.TitaniumActivity;
import org.appcelerator.titanium.TitaniumResultHandler;
import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.api.ITitaniumFacebook;
import org.appcelerator.titanium.api.ITitaniumInvoker;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.module.fs.TitaniumBlob;
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
import org.appcelerator.titanium.module.facebook.FBLoginDialog;
import org.appcelerator.titanium.module.facebook.FBPermissionDialog;
import org.appcelerator.titanium.module.facebook.FBRequest;
import org.appcelerator.titanium.module.facebook.FBUtil;
import org.appcelerator.titanium.module.facebook.FBSession;
import org.appcelerator.titanium.module.facebook.FBStreamDialog;
import org.appcelerator.titanium.module.facebook.FBDialog.FBDialogDelegate;
import org.appcelerator.titanium.module.facebook.FBRequest.FBRequestDelegate;
import org.appcelerator.titanium.module.facebook.FBSession.FBSessionDelegate;

import android.webkit.WebView;
import android.app.Activity;
import android.app.ProgressDialog;
import android.content.Intent;
import android.os.Bundle;

/**
 * Titanium Facebook Module implementation
 *
 * @author Jeff Haynie
 */
public class TitaniumFacebook extends TitaniumBaseModule implements ITitaniumFacebook, FBActivityDelegate, TitaniumResultHandler
{
	private static final String LCAT = "TiFacebook";
	private static final boolean DBG = TitaniumConfig.LOGD;

   private FBSession session;
   private ProgressDialog progressDialog;

   private String setupCallback;
	private String loginCallback;
	private String logoutCallback;


	public TitaniumFacebook(TitaniumModuleManager manager, String moduleName)
	{
		super(manager, moduleName);
		
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

	public boolean setup(String key, String secret, String callback)
	{
		Log.d(LCAT,"setup called with key: "+key+", secret: "+secret+", callback: "+callback);

		this.setupCallback = callback;
      this.session = FBSession.getSessionForApplication_secret(key, secret, new FBSessionDelegateImpl());
		boolean loggedIn = session.resume(getContext());
		
		Log.d(LCAT,"setup returned "+loggedIn+" from resume");
		
		return loggedIn;
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
	
	public void execute(String method, String jsonParams, ITitaniumInvoker data, String callback)
	{
		Map<String,String> params = new HashMap<String,String>();
		if (jsonParams!=null)
		{
			try
			{
				JSONObject json = new JSONObject(jsonParams);
				FBUtil.jsonToMap(json,params);
			}
			catch(JSONException ex)
			{
				Log.e(LCAT,"Error in execute with JSON parameter",ex);
			}
		}
		Object dataObj = null;
		if (data!=null)
		{
			dataObj = data.getObject();
		}
      FBRequest.requestWithDelegate(new FBQueryRequestDelegateImpl(callback)).callWithAnyData(method, params, dataObj);
	}
	
	public void login(String callback)
	{
		this.loginCallback = callback;
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
			TitaniumActivity activity = getActivity();
			int resultCode = activity.getUniqueResultCode();
			Intent intent = new Intent(activity, FBActivity.class);
         intent.setAction("login_dialog");
			intent.putExtra("uid",resultCode);
			
			Log.d(LCAT,"CREATED LOGIN UID = "+resultCode);
			getActivity().registerResultHandler(resultCode,this);
         activity.startActivityForResult(intent, resultCode);
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
		Log.d(LCAT,"request permission called for permission: "+permission);
		if (hasPermission(permission))
		{
			Log.d(LCAT,"found cached permission: "+permission);
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
			Log.d(LCAT,"making remote permission call for: "+permission);
			TitaniumActivity activity = getActivity();
			int resultCode = activity.getUniqueResultCode();
			Intent intent = new Intent(activity, FBActivity.class);
         intent.setAction("permission_dialog");
			intent.putExtra("permission",permission);
			intent.putExtra("callback",callback);
			intent.putExtra("uid",resultCode);
			getActivity().registerResultHandler(resultCode,this);
         activity.startActivityForResult(intent, resultCode);
		}
	}
	
	public void publishStream(String title, String data, String target, String callback)
	{
		TitaniumActivity activity = getActivity();
		int resultCode = activity.getUniqueResultCode();
		Intent intent = new Intent(activity, FBActivity.class);
      intent.setAction("stream_dialog");
		intent.putExtra("callback",callback);
		intent.putExtra("userMessagePrompt",title);
		intent.putExtra("targetId",target);
		intent.putExtra("attachment",data);
		//intent.putExtra("actionLinks",actionLinks);
		intent.putExtra("uid",resultCode);
		getActivity().registerResultHandler(resultCode,this);
      activity.startActivityForResult(intent, resultCode);
	}
	
	public void publishFeed(long templateBundleId, String data, String body, String callback)
	{
		TitaniumActivity activity = getActivity();
		int resultCode = activity.getUniqueResultCode();
		Intent intent = new Intent(activity, FBActivity.class);
      intent.setAction("feed_dialog");
		intent.putExtra("callback",callback);
		intent.putExtra("templateId",templateBundleId);
		intent.putExtra("templateData",data);
		intent.putExtra("bodyGeneral",body);
//		intent.putExtra("userMessagePrompt",userMessagePrompt);
		intent.putExtra("uid",resultCode);
		getActivity().registerResultHandler(resultCode,this);
		activity.startActivityForResult(intent, resultCode);
	}
	
	public void onError(TitaniumActivity activity, int requestCode, Exception e)
	{
		  Log.e(LCAT,"onError = "+requestCode,e);
		  getActivity().removeResultHandler(requestCode);
	}

	public void onResult(TitaniumActivity activity, int requestCode, int resultCode, Intent data)
	{
		  Log.d(LCAT,"onResult = "+requestCode+", resultCode="+resultCode+", data = "+data);
		  if (data!=null)
		  {
			  String callback = data.getStringExtra("callback");
			  if (DBG) Log.d(LCAT,"onResult callback = "+callback);
			  if (callback!=null)
			  {
					JSONObject event = new JSONObject();
					try
					{
						event.put("success", resultCode == Activity.RESULT_OK);
						event.put("cancel", resultCode == Activity.RESULT_CANCELED);
					}
					catch(Exception ex)
					{
						ex.printStackTrace();
					}
					invokeUserCallback(callback,event.toString());
					Log.d(LCAT,"Calling post activity event = "+event+" to "+callback);
			  }
		  }
		  getActivity().removeResultHandler(requestCode);
	}

	//-------------------------------------------------------------------------------------------------------------//
	//-------------------------------------------------------------------------------------------------------------//
	
	private void loggedIn(JSONObject event)
	{
		 Log.d(LCAT,"loggedIn => "+event);
		
		 if (loginCallback!=null)
		 {
			 invokeUserCallback(loginCallback,event.toString());
			 loginCallback = null; // one-shot
		 }
		 if (setupCallback!=null) invokeUserCallback(setupCallback,event.toString());
	}
	
	private void loggedOut(JSONObject event)
	{
		 Log.d(LCAT,"loggedOut => "+event);

		 if (logoutCallback!=null)
		 {
			 invokeUserCallback(logoutCallback,event.toString());
			 logoutCallback = null; // one-shot
		 }
		 if (setupCallback!=null) invokeUserCallback(setupCallback,event.toString());
	}
	
   public FBDialog onCreate(String action, Activity activity, Bundle state)
   {
       Intent data = activity.getIntent();
       FBDialog dialog = null;
       
       if (action.equals("permission_dialog"))
       {
           String permission = data.getStringExtra("permission");
           dialog = new FBPermissionDialog(activity, session, this, permission);
       }
       else if (action.equals("login_dialog"))
       {
           dialog = new FBLoginDialog(activity, session, this);
       }
       else if (action.equals("feed_dialog"))
       {
           Long templateId = data.getLongExtra("templateId",0L);
           String templateData = data.getStringExtra("templateData");
           String bodyGeneral = data.getStringExtra("bodyGeneral");
           String userMessagePrompt = data.getStringExtra("userMessagePrompt");
           dialog = new FBFeedDialog(activity, session, this, templateId, templateData, bodyGeneral, userMessagePrompt);
       }
       else if (action.equals("stream_dialog"))
       {
           String attachment = data.getStringExtra("attachment");
           String actionLinks = data.getStringExtra("actionLinks");
           String targetId = data.getStringExtra("targetId");
           String userMessagePrompt = data.getStringExtra("userMessagePrompt");
           dialog = new FBStreamDialog(activity, session, this, attachment, actionLinks, targetId, userMessagePrompt);
       }
       if (dialog!=null)
       {
           activity.setContentView(dialog);
			  return dialog;
       }
		 else
		 {
			  Log.e(LCAT,"Error finding action: "+action);
			  return null;
		 }
   }

	// this is a special method called by the dialog when a login is successful or when our session is first loaded
	// to get the user information and their permissions so we can cache them
   public void triggerLoginChange()  
	{
			Log.d(LCAT,"triggerLoginChange called with UID = "+session.getUid());
			
			handler.post(new Runnable()
			{
					public void run ()
					{
						progressDialog = new ProgressDialog(getContext());
			         progressDialog.setMessage("Loading...One moment");
			         progressDialog.setIndeterminate(true);
			         progressDialog.setCancelable(false);
						progressDialog.show();
					}
			});
			
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


   private final class FBSessionDelegateImpl extends FBSessionDelegate
   {
       @Override
       public void session_didLogin(FBSession session, Long uid)
       {
           Log.i(LCAT, "Facebook session login for " + uid);
       }

       @Override
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
       @Override
    	 protected void request_didLoad(FBRequest request, String contentType, Object result) 
       {
			  Log.d(LCAT,"FBLoginRequest finished with result="+result);
			
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
			  else
			  {
					Log.w(LCAT,"FB Login response was not JSON. Result was "+result);
			  }
			
				if (progressDialog!=null)
				{
					progressDialog.dismiss();
					progressDialog = null;
				}
       }

       @Override
       public void request_didFailWithError(FBRequest request, Throwable error)
       {
			   Log.e(LCAT,"FBLoginRequest failed",error);
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
				
				if (progressDialog!=null)
				{
					progressDialog.dismiss();
					progressDialog = null;
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
       @Override
       public void request_didLoad(FBRequest request, String contentType, Object result)
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

       @Override
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
