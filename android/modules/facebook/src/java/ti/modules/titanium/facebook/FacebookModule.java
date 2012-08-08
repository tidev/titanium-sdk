/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.facebook;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.lang.ref.WeakReference;
import java.net.MalformedURLException;
import java.util.ArrayList;
import java.util.Date;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.CurrentActivityListener;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.util.TiActivityResultHandler;
import org.appcelerator.titanium.util.TiActivitySupport;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

import com.facebook.android.AsyncFacebookRunner;
import com.facebook.android.AsyncFacebookRunner.RequestListener;
import com.facebook.android.DialogError;
import com.facebook.android.Facebook;
import com.facebook.android.Facebook.DialogListener;
import com.facebook.android.FacebookError;
import com.facebook.android.Util;


@Kroll.module(name="Facebook", id="ti.facebook")
public class FacebookModule extends KrollModule
{
	protected static final String TAG = "FacebookModule";

    @Kroll.constant public static final int BUTTON_STYLE_NORMAL = 0;
    @Kroll.constant public static final int BUTTON_STYLE_WIDE = 1;

	protected Facebook facebook = null;
	protected String uid = null;
	protected WeakReference<Context> loginContext = null; // Facebook authorize and logout should use same context.

	private boolean loggedIn = false;
	private ArrayList<TiFacebookStateListener> stateListeners = new ArrayList<TiFacebookStateListener>();
	private SessionListener sessionListener = null;
	private AsyncFacebookRunner fbrunner;
	private String appid = null;
	private String[] permissions = new String[]{};
	private boolean forceDialogAuth = true;

	public FacebookModule()
	{
		super();
		Util.setLogEnabled(Log.isDebugModeEnabled());
		sessionListener = new SessionListener(this);
		SessionEvents.addAuthListener(sessionListener);
		SessionEvents.addLogoutListener(sessionListener);
		debug("FacebookModule()");
		appid = SessionStore.getSavedAppId(TiApplication.getInstance());
		if (appid != null) {
			debug("Attempting session restore for appid " + appid);
			facebook = new Facebook(appid);
			SessionStore.restore(this, TiApplication.getInstance());
			if (facebook.isSessionValid()) {
				debug("Session restore succeeded.  Now logged in.");
				loggedIn = true;
			} else {
				debug("Session restore failed.  Not logged in.");
				loggedIn = false;
			}
		}
	}

	public FacebookModule(TiContext tiContext)
	{
		this();
	}

	@Kroll.getProperty @Kroll.method
	public boolean getLoggedIn()
	{
		return isLoggedIn();
	}

	@Kroll.getProperty @Kroll.method
	public String getAccessToken()
	{
		if (facebook != null) {
			return facebook.getAccessToken();
		} else {
			return null;
		}
	}

	@Kroll.getProperty @Kroll.method
	public String getAppid()
	{
		return appid;
	}

	@Kroll.setProperty @Kroll.method
	public void setAppid(String appid)
	{
		if (this.appid != null && !this.appid.equals(appid)) {
			if (facebook != null && facebook.isSessionValid()) {
				// A facebook session existed, but the appid was changed.  Any session info
				// should be destroyed.
				Log.w(TAG, "Appid was changed while session active.  Removing session info.");
				destroyFacebookSession();
				facebook = null;
			}
		}
		this.appid = appid;
		if (facebook == null || !facebook.getAppId().equals(appid)) {
			facebook = new Facebook(appid);
		}
	}

	@Kroll.getProperty @Kroll.method
	public String getUid()
	{
		return uid;
	}

	@Kroll.getProperty @Kroll.method
	public String[] getPermissions()
	{
		return permissions;
	}

	@Kroll.setProperty @Kroll.method
	public void setPermissions(String[] permissions)
	{
		this.permissions = permissions;
	}

	@Kroll.getProperty @Kroll.method
	public Date getExpirationDate()
	{
		if (facebook != null) {
			return TiConvert.toDate(facebook.getAccessExpires());
		} else {
			return new Date(0);
		}
	}

	@Kroll.getProperty @Kroll.method
	public boolean getForceDialogAuth()
	{
		return forceDialogAuth;
	}

	@Kroll.setProperty @Kroll.method
	public void setForceDialogAuth(boolean value)
	{
		this.forceDialogAuth = value;
	}

	@Kroll.method
	public TiFacebookModuleLoginButtonProxy createLoginButton(@Kroll.argument(optional=true) KrollDict options)
	{
		TiFacebookModuleLoginButtonProxy login = new TiFacebookModuleLoginButtonProxy(this);
		if (options != null) {
			login.extend(options);
		}
		return login;
	}

	@Kroll.method
	public void authorize()
	{
		debug("authorize; permissions.length == " + permissions.length);
		if (this.isLoggedIn()) {
			// if already authorized, this should do nothing
			debug("Already logged in, ignoring authorize() request");
			return;
		}

		if (appid == null) {
			Log.w(TAG, "authorize() called without appid being set; throwing...");
			throw new IllegalStateException("missing appid");
		}

		// forget session in case this fails.
		SessionStore.clear(TiApplication.getInstance());

		if (facebook == null) {
			facebook = new Facebook(appid);
		}

		// Important to be done on the current activity since it will display dialog.
		TiUIHelper.waitForCurrentActivity(new CurrentActivityListener() {
			@Override
			public void onCurrentActivityReady(Activity activity)
			{
				executeAuthorize(activity);
			}
		});
	}

	@Kroll.method
	public void logout()
	{
		boolean wasLoggedIn = isLoggedIn();
		destroyFacebookSession();
		if (facebook != null && wasLoggedIn) {
			SessionEvents.onLogoutBegin();
			executeLogout();
		} else {
			loginContext = null;
		}
	}

	@Kroll.method
	public void requestWithGraphPath(String path, KrollDict params, String httpMethod, KrollFunction callback)
	{
		if (facebook == null) {
			Log.w(TAG, "requestWithGraphPath called without Facebook being instantiated.  Have you set appid?");
			return;
		}
		AsyncFacebookRunner runner = getFBRunner();
		Bundle paramBundle = Utils.mapToBundle(params);
		if (httpMethod == null || httpMethod.length() == 0) {
			httpMethod = "GET";
		}
		runner.request(path, paramBundle, httpMethod.toUpperCase(), new TiRequestListener(this, path, true, callback), null);
	}

	@Kroll.method
	public void request(String method, KrollDict params, KrollFunction callback)
	{
		if (facebook == null) {
			Log.w(TAG, "request called without Facebook being instantiated.  Have you set appid?");
			return;
		}

		String httpMethod = "GET";
		if (params != null) {
			for (Object v : params.values()) {
				if (v instanceof TiBlob || v instanceof TiBaseFile) {
					httpMethod = "POST";
					break;
				}
			}
		}

		Bundle bundle = Utils.mapToBundle(params);
		if (!bundle.containsKey("method")) {
			bundle.putString("method", method);
		}
		getFBRunner().request(null, bundle, httpMethod, new TiRequestListener(this, method, false, callback), null);
	}

	@Kroll.method
	public void dialog(final String action, final KrollDict params, final KrollFunction callback)
	{
		if (facebook == null) {
			Log.w(TAG, "dialog called without Facebook being instantiated.  Have you set appid?");
			return;
		}

		TiUIHelper.waitForCurrentActivity(new CurrentActivityListener() {
			@Override
			public void onCurrentActivityReady(Activity activity)
			{
				final Activity fActivity = activity;
				fActivity.runOnUiThread(new Runnable()
				{
					@Override
					public void run()
					{
						facebook.dialog(fActivity, action, Utils.mapToBundle(params),
							new TiDialogListener(FacebookModule.this, callback, action));
					}
				});
			}
		});
	}

	protected void completeLogin()
	{
		getFBRunner().request("me", new RequestListener()
		{
			@Override
			public void onMalformedURLException(MalformedURLException e, Object state)
			{
				loginError(e);
			}

			@Override
			public void onIOException(IOException e, Object state)
			{
				loginError(e);
			}

			@Override
			public void onFileNotFoundException(FileNotFoundException e, Object state)
			{
				loginError(e);
			}

			@Override
			public void onFacebookError(FacebookError e, Object state)
			{
				loginError(e);
			}

			@Override
			public void onComplete(String response, Object state)
			{
				try {
					debug("onComplete (getting 'me'): " + response);
					JSONObject json = Util.parseJson(response);
					uid = json.getString("id");
					loggedIn = true;
					SessionStore.save(FacebookModule.this, TiApplication.getInstance());
					KrollDict data = new KrollDict();
					data.put("cancelled", false);
					data.put("success", true);
					data.put("uid", uid);
					data.put("data", response);
					fireLoginChange();
					fireEvent("login", data);
				} catch (JSONException e) {
					Log.e(TAG, e.getMessage(), e);
				} catch (FacebookError e) {
					Log.e(TAG, e.getMessage(), e);
				}
			}
		});
	}

	protected void completeLogout()
	{
		destroyFacebookSession();
		loginContext = null;
		fireLoginChange();
		fireEvent("logout", new KrollDict());
	}

	protected void debug(String message)
	{
		Log.d(TAG, message, Log.DEBUG_MODE);
	}

	protected void addListener(TiFacebookStateListener listener)
	{
		if (!stateListeners.contains(listener)) {
			stateListeners.add(listener);
		}
	}

	protected void removeListener(TiFacebookStateListener listener)
	{
		stateListeners.remove(listener);
	}

	protected void executeAuthorize(Activity activity)
	{
		loginContext = new WeakReference<Context>(activity);
		int activityCode = Facebook.FORCE_DIALOG_AUTH;
		if (forceDialogAuth) {
			facebook.authorize(activity, permissions, activityCode, new LoginDialogListener());
		} else {
			// Single sign-on support
			TiActivitySupport activitySupport  = (TiActivitySupport) activity;
			activityCode = activitySupport.getUniqueResultCode();
			TiActivityResultHandler resultHandler = new TiActivityResultHandler()
			{
				@Override
				public void onResult(Activity activity, int requestCode, int resultCode, Intent data)
				{
					Log.d(TAG, "onResult from Facebook single sign-on attempt. resultCode: " + resultCode, Log.DEBUG_MODE);
					facebook.authorizeCallback(requestCode, resultCode, data);
				}
				@Override
				public void onError(Activity activity, int requestCode, Exception e)
				{
					Log.e(TAG, e.getLocalizedMessage(), e);
				}
			};
			facebook.authorize(activity, activitySupport, permissions, activityCode, new LoginDialogListener(), 
					resultHandler);
		}
	}

	protected void executeLogout()
	{
		Context logoutContext = null;

		// Try to use the same context as was used for login.
		if (loginContext != null) {
			logoutContext = loginContext.get();
		}

		if (logoutContext == null) {
			// Fallback by using the application context.  The reason facebook.authorize and facebook.logout
			// want a Context is because they use the CookieSyncManager, which needs a Context.
			// The CookieSyncManager anyway takes that Context and calls context.getApplicationContext()
			// for its use.
			logoutContext = TiApplication.getInstance().getApplicationContext();
		}

		getFBRunner().logout(logoutContext, new LogoutRequestListener());
	}

	private boolean isLoggedIn()
	{
		return loggedIn && facebook != null && facebook.isSessionValid();
	}

	private void loginError(Throwable t)
	{
		Log.e(TAG, t.getMessage(), t);
		loggedIn = false;
		KrollDict data = new KrollDict();
		data.put("cancelled", false);
		data.put("success", false);
		data.put("error", t.getMessage());
		fireEvent("login", data);
	}

	private void loginCancel()
	{
		debug("login canceled");
		loggedIn = false;
		KrollDict data = new KrollDict();
		data.put("cancelled", true);
		data.put("success", false);
		fireEvent("login", data);
	}

	private AsyncFacebookRunner getFBRunner()
	{
		if (fbrunner == null) {
			fbrunner = new AsyncFacebookRunner(facebook);
		}
		return fbrunner;
	}

	private void destroyFacebookSession()
	{
		SessionStore.clear(TiApplication.getInstance());
		uid = null;
		loggedIn = false;
	}

	private void fireLoginChange()
	{
		for (TiFacebookStateListener listener : stateListeners) {
			if (getLoggedIn()) {
				listener.login();
			} else {
				listener.logout();
			}
		}
	}

	@Override
	public void onDestroy(Activity activity)
	{
		super.onDestroy(activity);
		if (sessionListener != null) {
			SessionEvents.removeAuthListener(sessionListener);
			SessionEvents.removeLogoutListener(sessionListener);
			sessionListener = null;
		}
	}

	private final class LoginDialogListener implements DialogListener
	{
		public void onComplete(Bundle values)
		{
			debug("LoginDialogListener onComplete");
			SessionEvents.onLoginSuccess();
		}

		public void onFacebookError(FacebookError error)
		{
			Log.e(TAG, "LoginDialogListener onFacebookError: " + error.getMessage(), error);
			loginContext = null;
			SessionEvents.onLoginError(error.getMessage());
		}

		public void onError(DialogError error)
		{
			Log.e(TAG, "LoginDialogListener onError: " + error.getMessage(), error);
			loginContext = null;
			SessionEvents.onLoginError(error.getMessage());
		}

		public void onCancel()
		{
			loginContext = null;
			FacebookModule.this.loginCancel();
		}
	}

	private final class LogoutRequestListener implements RequestListener
	{
		@Override
		public void onComplete(String response, Object state)
		{
			debug("Logout request complete: " + response);
			SessionEvents.onLogoutFinish();
		}

		@Override
		public void onFacebookError(FacebookError e, Object state)
		{
			Log.e(TAG, "Logout failure: " + e.getMessage(), e);
		}

		@Override
		public void onFileNotFoundException(FileNotFoundException e, Object state)
		{
			Log.e(TAG, "Logout failure: " + e.getMessage(), e);
		}

		@Override
		public void onIOException(IOException e, Object state)
		{
			Log.e(TAG, "Logout failure: " + e.getMessage(), e);
		}

		@Override
		public void onMalformedURLException(MalformedURLException e, Object state)
		{
			Log.e(TAG, "Logout failure: " + e.getMessage(), e);
		}
	}

}
