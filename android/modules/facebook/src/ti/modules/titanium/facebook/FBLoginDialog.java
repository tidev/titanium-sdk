/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.facebook;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URL;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

import android.app.Activity;
import android.view.WindowManager;
import android.view.WindowManager.LayoutParams;

import ti.modules.titanium.facebook.FBRequest.FBRequestDelegate;

/**
 * Dialog for managing the Login
 */
public class FBLoginDialog extends FBDialog
{
    private static final String LOG = FBLoginDialog.class.getSimpleName();
    private static final boolean DBG = TiConfig.LOGD;

    public static final String FB_LOGIN_URL = "http://www.facebook.com/login.php";

    private FBRequest sessionRequest;
    private FBRequestDelegate requestDelegate;

    public FBLoginDialog(Activity context, FBSession session, FacebookModule tb)
    {
        super(context, session, tb);
        requestDelegate = new FBRequestDelegateImpl(context,session);
//        context.getWindow().setFlags(WindowManager.LayoutParams.FLAG_BLUR_BEHIND, WindowManager.LayoutParams.FLAG_BLUR_BEHIND);
    }

    private void connectToGetSession(String token)
    {		
		Log.d(LOG,"connectToGetSession called with token="+token+", api secret: "+session.getApiSecret());
        sessionRequest = FBRequest.requestWithSession(session, requestDelegate);

        if (session.getGetSessionProxy() != null)
        {
            sessionRequest.get(session.getGetSessionProxy()+"?generate_session_secret=1&auth_token="+token+"&format=json");
        }
        else
        {
	        Map<String, String> params = new HashMap<String, String>();
	        params.put("auth_token", token);
	        if (session.getApiSecret() != null)
	        {
	            params.put("generate_session_secret", "1");
	        }
            sessionRequest.call("facebook.auth.getSession", params);
        }
    }

    private void loadLoginPage()
    {
        Map<String, String> params = new HashMap<String, String>();
        params.put("fbconnect", "1");
        params.put("connect_display", "touch");
        params.put("api_key", session.getApiKey());
        params.put("session_key", session.getSessionKey());
        params.put("next", "fbconnect:success");

        try
        {
            loadURL(FB_LOGIN_URL, "GET", params, null);
        }
        catch (MalformedURLException e)
        {
            Log.e(LOG,"Error loading URL: "+FB_LOGIN_URL,e);
        }
    }

    @Override
    protected void load()
    {
        loadLoginPage();
    }

    @Override
    protected Object beforeLoad(URL url, String contentType, Object content)
    {
        try
        {
			if (contentType!=null && contentType.indexOf("html")!=-1)
			{
				String html = content.toString();
				if (html.length()==0)
				{
					return "<html><body>Facebook is currently experiencing technical difficulties. Please try again soon.</body></html>";
				}
				StringBuilder sb = new StringBuilder(64000);
				sb.append(content);
				sb.append("<script>");
				FBUtil.getContent(sb, getClass(), "ti/modules/titanium/facebook/resources/jquery.js");
				sb.append("\n");
				FBUtil.getContent(sb, getClass(), "ti/modules/titanium/facebook/resources/loginpatch.js");
				sb.append("</script>");
				return sb;
			}
        }
        catch (IOException e)
        {
            Log.e(LOG,"Error loading resources",e);
        }
        return content;
    }

    @Override
    protected void dialogDidSucceed(URI url)
    {  
	     Log.d(LOG,"dialogDidSucceed called with "+url);
	
        String q = url.toString();
        int start = q.indexOf("auth_token=");
        if (start != -1) 
		{
            int end = q.indexOf("&");
            int offset = start + "auth_token=".length();
            String token = end == -1 ? q.substring(offset) : q.substring(offset, end - offset);

            if (token != null) {
                connectToGetSession(token);
            }
        }
        super.dialogDidSucceed(url);
    }

    private final class FBRequestDelegateImpl extends FBRequestDelegate
    {
		  private final Activity activity;
		  private final FBSession session;
		
		  FBRequestDelegateImpl(Activity activity, FBSession session)
		  {
				this.activity = activity;
				this.session = session;
		  }

        @Override
        protected void request_didLoad(FBRequest request, String contentType, Object result)
        {
				Log.d(LOG,"request_didLoad with contentType="+contentType);
				if (contentType!=null && contentType.indexOf("json")!=-1)
				{
	            try 
	            {
					JSONObject jsonObject = null;
					if (result instanceof JSONObject)
					{
						jsonObject = (JSONObject) result;
					}
					else
					{
						Log.e(LOG,"Received invalid response from FBRequest. Expected JSONObject, received ("+result.getClass().getSimpleName()+"): "+result);
					}
					Long uid = jsonObject.getLong("uid"); 
					String sessionKey = jsonObject.getString("session_key");
					String sessionSecret = jsonObject.getString("secret");
					Long expires = jsonObject.getLong("expires");
					Date expiration = null;
					if (expires != null) 
					{
					    expiration = new Date(expires);
					}
					sessionRequest = null;

					if (DBG)
					{
						Log.d(LOG,"request_didLoad - uid = "+uid);
						Log.d(LOG,"request_didLoad - sessionKey = "+sessionKey);
						Log.d(LOG,"request_didLoad - sessionSecret = "+sessionSecret);
					}

					// change the session data
					this.session.begin(this.activity, uid, sessionKey, sessionSecret, expiration);

					// let our module know we have a new successful login so he can do his magic
					facebookModule.triggerLoginChange();

					dismissWithSuccess(true, true);
	            }
	            catch (JSONException e) 
	            {
	                Log.e(LOG,"JSON parsing exception",e);
	            }
				}
				else
				{
					Log.e(LOG,"Received invalid response from FBRequest. Expected JSON response, received: "+result);
				}
        }

        @Override
        protected void request_didFailWithError(FBRequest request, Throwable error)
        {
            sessionRequest = null;
            dismissWithError(error, true);
        }

    }

}
