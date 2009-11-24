/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.module.facebook;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.StringTokenizer;
import java.util.Timer;
import java.util.TimerTask;

import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.Log;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.webkit.CookieManager;
import android.webkit.CookieSyncManager;

/**
 * An FBSession represents a single user's authenticated session for a Facebook application.
 *
 * To create a session, you must use the session key of your application (which can be found on the Facebook developer
 * website). You may then use the login dialog to ask the user to enter their email address and password. If successful,
 * you will get back a session key which can be used to make requests to the Facebook API.
 *
 * Session keys are cached and stored on the disk of the device so that you do not need to ask the user to login every
 * time they launch the app. To restore the last active session, call the resume method after instantiating your
 * session.
 */
public class FBSession
{
    private static final String LOG = FBSession.class.getSimpleName();
    private static final boolean DBG = TitaniumConfig.LOGD;

    private static final String PREFS_NAME = "FBSessionPreferences";
    private static final String FACEBOOK_REST_URL = "http://api.facebook.com/restserver.php";
    private static final String FACEBOOK_REST_SECURE_URL = "https://api.facebook.com/restserver.php";
    private static final int MAX_BURST_REQUESTS = 3;
    private static final long BURST_DURATION_IN_SEC = 2; //time interval in seconds
    private static FBSession sharedSession;

    private List<FBSessionDelegate> delegates;
    private String apiKey;
    private String apiSecret;
    private String sessionProxy;
    private Long uid;
    private String sessionKey;
    private String sessionSecret;
    private Date expirationDate;
    private List<FBRequest> requestQueue;
    private Date lastRequestTime;
    private int requestBurstCount;
    private Timer requestTimer;
    private Map<String,String> permissions;

    private FBSession(String key, String secret, String sessionProxy)
    {
        this.delegates = new ArrayList<FBSessionDelegate>();
        this.apiKey = key;
        this.apiSecret = secret;
        this.sessionProxy = sessionProxy;
        this.uid = Long.valueOf(0);
        this.requestQueue = Collections.synchronizedList(new ArrayList<FBRequest>());
        this.requestBurstCount = 0;
    }

    /**
     * Constructs a session for an application.
     *
     * @param secret
     *            the application secret (optional)
     * @param getSessionProxy a url to that proxies auth.getSession (optional)
     */
    private static FBSession initWithKey(String key, String secret, String getSessionProxy) {
        FBSession instance = new FBSession(key, secret, getSessionProxy);
        if (sharedSession == null) {
            sharedSession = instance;
        }

        return instance;
    }

    /**
     * The globally shared session instance.
     */
    public static FBSession getSession() {
        return sharedSession;
    }

    /**
     * Sets the globally shared session instance.
     *
     * This session is not retained, so you are still responsible for retaining it yourself. The first session that is
     * created is automatically stored here.
     */
    public static void setSession(FBSession session) {
        sharedSession = session;
    }

    /**
     * Constructs a session and stores it as the globally shared session instance.
     *
     * @param secret
     *            the application secret (optional)
     */
    public static FBSession getSessionForApplication_secret(String key, String secret, FBSessionDelegate delegate)
    {
        FBSession session = initWithKey(key, secret, null);
        session.getDelegates().add(delegate);
        return session;
    }

    /**
     * Constructs a session and stores it as the global singleton.
     *
     * @param getSessionProxy
     *            a url to that proxies auth.getSession (optional)
     */
    public static FBSession getSessionForApplication_getSessionProxy(String key, String sessionProxy, FBSessionDelegate delegate)
    {
        FBSession session = initWithKey(key, null, sessionProxy);
        session.getDelegates().add(delegate);
        return session;
    }

    private void save(Context context)
    {
        SharedPreferences defaults = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        Editor editor = defaults.edit();
        if (uid != null) {
            editor.putLong("FBUserId", uid);
        } else {
            editor.remove("FBUserId");
        }

        if (sessionKey != null) {
            editor.putString("FBSessionKey", sessionKey);
        } else {
            editor.remove("FBSessionKey");
        }

        if (sessionSecret != null) {
            editor.putString("FBSessionSecret", sessionSecret);
        } else {
            editor.remove("FBSessionSecret");
        }

        if (expirationDate != null) {
            editor.putLong("FBSessionExpires", expirationDate.getTime());
        } else {
            editor.remove("FBSessionExpires");
        }

        editor.commit();
    }

    private void unsave(Context context)
    {
        Editor defaults = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit();

        defaults.remove("FBUserId");
        defaults.remove("FBSessionKey");
        defaults.remove("FBSessionSecret");
        defaults.remove("FBSessionExpires");
        defaults.commit();

        if (permissions!=null)
        {
            permissions.clear();
        }
    }

    private void startFlushTimer()
    {
        if (requestTimer == null) {
            long timeIntervalSinceNow = FBUtil.timeIntervalSinceNow(lastRequestTime);
            long t = BURST_DURATION_IN_SEC + timeIntervalSinceNow;
            requestTimer = new Timer();
            requestTimer.schedule(requestTimerReady , t * 1000);
        }
    }

    private void enqueueRequest(FBRequest request)
    {
        requestQueue.add(request);
        startFlushTimer();
    }

    private boolean performRequest(FBRequest request, boolean enqueue)
    {
    	if (DBG) {
    		Log.d(LOG, "Performing Request");
    	}

        // Stagger requests that happen in short bursts to prevent the server from rejecting
        // them for making too many requests in a short time
        long t = FBUtil.timeIntervalSinceNow(lastRequestTime);
        boolean burst = t < BURST_DURATION_IN_SEC;

        if (DBG) {
        	Log.d(LOG, "t: " + t);
        	Log.d(LOG, "Burst: " + burst);
        }
        if (burst && ++requestBurstCount > MAX_BURST_REQUESTS)
        {
            if (enqueue)
            {
            	if (DBG) {
            		Log.d(LOG, "Queuing, burst exceeded");
            	}
                enqueueRequest(request);
            }
            return false;
        }
        else
        {
        	if (DBG) {
        		Log.d(LOG, "Requesting.");
        	}
            try
            {
                request.connect();
            }
            catch (IOException e)
            {
                e.printStackTrace();
            }

            if (!burst)
            {
            	if (DBG) {
            		Log.d(LOG, "Setting burst count.");
            	}

                requestBurstCount = 1;
            }
            lastRequestTime = request.getTimestamp();
        }
        return true;
    }

    private void flushRequestQueue()
    {
    	if (DBG) {
    		Log.d(LOG, "flushRequestQueue: " + requestQueue.size());
    	}
        while (requestQueue.size() > 0)
        {
            FBRequest request = requestQueue.get(0);
            if (performRequest(request, false))
            {
                requestQueue.remove(0);
            }
            else
            {
                startFlushTimer();
                break;
            }
        }
    }

    private final TimerTask requestTimerReady = new TimerTask()
    {
        public void run() {
        	if (DBG) {
        		Log.d(LOG, "Timer Task Fired");
        	}
            requestTimer = null;
            flushRequestQueue();
        }
    };

    /**
     * The URL used for API HTTP requests.
     */
    public String getApiURL() {
        return FACEBOOK_REST_URL;
    }

    /**
     * The URL used for secure API HTTP requests.
     */
    public String getApiSecureURL() {
        return FACEBOOK_REST_SECURE_URL;
    }

    /**
     * Determines if the session is active and connected to a user.
     */
    public boolean isConnected()
    {
        return sessionKey != null;
    }

    /**
     * Begins a session for a user with a given key and secret.
     */
    public void begin(Context context, Long uid, String sessionKey, String sessionSecret, Date expires) {
        this.uid = uid;
        this.sessionKey = sessionKey;
        this.sessionSecret = sessionSecret;
        this.expirationDate = (Date) expires.clone();
        save(context);
    }

    /**
     * Resumes a previous session whose uid, session key, and secret are cached on disk.
     */
    public boolean resume(Context context) {
        SharedPreferences defaults = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        CookieSyncManager.createInstance(context);
        Long uid = defaults.getLong("FBUserId", 0);
        if (uid != 0) {
            Date expirationDate = new Date(defaults.getLong("FBSessionExpires", 0));
            long timeIntervalSinceNow = FBUtil.timeIntervalSinceNow(expirationDate);
            if (expirationDate == null || timeIntervalSinceNow > 0) {
                this.uid = uid;
                sessionKey = defaults.getString("FBSessionKey", null);
                sessionSecret = defaults.getString("FBSessionSecret", null);

                for (FBSessionDelegate delegate : delegates) {
                    delegate.session_didLogin(this, uid);
                }
                return true;
            }
        }
        return false;
    }

    /**
     * Ends the current session and deletes the uid, session key, and secret from disk.
     */
    public void logout(Context context)
    {
        if (sessionKey != null)
        {
            for (FBSessionDelegate delegate : delegates) {
                delegate.session_willLogout(this, uid);
            }

            // attempt to remove any facebook login cookies
            try
            {
                CookieSyncManager sm = CookieSyncManager.getInstance();
                String cookies = CookieManager.getInstance().getCookie("http://login.facebook.com");
                if (cookies!=null)
                {
                    StringTokenizer tok = new StringTokenizer(cookies,"; ");
                    while(tok.hasMoreTokens())
                    {
                        String token = tok.nextToken();
                        int eq = token.indexOf("=");
                        String name = token.substring(0,eq);
                        String cookie = name+"=; expires=Fri, 1-Nov-2009 23:59:59 GMT; path=/; domain=.facebook.com";
                        CookieManager.getInstance().setCookie("http://login.facebook.com", cookie);
                    }
                }
                sm.sync();
            }
            catch(Exception ex)
            {
                Log.e(LOG,"Error deleting session cookies",ex);
            }

            uid = Long.valueOf(0);
            sessionKey = null;
            sessionSecret = null;
            expirationDate = null;
            unsave(context);

            for (FBSessionDelegate delegate : delegates)
            {
                delegate.sessionDidLogout(this);
            }
        }
        else
        {
            unsave(context);
        }
    }

    /**
     * Sends a fully configured request to the server for execution.
     */
    public void send(FBRequest request) {
         performRequest(request, true);
    }

    /**
     * Delegates which implement FBSessionDelegate.
     */
    public List<FBSessionDelegate> getDelegates() {
        return delegates;
    }

    /**
     * Your application's API key, as passed to the constructor.
     */
    public String getApiKey() {
        return apiKey;
    }

    /**
     * Your application's API secret, as passed to the constructor.
     */
    public String getApiSecret() {
        return apiSecret;
    }

    /**
     * The URL to call to create a session key after login.
     *
     * This is an alternative to calling auth.getSession directly using the secret key.
     */
    public String getGetSessionProxy() {
        return sessionProxy;
    }

    /**
     * The current user's Facebook id.
     */
    public Long getUid() {
        return uid;
    }

    /**
     * The current user's session key.
     */
    public String getSessionKey() {
        return sessionKey;
    }

    /**
     * The current user's session secret.
     */
    public String getSessionSecret() {
        return sessionSecret;
    }

    /**
     * The expiration date of the session key.
     */
    public Date getExpirationDate() {
        return expirationDate;
    }

    public void setPermissions (Map<String,String> perm)
    {
        this.permissions = perm;
        Log.d(LOG,"set permission to "+perm);
    }

    public boolean hasPermission (String name)
    {
        if (this.permissions!=null)
        {
            return this.permissions.containsKey(name);
        }
        return false;
    }

    public void addPermissions (String name, String value)
    {
        if (this.permissions==null)
        {
            this.permissions = new HashMap<String,String>();
        }
        this.permissions.put(name, value);
    }

    public static abstract class FBSessionDelegate {

        /**
         * Called when a user has successfully logged in and begun a session.
         */
        protected void session_didLogin(FBSession session, Long uid) {}

        /**
         * Called when a session is about to log out.
         */
        protected void session_willLogout(FBSession session, Long uid) {}

        /**
         * Called when a session has logged out.
         */
        protected void sessionDidLogout(FBSession session) {}

    }

}
