/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.module.facebook;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URL;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.module.facebook.FBRequest.FBRequestDelegate;
import org.appcelerator.titanium.util.Log;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.Activity;


/**
 * Dialog for managing the Login
 */
public class FBLoginDialog extends FBDialog
{
    private static final String LOG = FBLoginDialog.class.getSimpleName();
    private static final boolean DBG = TitaniumConfig.LOGD;

    private static final String FB_LOGIN_URL = "http://www.facebook.com/login.php";

    private FBRequest sessionRequest;
    private FBRequestDelegate requestDelegate;

    public FBLoginDialog(Activity context, FBSession session)
    {
        super(context, session);
        requestDelegate = new FBRequestDelegateImpl();

//        context.getWindow().setFlags(WindowManager.LayoutParams.FLAG_BLUR_BEHIND | WindowManager.LayoutParams.TYPE_INPUT_METHOD_DIALOG,
//                WindowManager.LayoutParams.FLAG_BLUR_BEHIND | WindowManager.LayoutParams.TYPE_INPUT_METHOD_DIALOG);

    }

    private void connectToGetSession(String token)
    {
        sessionRequest = FBRequest.requestWithSession(session, requestDelegate);
        Map<String, String> params = new HashMap<String, String>();
        params.put("auth_token", token);
        if (session.getApiSecret() != null)
        {
            params.put("generate_session_secret", "1");
        }

        if (session.getGetSessionProxy() != null)
        {
            sessionRequest.post(session.getGetSessionProxy(), params);
        }
        else
        {
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
        params.put("next", "fbconnect://success");

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



    /* (non-Javadoc)
     * @see org.appcelerator.titanium.module.facebook.FBDialog#afterLoad(java.net.URL, java.lang.String, java.lang.Object)
     */
    @Override
    protected Object beforeLoad(URL url, String contentType, Object content)
    {
        try
        {
			if (contentType!=null && contentType.indexOf("html")!=-1)
			{
				StringBuilder sb = new StringBuilder(80000);

				sb.append(content);
				sb.append("<script>");
		        FBUtil.getContent(sb, getClass(), "org/appcelerator/titanium/module/facebook/resources/jquery.js");
		        sb.append("\n");
		        FBUtil.getContent(sb, getClass(), "org/appcelerator/titanium/module/facebook/resources/loginpatch.js");
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
        String q = url.getQuery();
        int start = q.indexOf("auth_token=");
        if (start != -1) {
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

        @Override
        protected void request_didLoad(FBRequest request, String contentType, Object result)
        {
            try
            {
                JSONObject jsonObject = (JSONObject) result;
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

            	Activity context = weakContext.get();
            	if (context != null) {
	                session.begin(context, uid, sessionKey, sessionSecret, expiration);
	                session.resume(context);
            	}

                dismissWithSuccess(true, true);
            }
            catch (JSONException e)
            {
                Log.e(LOG,"JSON parsing exception",e);
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
