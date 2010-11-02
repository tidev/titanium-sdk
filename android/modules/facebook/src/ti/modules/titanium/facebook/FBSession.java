/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.facebook;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;

import org.json.JSONException;
import org.json.JSONObject;

import temporary.CcDate;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.util.Log;
import android.webkit.CookieManager;
import android.webkit.CookieSyncManager;

/**
 * An FBSession represents a single user's authenticated session for a Facebook
 * application.
 * 
 * To create a session, you must use the session key of your application (which
 * can be found on the Facebook developer website). You may then use the login
 * dialog to ask the user to enter their email address and password. If
 * successful, you will get back a session key which can be used to make
 * requests to the Facebook API.
 * 
 * Session keys are cached and stored on the disk of the device so that you do
 * not need to ask the user to login every time they launch the app. To restore
 * the last active session, call the resume method after instantiating your
 * session.
 */
public class FBSession {

	private static final String PREFS_NAME = "FBSessionPreferences";

	// /////////////////////////////////////////////////////////////////////////////////////////////////
	// global

	//private static final String APIRESTURL = "http://api.facebook.com/restserver.php";
	//private static final String APIRESTSECUREURL = "https://api.facebook.com/restserver.php";
	private static final String APIRESTURL = "http://api.facebook.com/method/";
	private static final String APIRESTSECUREURL = "https://api.facebook.com/method/";
	

	private static final int MAXBURSTREQUESTS = 3;
	private static final long BURSTDURATION = 2;

	private static FBSession mSharedSession;
	private Map<String, String> permissions;

	// /////////////////////////////////////////////////////////////////////////////////////////////////

	private List<FBSessionDelegate> mDelegates;
	private String mApiKey;
	private String mApiSecret;
	private String mGetSessionProxy;
	private Long mUid;
	private String mSessionKey;
	private String mSessionSecret;
	private Date mExpirationDate;
	private List<FBRequest> mRequestQueue;
	private Date mLastRequestTime;
	private int mRequestBurstCount;
	private Timer mRequestTimer;
	private String mAccessToken; //OAUTH

	// /////////////////////////////////////////////////////////////////////////////////////////////////
	// constructor

	private FBSession(String key, String secret, String getSessionProxy) {
		mDelegates = new ArrayList<FBSessionDelegate>();// FBConnectGlobal.FBCreateNonRetainingArray();
		mApiKey = key;
		mApiSecret = secret;
		mGetSessionProxy = getSessionProxy;
		mUid = Long.valueOf(0);
		mSessionKey = null;
		mSessionSecret = null;
		mExpirationDate = null;
		mRequestQueue = new ArrayList<FBRequest>();
		mLastRequestTime = new Date();
		mRequestBurstCount = 0;
		mRequestTimer = null;
		mAccessToken = null;
	}

	/**
	 * Constructs a session for an application.
	 * 
	 * @param secret
	 *            the application secret (optional)
	 * @param getSessionProxy
	 *            a url to that proxies auth.getSession (optional)
	 */
	private static FBSession initWithKey(String key, String secret,
			String getSessionProxy) {
		FBSession instance = new FBSession(key, secret, getSessionProxy);
		if (mSharedSession == null) {
			mSharedSession = instance;
		}

		return instance;
	}

	// /////////////////////////////////////////////////////////////////////////////////////////////////
	// class public

	/**
	 * The globally shared session instance.
	 */
	public static FBSession getSession() {
		return mSharedSession;
	}

	/**
	 * Sets the globally shared session instance.
	 * 
	 * This session is not retained, so you are still responsible for retaining
	 * it yourself. The first session that is created is automatically stored
	 * here.
	 */
	public static void setSession(FBSession session) {
		mSharedSession = session;
	}

	/**
	 * Constructs a session and stores it as the globally shared session
	 * instance.
	 * 
	 * @param secret
	 *            the application secret (optional)
	 */
	public static FBSession getSessionForApplication_secret(String key,
			String secret, FBSessionDelegate delegate) {
		FBSession session = initWithKey(key, /* secret */secret, /* getSessionProxy */
		null);

		session.getDelegates().add(delegate);
		return session;
	}

	/**
	 * Constructs a session and stores it as the global singleton.
	 * 
	 * @param getSessionProxy
	 *            a url to that proxies auth.getSession (optional)
	 */
	public static FBSession getSessionForApplication_getSessionProxy(
			String key, String getSessionProxy, FBSessionDelegate delegate) {
		FBSession session = initWithKey(key, /* secret */null, /* getSessionProxy */
		getSessionProxy);
		session.getDelegates().add(delegate);
		return session;
	}

	// /////////////////////////////////////////////////////////////////////////////////////////////////
	// private

	public void save(Context context) {
		if (FacebookModule.usingOauth) {
			throw new IllegalStateException("'save' is invalid if OAUTH is used");
		}
		SharedPreferences defaults = context.getSharedPreferences(PREFS_NAME,
				Context.MODE_PRIVATE);
		Editor editor = defaults.edit();
		if (mUid != null) {
			editor.putLong("FBUserId", mUid);
		} else {
			editor.remove("FBUserId");
		}

		if (mSessionKey != null) {
			editor.putString("FBSessionKey", mSessionKey);
		} else {
			editor.remove("FBSessionKey");
		}

		if (mSessionSecret != null) {
			editor.putString("FBSessionSecret", mSessionSecret);
		} else {
			editor.remove("FBSessionSecret");
		}

		if (mExpirationDate != null) {
			editor.putLong("FBSessionExpires", mExpirationDate.getTime());
		} else {
			editor.remove("FBSessionExpires");
		}

		if (permissions != null) {
			try {
				String perms = new JSONObject(permissions).toString();
				editor.putString("FBPermissions", perms);
			} catch (Exception ex) {
			}
		} else {
			editor.remove("FBPermissions");
		}
		editor.commit();
	}
	
	public void save_oauth(Context context)
	{
		SharedPreferences defaults = context.getSharedPreferences(PREFS_NAME,
				Context.MODE_PRIVATE);
		Editor editor = defaults.edit();
		if (mAccessToken != null) {
			editor.putString("FBAccessToken", mAccessToken);
		} else {
			editor.remove("FBAccessToken");
		}
		
		if (mExpirationDate != null) {
			editor.putLong("FBSessionExpires", mExpirationDate.getTime());
		} else {
			editor.remove("FBSessionExpires");
		}
		
		editor.commit();
		
		
	}

	public void unsave(Context context) {
		Editor defaults = context.getSharedPreferences(PREFS_NAME,
				Context.MODE_PRIVATE).edit();

		defaults.remove("FBUserId");
		defaults.remove("FBSessionKey");
		defaults.remove("FBSessionSecret");
		defaults.remove("FBSessionExpires");
		defaults.remove("FBPermissions");
		defaults.remove("FBAccessToken");
		defaults.commit();
		if (permissions != null) {
			permissions.clear();
			permissions=null;
		}
	}

	private void startFlushTimer() {
		if (mRequestTimer == null) {
			long timeIntervalSinceNow = CcDate
					.timeIntervalSinceNow(mLastRequestTime);
			long t = BURSTDURATION + timeIntervalSinceNow;
			mRequestTimer = new Timer();
			mRequestTimer.schedule(requestTimerReady, t * 1000);
		}
	}

	private void enqueueRequest(FBRequest request) {
		mRequestQueue.add(request);
		startFlushTimer();
	}

	private boolean performRequest(FBRequest request, boolean enqueue) {
		// Stagger requests that happen in short bursts to prevent the server
		// from rejecting
		// them for making too many requests in a short time
		long t = 0;
		boolean burst = false;
		if (mLastRequestTime != null) {
			t = new Date().getTime() - mLastRequestTime.getTime();
			burst = t < BURSTDURATION;
		}

		if (mLastRequestTime != null && burst
				&& ++mRequestBurstCount > MAXBURSTREQUESTS) {
			if (enqueue) {
				enqueueRequest(request);
			}
			return false;
		} else {
			try {
				request.connect();
			} catch (IOException e) {
				e.printStackTrace();
			}

			if (!burst) {
				mRequestBurstCount = 0;
				mLastRequestTime = request.getTimestamp();
			}
		}
		return true;
	}

	private void flushRequestQueue() {
		while (mRequestQueue.size() > 0) {
			FBRequest request = mRequestQueue.get(0);
			if (performRequest(request, false)) {
				mRequestQueue.remove(0);
			} else {
				startFlushTimer();
				break;
			}
		}
	}

	private TimerTask requestTimerReady = new TimerTask() {
		public void run() {
			mRequestTimer = null;
			flushRequestQueue();
		}
	};

	// /////////////////////////////////////////////////////////////////////////////////////////////////
	// public

	/**
	 * The URL used for API HTTP requests.
	 */
	public String getApiURL() {
		return APIRESTURL;
	}

	/**
	 * The URL used for secure API HTTP requests.
	 */
	public String getApiSecureURL() {
		return APIRESTSECUREURL;
	}

	/**
	 * Determines if the session is active and connected to a user.
	 */
	public boolean isConnected() {
		if (FacebookModule.usingOauth) {
			return mAccessToken != null && !hasExpired() ;
		} else {
			return mSessionKey != null && mUid.longValue() != 0;
		}
	}
	
	private boolean hasExpired() {
		if (mExpirationDate == null) {
			return false;
		}
		Calendar c = Calendar.getInstance();
		c.setTime(mExpirationDate);
		return (c.before(Calendar.getInstance()));
		
	}

	/**
	 * Begins a session for a user with a given key and secret.
	 */
	public void begin(Context context, Long uid, String sessionKey,
			String sessionSecret, Date expires) {
		if (FacebookModule.usingOauth) {
			throw new IllegalStateException("'begin' is invalid if OAUTH used");
		}
		mUid = uid;
		mSessionKey = sessionKey;
		mSessionSecret = sessionSecret;
		mExpirationDate = (Date) expires.clone();
		save(context);
	}
	
	// OAUTH version of begin()
	public void begin_oauth(Context context, String access_token, String expires_in_seconds)
	{
		mAccessToken = access_token;
		Calendar c = Calendar.getInstance();
		c.setTimeInMillis(System.currentTimeMillis() + Integer.parseInt(expires_in_seconds) * 1000);
		mExpirationDate = c.getTime();
		save_oauth(context);
	}

	/**
	 * Resumes a previous session whose uid, session key, and secret are cached
	 * on disk.
	 */
	public boolean resume(Context context) {
		if (FacebookModule.usingOauth) {
			throw new IllegalStateException("'resume' is invalid if OAUTH is used");
		}
		SharedPreferences defaults = context.getSharedPreferences(PREFS_NAME,
				Context.MODE_PRIVATE);
		Long uid = defaults.getLong("FBUserId", 0);
		Log.d("FBSession", "FBUserId = " + uid);
		if (uid != 0) {
			boolean loadSession = false;
			long expires = defaults.getLong("FBSessionExpires", 0);
			if (expires > 0) {
				Date expirationDate = new Date(expires);
				Log.d(
								"FBSession",
								"expirationDate = " + expirationDate != null ? expirationDate
										.toString()
										: "null");
				long timeIntervalSinceNow = CcDate
						.timeIntervalSinceNow(expirationDate);
				Log.d("FBSession", "Time interval since now = "
						+ timeIntervalSinceNow);

				if (expirationDate == null || timeIntervalSinceNow <= 0) {
					loadSession = true;
				}
			} else {
				Log.d("FBSession",
						"FBSessionExpires does not exist.  Loading session...");
				loadSession = true;
			}
			if (loadSession) {
				String fbPerms = defaults.getString("FBPermissions", null);
				if (fbPerms != null) {
					this.permissions = Collections
							.synchronizedMap(new HashMap<String, String>());
					try {
						FBUtil.jsonToMap(new JSONObject(fbPerms),
								this.permissions);
					} catch (JSONException ex) {
						ex.printStackTrace();
					}
				}
				Log.d("FBSession", "Session can be loaded.  Loading...");
				mUid = uid;
				mSessionKey = defaults.getString("FBSessionKey", null);
				mSessionSecret = defaults.getString("FBSessionSecret", null);

				for (FBSessionDelegate delegate : mDelegates) {
					delegate.sessionDidLogin(this, uid);
				}
				return true;
			}
		}
		return false;
	}
	
	public boolean resume_oauth(Context context)
	{
		SharedPreferences defaults = context.getSharedPreferences(PREFS_NAME,
				Context.MODE_PRIVATE);
		mAccessToken = defaults.getString("FBAccessToken", null);
		long expiration = defaults.getLong("FBSessionExpires", 0);
		if (expiration == 0 || mAccessToken == null){
			mAccessToken = null;
			return false;
		} else {
			Calendar c = Calendar.getInstance();
			c.setTimeInMillis(expiration);
			mExpirationDate = c.getTime();
			if (c.before(Calendar.getInstance())) {
				mExpirationDate = null;
				mAccessToken = null;
				return false;
			} else {
				for (FBSessionDelegate delegate : mDelegates) {
					delegate.sessionDidLogin(this, null);
				}
				return true;
			}
		}
		
	}

	/**
	 * Ends the current session and deletes the uid, session key, and secret
	 * from disk.
	 */
	public void logout(Context context) {

		if (mSessionKey != null || mAccessToken != null) {

			// Execute will logout
			for (FBSessionDelegate delegate : mDelegates) {
				delegate.sessionWillLogout(this, mUid);
			}

			// Clear the session
			mUid = Long.valueOf(0);
			mSessionKey = null;
			mSessionSecret = null;
			mExpirationDate = null;
			mAccessToken = null;
		}

		// Remove session cookies from the web view. We create the
		// singleton CookieSyncManager for this context in case it
		// doesn't exist yet.
		CookieSyncManager cookieSyncManager = CookieSyncManager
				.createInstance(context);
		CookieManager cookieManager = CookieManager.getInstance();
		cookieManager.removeSessionCookie();
		cookieSyncManager.sync();

		// Clear stored user preferences regarding the session
		unsave(context);

		// Execute did logout
		for (FBSessionDelegate delegate : mDelegates)
			delegate.sessionDidLogout(this);
	}

	/**
	 * Sends a fully configured request to the server for execution.
	 */
	public void send(FBRequest request) {
		performRequest(request, true);
	}

	// /////////////////////////////////////////////////////////////////////////////////////////////////
	// instance variables getters and setters

	/**
	 * Delegates which implement FBSessionDelegate.
	 */
	public List<FBSessionDelegate> getDelegates() {
		return mDelegates;
	}

	/**
	 * Your application's API key, as passed to the constructor.
	 */
	public String getApiKey() {
		return mApiKey;
	}

	/**
	 * Your application's API secret, as passed to the constructor.
	 */
	public String getApiSecret() {
		return mApiSecret;
	}

	/**
	 * The URL to call to create a session key after login.
	 * 
	 * This is an alternative to calling auth.getSession directly using the
	 * secret key.
	 */
	public String getGetSessionProxy() {
		return mGetSessionProxy;
	}

	/**
	 * The current user's Facebook id.
	 */
	public Long getUid() {
		return mUid;
	}

	/**
	 * The current user's session key.
	 */
	public String getSessionKey() {
		return mSessionKey;
	}

	/**
	 * The current user's session secret.
	 */
	public String getSessionSecret() {
		return mSessionSecret;
	}

	/**
	 * The expiration date of the session key.
	 */
	public Date getExpirationDate() {
		return mExpirationDate;
	}

	public boolean hasUnsetPermissions() {
		return permissions == null;
	}

	public void setPermissions(Context ctx, Map<String, String> perm) {
		this.permissions = Collections.synchronizedMap(perm);
		this.save(ctx);
	}

	public boolean hasPermission(String name) {
		if (this.permissions != null) {
			String value = (String) this.permissions.get(name);
			if (value != null && value.equals("1")) {
				return true;
			}
		}
		return false;
	}

	public void addPermissions(Context ctx, String name, String value) {
		if (this.permissions == null) {
			this.permissions = Collections
					.synchronizedMap(new HashMap<String, String>());
		}
		this.permissions.put(name, value);
		this.save(ctx);
	}
	
	public String getAccessToken() {
		return mAccessToken;
	}

	// /////////////////////////////////////////////////////////////////////////////////////////////////

	public static abstract class FBSessionDelegate implements ISessionDelegate {

		/**
		 * Called when a user has successfully logged in and begun a session.
		 */
		public void sessionDidLogin(FBSession session, Long uid) {
		}

		/**
		 * Called when a session is about to log out.
		 */
		public void sessionWillLogout(FBSession session, Long uid) {
		}

		/**
		 * Called when a session has logged out.
		 */
		public void sessionDidLogout(FBSession session) {
		}

	}
	
}
