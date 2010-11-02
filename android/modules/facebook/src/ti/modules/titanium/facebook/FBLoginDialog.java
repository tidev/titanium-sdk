/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.facebook;

import java.net.MalformedURLException;
import java.net.URI;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import org.json.JSONException;
import org.json.JSONObject;

import ti.modules.titanium.facebook.FBRequest.FBRequestDelegate;
import android.app.Activity;
import android.util.Log;


public class FBLoginDialog extends FBDialog {

    private static final String LOG = FBLoginDialog.class.getSimpleName();
    
    private static final String LOGIN_URL = "http://www.facebook.com/login.php";

    private FBRequest mGetSessionRequest;
    private FBRequestDelegate mRequestDelegate;

    public FBLoginDialog(Activity context, FBSession session) {
        super(context, session);
        mRequestDelegate = new FBRequestDelegateImpl();
    }

    // /////////////////////////////////////////////////////////////////////////////////////////////////
    // private

    private void connectToGetSession(String token) {
    	mGetSessionRequest = FBRequest.requestWithSession(mSession, mRequestDelegate);
        Map<String, String> params = new HashMap<String, String>();
        params.put("auth_token", token);
        params.put("format","json");
        if (mSession.getApiSecret() == null) {
            params.put("generate_session_secret", "1");
        }

        if (mSession.getGetSessionProxy() != null) {
            mGetSessionRequest.post(mSession.getGetSessionProxy(), params);
        } else {
            mGetSessionRequest.call("facebook.auth.getSession", params);
        }
    }

    private void loadLoginPage() {
        Map<String, String> params = new HashMap<String, String>();
        params.put("fbconnect", "1");
        params.put("connect_display", "touch");
        params.put("api_key", mSession.getApiKey());
        params.put("next", "fbconnect://success");

        try {
            loadURL(LOGIN_URL, "GET", params, null);
        } catch (MalformedURLException e) {
            e.printStackTrace();
        }
    }

    // /////////////////////////////////////////////////////////////////////////////////////////////////
    // FBDialog

    @Override
    protected void load() {
        loadLoginPage();
    }

    @Override
    protected void dialogWillDisappear() {
        // _webView.stringByEvaluatingJavaScriptFromString("email.blur();");
        if (mGetSessionRequest == null) {
            Log.w(LOG, "This should not be null, at least on iPhone it is not...");
        } else {
            mGetSessionRequest.cancel();
        }
    }

    @Override
    protected void dialogDidSucceed(URI url) {
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
//        super.dialogDidSucceed(url);
    }

    private class FBRequestDelegateImpl extends FBRequestDelegate {

        @Override
        public void requestDidLoad(FBRequest request, String contentType, Object result) {
            
            try {
                JSONObject jsonObject = (JSONObject) result;
                Long uid = jsonObject.getLong("uid"); // XXX maybe create Long?
                String sessionKey = jsonObject.getString("session_key");
                Long expires = jsonObject.getLong("expires");

                //Sometimes there is no session secret
                String sessionSecret = null;
                try {
                    sessionSecret = jsonObject.getString("secret");
                } catch (JSONException e) {
                    Log.w(LOG, "Session secret not used");
                }

                Date expiration = null;
                if (expires != null) {
                    expiration = new Date(expires);
                }
                            
                 mGetSessionRequest = null;
                
                 mSession.begin(mContext, uid, sessionKey, sessionSecret, expiration);
                 mSession.resume(mContext);
                 
                 //triggerLoginChange(false);
                            
                 dismissWithSuccess(true, true);
            } catch (JSONException e) {
                e.printStackTrace();
            }
            
        }

        @Override
        public void requestDidFailWithError(FBRequest request, Throwable error) {
            mGetSessionRequest = null;

            dismissWithError(error, true);
        }

    }

}
