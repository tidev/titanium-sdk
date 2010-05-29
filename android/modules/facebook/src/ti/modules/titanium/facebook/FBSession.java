/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.facebook;


import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.StringTokenizer;
import java.lang.ref.WeakReference;

import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.Log;

import org.json.JSONObject;
import org.json.JSONException;

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
public class FBSession implements Runnable
{
    private static final String LOG = FBSession.class.getSimpleName();
//    private static final boolean DBG = TiConfig.LOGD;
    private static final boolean DBG = true;

    private static final String PREFS_NAME = "FBSessionPreferences";
    private static final String FACEBOOK_REST_URL = "http://api.facebook.com/restserver.php";
    private static final String FACEBOOK_REST_SECURE_URL = "https://api.facebook.com/restserver.php";
    private static final int MAX_BURST_REQUESTS = 3;
    private static final long BURST_DURATION_IN_SEC = 2; //time interval in seconds
    private static FBSession sharedSession;

    private List<FBSessionDelegate> delegates;
	private List<FBRequest> requests;
    private String apiKey;
    private String apiSecret;
    private String sessionProxy;
    private Long uid;
    private String sessionKey;
    private String sessionSecret;
    private Date expirationDate;
    private List<FBRequest> pendingSessionRequestQueue;
    private Map<String,String> permissions;
	private Thread requestThread;
	private WeakReference<Context> context;
	private final Object lock = new Object();
	private FacebookModule facebookModule;

    private FBSession(String key, String secret, String sessionProxy, FacebookModule facebookModule)
    {
        this.delegates = new ArrayList<FBSessionDelegate>();
        this.apiKey = key;
        this.apiSecret = secret;
        this.sessionProxy = sessionProxy;
		this.facebookModule = facebookModule;
        this.uid = Long.valueOf(0);
		// we keep 2 different queues since we want certain requests to happen after logged in
        this.pendingSessionRequestQueue = new ArrayList<FBRequest>();
        this.requests = new ArrayList<FBRequest>();
    }

    /**
     * Constructs a session for an application.
     *
     * @param secret
     *            the application secret (optional)
     * @param getSessionProxy a url to that proxies auth.getSession (optional)
     */
    private static FBSession initWithKey(String key, String secret, String getSessionProxy, FacebookModule facebookModule) {
        FBSession instance = new FBSession(key, secret, getSessionProxy, facebookModule);
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

	public FacebookModule getFacebookModule()
	{
		return facebookModule;
	}
	
	public Context getContext()
	{
		return context.get();
	}
	
	public void setContext(Context ctx)
	{
		Log.d(LOG,"setcontext called with "+ctx);
		this.context = new WeakReference<Context>(ctx);
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
    public static FBSession getSessionForApplication_secret(String key, String secret, FBSessionDelegate delegate, FacebookModule facebookModule)
    {
		Log.d(LOG,"FB session created without sessionProxy");
        FBSession session = initWithKey(key, secret, null, facebookModule);
        session.getDelegates().add(delegate);
        return session;
    }

    /**
     * Constructs a session and stores it as the global singleton.
     *
     * @param getSessionProxy
     *            a url to that proxies auth.getSession (optional)
     */
    public static FBSession getSessionForApplication_getSessionProxy(String key, String sessionProxy, FBSessionDelegate delegate, FacebookModule facebookModule)
    {
		Log.d(LOG,"FB session created with sessionProxy = "+sessionProxy);
        FBSession session = initWithKey(key, null, sessionProxy, facebookModule);
        session.getDelegates().add(delegate);
        return session;
    }

    private void save(Context context)
    {
		if (context==null) return;
		
		Log.d(LOG,"save called");
		
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

		  if (permissions != null) {
			   try
				{
					String perms = new JSONObject(permissions).toString();
					if (DBG) Log.d(LOG,"saving permissions = "+perms);
					editor.putString("FBPermissions", perms);
				}
				catch(Exception ex)
				{
					Log.e(LOG,"Error saving permissions",ex);
				}
		  } else {
				editor.remove("FBPermissions");
		  }

        editor.commit();
    }

    private void unsave(Context context)
    {
		Log.d(LOG,"unsave called with context="+context);
		
        Editor defaults = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit();

        defaults.remove("FBUserId");
        defaults.remove("FBSessionKey");
        defaults.remove("FBSessionSecret");
        defaults.remove("FBSessionExpires");
		defaults.remove("FBPermissions");
        defaults.commit();

        if (permissions!=null)
        {
            permissions.clear();
        }

		this.uid = new Long(0);

    }

	 public void run ()
	 {
		// this is the request thread that will run one op at a time
		while (true)
		{
			try
			{
				boolean pending = false;
				
				synchronized(FBSession.this)
				{
					pending = !requests.isEmpty(); 
				}
				if (pending)
				{
					// blocks until we have a request that's read to rock n roll
					FBRequest req = requests.remove(0);
		    		if (DBG) Log.d(LOG, "Executing Request "+req);
					req.connect();
		    		if (DBG) Log.d(LOG, "Executed Request "+req);
				}
				else
				{
					synchronized(lock)
					{
			    		if (DBG) Log.d(LOG, "Request queue empty, waiting...");
						lock.wait();
			    		if (DBG) Log.d(LOG, "Request queue got notification...");
					}
				}
			}
			catch(Exception ex)
			{
				Log.e(LOG,"Error executing request",ex);
			}
			synchronized(FBSession.this)
			{
				while (pendingSessionRequestQueue.size() > 0)
				{
					try
					{
						FBRequest req = pendingSessionRequestQueue.remove(0);
			    		if (DBG) Log.d(LOG, "Executing Queued Request "+req);
						req.connect();
			    		if (DBG) Log.d(LOG, "Executed Queued Request "+req);
					}
					catch(Exception ex)
					{
						Log.e(LOG,"Error executing request",ex);
					}
				}
			}
		}
	 }

	 private synchronized boolean enqueueRequest(FBRequest request) throws InterruptedException
	 {
		if (!isConnected() && !request.isLoggingInRequest())
		{
    		if (DBG) Log.d(LOG, "Queued Pending Session Request "+request);
			pendingSessionRequestQueue.add(request);
			synchronized(lock)
			{
				lock.notify();
			}
			return false;
		}
		else
		{
    		if (DBG) Log.d(LOG, "Queued Active Request "+request);
			requests.add(request);
			synchronized(lock)
			{
				lock.notify();
			}
			return true;
		}
	 }

    private boolean performRequest(FBRequest request, boolean enqueue)
	 {
	    	if (DBG) {
	    		Log.d(LOG, "Performing Request "+request);
	    	}
			if (requestThread==null)
			{
				Log.d(LOG, "Starting FB Session Request Thread");
				requestThread = new Thread(this,"FBSessionRequestor");
				requestThread.start();
			}
			
			try
			{
				enqueueRequest(request);
			}
			catch (InterruptedException ig)
			{
				ig.printStackTrace();
			}

			return true;
	 }
	
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
    public synchronized boolean isConnected()
    {
        return sessionKey != null && this.uid.longValue()!=0;
    }

    /**
     * Begins a session for a user with a given key and secret.
     */
    public synchronized void begin(Context context, Long uid, String sessionKey, String sessionSecret, Date expires) 
	 {
		this.context = new WeakReference<Context>(context);
        this.uid = uid;
        this.sessionKey = sessionKey;
        this.sessionSecret = sessionSecret;
        this.expirationDate = (Date) expires.clone();
        this.permissions = null;

		Log.d(LOG,"SESSION BEGIN - uid="+uid+",sessionKey="+sessionKey+",sessionSecret="+sessionSecret+",expires="+expires);

        save(context);
    }

    /**
     * Resumes a previous session whose uid, session key, and secret are cached on disk.
     */
	public synchronized boolean resume(Context context) 
	{
		Log.d(LOG,"SESSION resume called with context="+context);
		this.context = new WeakReference<Context>(context);
		
        SharedPreferences defaults = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        CookieSyncManager.createInstance(context);
        Long uid = defaults.getLong("FBUserId", 0);
        if (uid != 0) 
		{
            Date expirationDate = new Date(defaults.getLong("FBSessionExpires", 0));
            long timeIntervalSinceNow = FBUtil.timeIntervalSinceNow(expirationDate);
            if (expirationDate == null || timeIntervalSinceNow > 0) 
			{
                this.uid = uid;
                sessionKey = defaults.getString("FBSessionKey", null);
                sessionSecret = defaults.getString("FBSessionSecret", null);

				String fbPerms = defaults.getString("FBPermissions", null);
				if (DBG) Log.d(LOG,"restoring permissions = "+fbPerms);
				if (fbPerms!=null)
				{
					this.permissions = Collections.synchronizedMap(new HashMap<String,String>());
					try
					{
					  	FBUtil.jsonToMap(new JSONObject(fbPerms),this.permissions);
					}
					catch(JSONException ex)
					{
						ex.printStackTrace();
					}
				}

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
    public synchronized void logout(Context context)
    {
		Log.d(LOG,"session logout called with context="+context);
		
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

	public boolean hasUnsetPermissions()
	{
		return permissions==null;
	}

    public void setPermissions (Map<String,String> perm)
    {
        this.permissions = Collections.synchronizedMap(perm);
        this.save(context.get());
        if (DBG) Log.d(LOG,"set permission to "+perm);
    }

    public boolean hasPermission (String name)
    {
        if (this.permissions!=null)
        {
				String value = (String)this.permissions.get(name);
				if (DBG) Log.d(LOG,"hasPermission called for "+name+", returned: "+value);
				if (value!=null && value.equals("1"))
				{
					return true;
				}
        }
        return false;
    }

    public void addPermissions (String name, String value)
    {
        if (this.permissions==null)
        {
            this.permissions = Collections.synchronizedMap(new HashMap<String,String>());
        }
        this.permissions.put(name, value);
        this.save(context.get());
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
