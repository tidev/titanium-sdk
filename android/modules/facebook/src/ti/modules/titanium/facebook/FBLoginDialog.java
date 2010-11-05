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
    private static final String OAUTH_URL = "http://graph.facebook.com/oauth/authorize";

    private FBRequest mGetSessionRequest;
    private FBRequestDelegate mRequestDelegate;
    private String mRequestedPermissions;

    public FBLoginDialog(Activity context, FBSession session, String permissions) {
        super(context, session);
        this.mRequestedPermissions  = permissions;
        mRequestDelegate = new FBRequestDelegateImpl();
    }

    // /////////////////////////////////////////////////////////////////////////////////////////////////
    // private

    private void connectToGetSession(String token) {
    	mGetSessionRequest = FBRequest.requestWithSession(mSession, mRequestDelegate);
        Map<String, String> params = new HashMap<String, String>();
        if (FacebookModule.usingOauth) {
        	params.put("access_token", token);
        } else {
        	params.put("auth_token", token);
        }
        params.put("format","json");
        if (mSession.getApiSecret() == null && !FacebookModule.usingOauth) {
            params.put("generate_session_secret", "1");
        }

        if (mSession.getGetSessionProxy() != null) {
            mGetSessionRequest.post(mSession.getGetSessionProxy(), params);
        } else {
            mGetSessionRequest.call("facebook.auth.getSession", params);
        }
    }

    // OAUTH
    private void connectToGetUserInfo(String token) {
    	mGetSessionRequest = FBRequest.requestWithSession(mSession, mRequestDelegate);
    	mGetSessionRequest.setHttpMethod("GET");
        Map<String, String> params = new HashMap<String, String>();
    	params.put("access_token", token);
    	params.put("sdk", "android");
    	params.put("type", "user_agent");
        params.put("format","json");
        mGetSessionRequest.call("me", params);
    }

    private void loadLoginPage() {
        Map<String, String> params = new HashMap<String, String>();
        String url = FacebookModule.usingOauth ? OAUTH_URL : LOGIN_URL;
        if (FacebookModule.usingOauth) {
        	params.put("display", "touch");
        	params.put("scope", mRequestedPermissions);
        	params.put("sdk", "android");
        	params.put("redirect_uri", "fbconnect://success");
        	params.put("type", "user_agent");
        	params.put("client_id", mSession.getApiKey());
        } else {
	        params.put("fbconnect", "1");
	        params.put("connect_display", "touch");
	        params.put("api_key", mSession.getApiKey());
	        params.put("next", "fbconnect://success");
        }

        try {
            loadURL(url, "GET", params, null);
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
        String toSearch = FacebookModule.usingOauth ? url.toString() : url.getQuery();
        String PATTERN = FacebookModule.usingOauth ? "access_token=" : "auth_token=";
        
        int start = toSearch.indexOf(PATTERN);
        if (start != -1) {
            int end = toSearch.indexOf("&");
            int offset = start + PATTERN.length();
            String token = end == -1 ? toSearch.substring(offset) : toSearch.substring(offset, end);
            if (token != null) {
            	if (!FacebookModule.usingOauth) {
            		connectToGetSession(token);
            	} else {
            		start = toSearch.indexOf("expires_in=");
            		if (start != -1) {
            			offset = start + "expires_in=".length();
            			end = toSearch.indexOf("&", offset);
            			String expires_in = null;
            			if (end != -1) {
            				expires_in = toSearch.substring(offset, end);
            			} else {
            				expires_in = toSearch.substring(offset);
            			}
            			mSession.setAccessToken(token);
            			mSession.setFutureExpiration(mContext, expires_in);
            			connectToGetUserInfo(token);
            		}
            	}
            }
        }
    }

    private class FBRequestDelegateImpl extends FBRequestDelegate {

        @Override
        public void requestDidLoad(FBRequest request, String contentType, Object result) {
            
            try {
            	JSONObject jsonObject = (JSONObject) result;
            	
            	if (FacebookModule.usingOauth) {
            		mGetSessionRequest = null;
            		mSession.begin_oauth(mContext, jsonObject.getLong("id"));
            		mSession.resume(mContext);
            	} else {
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
	                
	                 mSession.begin(mContext, uid, sessionKey, sessionSecret, expiration, null);
	                 mSession.resume(mContext);
            	}
                 
                 //triggerLoginChange(false);
                            
                 dismissWithSuccess(true, true);
            } catch (JSONException e) {
                e.printStackTrace();
            }
            
        }

        @Override
        public void requestDidFailWithError(FBRequest request, Throwable error) {
        	super.requestDidFailWithError(request, error);
            mGetSessionRequest = null;
            dismissWithError(error, true);
        }

    }

}
