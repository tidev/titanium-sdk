/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.network;

import java.net.CookieHandler;
import java.net.HttpCookie;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.telephony.TelephonyCallback;
import android.telephony.TelephonyDisplayInfo;
import android.telephony.TelephonyManager;
import android.webkit.CookieManager;
import android.webkit.CookieSyncManager;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;
import androidx.appcompat.app.AppCompatActivity;

@SuppressWarnings("deprecation")
@Kroll.module
public class NetworkModule extends KrollModule
{
	private static final String TAG = "TiNetwork";
	private static java.net.CookieManager cookieManager;

	public static final String EVENT_CONNECTIVITY = "change";
	public static final String NETWORK_USER_AGENT = System.getProperties().getProperty("http.agent");

	@Kroll.constant
	public static final int NETWORK_NONE = 0;
	@Kroll.constant
	public static final int NETWORK_WIFI = 1;
	@Kroll.constant
	public static final int NETWORK_MOBILE = 2;
	@Kroll.constant
	public static final int NETWORK_LAN = 3;
	@Kroll.constant
	public static final int NETWORK_UNKNOWN = 4;

	@Kroll.constant
	public static final int NETWORK_TYPE_UNKNOWN = -1;
	@Kroll.constant
	public static final int NETWORK_TYPE_4G = 0;
	@Kroll.constant
	public static final int NETWORK_TYPE_5G_NSA = 1;
	@Kroll.constant
	public static final int NETWORK_TYPE_2G = 2;
	@Kroll.constant
	public static final int NETWORK_TYPE_3G = 3;
	@Kroll.constant
	public static final int NETWORK_TYPE_WIFI = 4;
	@Kroll.constant
	public static final int NETWORK_TYPE_5G_SA = 5;

	@SuppressLint("InlinedApi")
	@Kroll.constant
	public static final int NETWORK_OVERRIDE_NSA = TelephonyDisplayInfo.OVERRIDE_NETWORK_TYPE_NR_NSA;
	@SuppressLint("InlinedApi")
	@Kroll.constant
	public static final int NETWORK_OVERRIDE_MMWAVE = TelephonyDisplayInfo.OVERRIDE_NETWORK_TYPE_NR_NSA_MMWAVE;
	@SuppressLint("InlinedApi")
	@Kroll.constant
	public static final int NETWORK_OVERRIDE_ADVANCED = TelephonyDisplayInfo.OVERRIDE_NETWORK_TYPE_NR_ADVANCED;

	@Kroll.constant
	public static final int TLS_DEFAULT = 0;
	@Kroll.constant
	public static final int TLS_VERSION_1_0 = 1;
	@Kroll.constant
	public static final int TLS_VERSION_1_1 = 2;
	@Kroll.constant
	public static final int TLS_VERSION_1_2 = 3;
	@Kroll.constant
	public static final int TLS_VERSION_1_3 = 4;

	@Kroll.constant
	public static final int PROGRESS_UNKNOWN = -1;

	public enum State {
		UNKNOWN,

		/** This state is returned if there is connectivity to any network **/
		CONNECTED,
		/**
         * This state is returned if there is no connectivity to any network. This is set
         * to true under two circumstances:
         * <ul>
         * <li>When connectivity is lost to one network, and there is no other available
         * network to attempt to switch to.</li>
         * <li>When connectivity is lost to one network, and the attempt to switch to
         * another network fails.</li>
         */
		NOT_CONNECTED
	}

	class NetInfo
	{
		public State state;
		public boolean failover;
		public String typeName;
		public int type;
		public String reason;

		public NetInfo()
		{
			state = State.UNKNOWN;
			failover = false;
			typeName = "NONE";
			type = -1;
			reason = "";
		}
	}

	private NetInfo lastNetInfo;

	private boolean isListeningForConnectivity;
	private TiNetworkListener networkListener;
	private ConnectivityManager connectivityManager;
	private DisplayInfoCallback displayInfoCallback;
	TelephonyManager telephonyManager;

	private final Handler messageHandler = new Handler() {
		public void handleMessage(Message msg)
		{
			Bundle b = msg.getData();

			boolean connected = b.getBoolean(TiNetworkListener.EXTRA_CONNECTED);
			int type = b.getInt(TiNetworkListener.EXTRA_NETWORK_TYPE);
			String typeName = b.getString(TiNetworkListener.EXTRA_NETWORK_TYPE_NAME);
			boolean failover = b.getBoolean(TiNetworkListener.EXTRA_FAILOVER);
			String reason = b.getString(TiNetworkListener.EXTRA_REASON);

			// Set last state
			synchronized (lastNetInfo)
			{
				if (connected) {
					lastNetInfo.state = State.CONNECTED;
				} else {
					lastNetInfo.state = State.NOT_CONNECTED;
				}
				lastNetInfo.type = type;
				lastNetInfo.typeName = typeName;
				lastNetInfo.failover = failover;
				lastNetInfo.reason = reason;
			}

			KrollDict data = new KrollDict();
			data.put("online", connected);
			int titaniumType = networkTypeToTitanium(connected, type);
			data.put("networkType", titaniumType);
			data.put("networkTypeName", networkTypeToTypeName(titaniumType));
			data.put("reason", reason);
			fireEvent(EVENT_CONNECTIVITY, data);
		}
	};

	public NetworkModule()
	{
		super();

		this.lastNetInfo = new NetInfo();
		this.isListeningForConnectivity = false;
	}

	@Override
	protected void eventListenerAdded(String event, int count, KrollProxy proxy)
	{
		super.eventListenerAdded(event, count, proxy);
		if ("change".equals(event)) {
			if (!isListeningForConnectivity) {
				manageConnectivityListener(true);
			}
		}
	}

	@Override
	protected void eventListenerRemoved(String event, int count, KrollProxy proxy)
	{
		super.eventListenerRemoved(event, count, proxy);
		if ("change".equals(event) && count == 0) {
			manageConnectivityListener(false);
		}
	}

	@Kroll.getProperty
	public boolean getOnline()
	{
		boolean result = false;

		ConnectivityManager cm = getConnectivityManager();
		if (cm != null) {
			NetworkInfo ni = getConnectivityManager().getActiveNetworkInfo();

			if (ni != null && ni.isAvailable() && ni.isConnected()) {
				result = true;
			}
		} else {
			Log.w(TAG, "ConnectivityManager was null", Log.DEBUG_MODE);
		}
		return result;
	}

	@Kroll.method
	public void registerForNetworkOverride(KrollDict options)
	{
		Context a = TiApplication.getAppRootOrCurrentActivity();
		if (a != null && options.containsKeyAndNotNull(TiC.PROPERTY_SUCCESS)
			&& Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
			KrollFunction clbSuccess = (KrollFunction) options.get(TiC.PROPERTY_SUCCESS);
			displayInfoCallback = new DisplayInfoCallback(clbSuccess);
			telephonyManager = (TelephonyManager) a.getSystemService(Context.TELEPHONY_SERVICE);
			telephonyManager.registerTelephonyCallback(a.getMainExecutor(), displayInfoCallback);
		}
	}

	@Kroll.method
	public void removeNetworkOverride()
	{
		if (telephonyManager != null && displayInfoCallback != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
			telephonyManager.unregisterTelephonyCallback(displayInfoCallback);
			telephonyManager = null;
		}
	}

	protected int networkTypeToTitanium(boolean online, int androidType)
	{
		int type = NetworkModule.NETWORK_UNKNOWN;
		if (online) {
			switch (androidType) {
				case ConnectivityManager.TYPE_WIFI:
					type = NetworkModule.NETWORK_WIFI;
					break;
				case ConnectivityManager.TYPE_MOBILE:
					type = NetworkModule.NETWORK_MOBILE;
					break;
				case ConnectivityManager.TYPE_ETHERNET:
					type = NetworkModule.NETWORK_LAN;
					break;
				default:
					type = NetworkModule.NETWORK_UNKNOWN;
			}
		} else {
			type = NetworkModule.NETWORK_NONE;
		}
		return type;
	}

	@Kroll.getProperty
	public int getNetworkType()
	{
		int type = NETWORK_UNKNOWN;

		// start event needs network type. So get it if we don't have it.
		if (connectivityManager == null) {
			connectivityManager = getConnectivityManager();
		}

		try {
			NetworkInfo ni = connectivityManager.getActiveNetworkInfo();
			if (ni != null && ni.isAvailable() && ni.isConnected()) {
				type = networkTypeToTitanium(true, ni.getType());
			} else {
				type = NetworkModule.NETWORK_NONE;
			}
		} catch (SecurityException e) {
			Log.w(TAG, "Permission has been removed. Cannot determine network type: " + e.getMessage());
		}
		return type;
	}

	@Kroll.getProperty
	public int getNetworkSubtype()
	{
		int type = NETWORK_TYPE_UNKNOWN;
		if (connectivityManager == null) {
			connectivityManager = getConnectivityManager();
		}

		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
			try {
				NetworkInfo ni = connectivityManager.getActiveNetworkInfo();
				if (ni != null && ni.isAvailable() && ni.isConnected()) {
					type = networkSubTypeToTitanium(ni.getSubtype());
				}
			} catch (Exception e) {
				Log.w(TAG, "Error reading subType: " + e.getMessage());
			}
		}
		return type;
	}

	private int networkSubTypeToTitanium(int subtype)
	{
		int type = NETWORK_TYPE_UNKNOWN;
		switch (subtype) {
			case TelephonyManager.NETWORK_TYPE_EDGE:
			case TelephonyManager.NETWORK_TYPE_GPRS:
				type = NETWORK_TYPE_2G;
				break;
			case TelephonyManager.NETWORK_TYPE_1xRTT:
			case TelephonyManager.NETWORK_TYPE_CDMA:
			case TelephonyManager.NETWORK_TYPE_EVDO_0:
			case TelephonyManager.NETWORK_TYPE_EVDO_A:
			case TelephonyManager.NETWORK_TYPE_EVDO_B:
			case TelephonyManager.NETWORK_TYPE_HSDPA:
			case TelephonyManager.NETWORK_TYPE_HSPA:
			case TelephonyManager.NETWORK_TYPE_HSUPA:
			case TelephonyManager.NETWORK_TYPE_IDEN:
			case TelephonyManager.NETWORK_TYPE_UMTS:
			case TelephonyManager.NETWORK_TYPE_EHRPD:
			case TelephonyManager.NETWORK_TYPE_HSPAP:
			case TelephonyManager.NETWORK_TYPE_TD_SCDMA:
				type = NETWORK_TYPE_3G;
				break;
			case TelephonyManager.NETWORK_TYPE_LTE:
				type = NETWORK_TYPE_4G;
				break;
			case TelephonyManager.NETWORK_TYPE_NR:
				type = (Build.VERSION.SDK_INT  >= 29 ? NETWORK_TYPE_5G_SA : NETWORK_TYPE_UNKNOWN);
				break;
			case TelephonyManager.NETWORK_TYPE_IWLAN:
				type = NETWORK_TYPE_WIFI;
				break;
			case TelephonyManager.NETWORK_TYPE_GSM:
			case TelephonyManager.NETWORK_TYPE_UNKNOWN:
			default:
				type = NETWORK_TYPE_UNKNOWN;
		}
		return type;
	}

	@Kroll.getProperty
	public String getNetworkTypeName()
	{
		return networkTypeToTypeName(getNetworkType());
	}

	private String networkTypeToTypeName(int type)
	{
		switch (type) {
			case 0:
				return "NONE";
			case 1:
				return "WIFI";
			case 2:
				return "MOBILE";
			case 3:
				return "LAN";
			default:
				return "UNKNOWN";
		}
	}

	@Kroll.method
	@Kroll.topLevel
	public String encodeURIComponent(String component)
	{
		return Uri.encode(component);
	}

	@Kroll.method
	@Kroll.topLevel
	public String decodeURIComponent(String component)
	{
		return Uri.decode(component);
	}

	protected void manageConnectivityListener(boolean attach)
	{
		if (attach) {
			if (!isListeningForConnectivity) {
				if (hasListeners(EVENT_CONNECTIVITY)) {
					if (networkListener == null) {
						networkListener = new TiNetworkListener(messageHandler);
					}
					networkListener.attach(TiApplication.getInstance().getApplicationContext());
					isListeningForConnectivity = true;
					Log.d(TAG, "Adding connectivity listener", Log.DEBUG_MODE);
				}
			}
		} else {
			if (isListeningForConnectivity) {
				networkListener.detach();
				isListeningForConnectivity = false;
				Log.d(TAG, "Removing connectivity listener.", Log.DEBUG_MODE);
			}
		}
	}

	private ConnectivityManager getConnectivityManager()
	{
		ConnectivityManager cm = null;

		Context a = TiApplication.getInstance();
		if (a != null) {
			cm = (ConnectivityManager) a.getSystemService(Context.CONNECTIVITY_SERVICE);
		} else {
			Log.w(TAG, "Activity is null when trying to retrieve the connectivity service", Log.DEBUG_MODE);
		}

		return cm;
	}

	@Override
	public void onDestroy(Activity activity)
	{
		super.onDestroy(activity);
		manageConnectivityListener(false);
		connectivityManager = null;
	}

	public static java.net.CookieManager getCookieManagerInstance()
	{
		if (cookieManager == null) {
			cookieManager = new java.net.CookieManager();
			CookieHandler.setDefault(cookieManager);
		}
		return cookieManager;
	}

	/**
	 * Adds a cookie to the HTTPClient cookie store. Any existing cookie with the same domain and name will be replaced with
	 * the new cookie. This seems like a bug in org.apache.http.impl.client.BasicCookieStore because based on RFC6265
	 * (http://tools.ietf.org/html/rfc6265#section-4.1.2), an existing cookie with the same cookie-name, domain-value and
	 * path-value with the new cookie will be evicted and replaced.
	 * @param cookieProxy the cookie to add
	 */
	@Kroll.method
	public void addHTTPCookie(CookieProxy cookieProxy)
	{
		HttpCookie cookie = cookieProxy.getHTTPCookie();
		String cookieDomain = cookie.getDomain();
		if (cookie != null) {
			URI uriDomain;
			try {
				uriDomain = new URI(cookieDomain);
			} catch (Exception e) {
				uriDomain = null;
			}
			getCookieManagerInstance().getCookieStore().add(uriDomain, cookie);
		}
	}

	/**
	 * Gets all the cookies with the domain, path and name matched with the given values. If name is null, gets all the cookies with
	 * the domain and path matched.
	 * @param domain the domain of the cookie to get. It is case-insensitive.
	 * @param path the path of the cookie to get. It is case-sensitive.
	 * @param name the name of the cookie to get. It is case-sensitive.
	 * @return an array of cookies. If name is null, returns all the cookies with the domain and path matched.
	 */
	@Kroll.method
	public CookieProxy[] getHTTPCookies(String domain, String path, String name)
	{
		if (domain == null || domain.length() == 0) {
			if (Log.isDebugModeEnabled()) {
				Log.e(TAG, "Unable to get the HTTP cookies. Need to provide a valid domain.");
			}
			return null;
		}
		if (path == null || path.length() == 0) {
			path = "/";
		}
		ArrayList<CookieProxy> cookieList = new ArrayList<>();
		List<HttpCookie> cookies = getCookieManagerInstance().getCookieStore().getCookies();
		for (HttpCookie cookie : cookies) {
			String cookieName = cookie.getName();
			String cookieDomain = cookie.getDomain();
			String cookiePath = cookie.getPath();
			if ((name == null || cookieName.equals(name)) && domainMatch(cookieDomain, domain)
				&& pathMatch(cookiePath, path)) {
				cookieList.add(new CookieProxy(cookie));
			}
		}
		if (!cookieList.isEmpty()) {
			return cookieList.toArray(new CookieProxy[0]);
		}
		return null;
	}

	/**
	 * Gets all the cookies with the domain matched with the given value.
	 * @param domain the domain of the cookie to get. It is case-insensitive.
	 * @return an array of cookies with the domain matched.
	 */
	@Kroll.method
	public CookieProxy[] getHTTPCookiesForDomain(String domain)
	{
		if (domain == null || domain.length() == 0) {
			if (Log.isDebugModeEnabled()) {
				Log.e(TAG, "Unable to get the HTTP cookies. Need to provide a valid domain.");
			}
			return null;
		}
		ArrayList<CookieProxy> cookieList = new ArrayList<>();
		List<HttpCookie> cookies = getCookieManagerInstance().getCookieStore().getCookies();
		for (HttpCookie cookie : cookies) {
			String cookieDomain = cookie.getDomain();
			if (domainMatch(cookieDomain, domain)) {
				cookieList.add(new CookieProxy(cookie));
			}
		}
		if (!cookieList.isEmpty()) {
			return cookieList.toArray(new CookieProxy[0]);
		}
		return null;
	}

	/** Removes the cookie with the domain, path and name exactly the same as the given values.
	 * @param domain the domain of the cookie to remove. It is case-insensitive.
	 * @param path the path of the cookie to remove. It is case-sensitive.
	 * @param name the name of the cookie to remove. It is case-sensitive.
	 */
	@Kroll.method
	public void removeHTTPCookie(String domain, String path, String name)
	{
		if (domain == null || name == null) {
			if (Log.isDebugModeEnabled()) {
				Log.e(TAG, "Unable to remove the HTTP cookie. Need to provide a valid domain / name.");
			}
			return;
		}
		java.net.CookieStore cookieStore = getCookieManagerInstance().getCookieStore();
		List<HttpCookie> cookies = new ArrayList<>(getCookieManagerInstance().getCookieStore().getCookies());
		cookieStore.removeAll();
		for (HttpCookie cookie : cookies) {
			String cookieName = cookie.getName();
			String cookieDomain = cookie.getDomain();
			String cookiePath = cookie.getPath();
			if (!(name.equals(cookieName) && stringEqual(domain, cookieDomain, false)
				  && stringEqual(path, cookiePath, true))) {
				URI uriDomain;
				try {
					uriDomain = new URI(cookieDomain);
				} catch (URISyntaxException e) {
					uriDomain = null;
				}
				cookieStore.add(uriDomain, cookie);
			}
		}
	}

	/**
	 * Removes all the cookies with the domain matched with the given value.
	 * @param domain the domain of the cookie to remove. It is case-insensitive.
	 */
	@Kroll.method
	public void removeHTTPCookiesForDomain(String domain)
	{
		java.net.CookieStore cookieStore = getCookieManagerInstance().getCookieStore();
		List<HttpCookie> cookies = new ArrayList<>(getCookieManagerInstance().getCookieStore().getCookies());
		cookieStore.removeAll();
		for (HttpCookie cookie : cookies) {
			String cookieDomain = cookie.getDomain();
			if (!(domainMatch(cookieDomain, domain))) {
				URI uriDomain;
				try {
					uriDomain = new URI(cookieDomain);
				} catch (URISyntaxException e) {
					uriDomain = null;
				}
				cookieStore.add(uriDomain, cookie);
			}
		}
	}

	/**
	 * Removes all the cookies in the HTTPClient cookie store.
	 */
	@Kroll.method
	public void removeAllHTTPCookies()
	{
		java.net.CookieStore cookieStore = getCookieManagerInstance().getCookieStore();
		cookieStore.removeAll();
	}

	/**
	 * Returns true if push notifications are allowed in the app settings
	 * @return boolean if push notifications are allowed in the app settings
	 */
	@RequiresApi(api = Build.VERSION_CODES.TIRAMISU)
	@Kroll.getProperty
	public boolean remoteNotificationsEnabled()
	{
		if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
			return true;
		}

		Context context = TiApplication.getInstance();
		int result = context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS);
		return (result == PackageManager.PERMISSION_GRANTED);
	}

	/**
	 * Registers for push notifications. This is necessary on Android 13+ due to privacy changes
	 *
	 * @param params The parameters containing the success- and error-callback
	 */
	@RequiresApi(api = Build.VERSION_CODES.TIRAMISU)
	@Kroll.method
	public void registerForPushNotifications(KrollDict params)
	{
		KrollFunction successCallback = (KrollFunction) params.get("success");
		KrollFunction errorCallback = (KrollFunction) params.get("error");

		if (this.remoteNotificationsEnabled()) {
			KrollDict event = new KrollDict();
			event.put("success", true);
			event.put("type", "remote");
			if (successCallback != null) {
				successCallback.callAsync(getKrollObject(), new KrollDict());
			}
			return;
		}

		AppCompatActivity activity = (AppCompatActivity) TiApplication.getAppCurrentActivity();
		KrollObject mKrollObject = getKrollObject();

		TiBaseActivity.OnRequestPermissionsResultCallback activityCallback;
		activityCallback = new TiBaseActivity.OnRequestPermissionsResultCallback() {
			@Override
			public void onRequestPermissionsResult(
				@NonNull TiBaseActivity activity, int requestCode,
				@NonNull String[] permissions, @NonNull int[] grantResults)
			{
				Boolean isGranted = false;
				if (grantResults.length > 0) {
					isGranted = grantResults[0] == PackageManager.PERMISSION_GRANTED;
				}

				KrollDict event = new KrollDict();
				event.put("success", isGranted);
				event.put("type", "remote");

				if (isGranted) {
					if (successCallback != null) {
						successCallback.callAsync(getKrollObject(), event);
					}
				} else {
					if (errorCallback != null) {
						errorCallback.callAsync(getKrollObject(), event);
					}
				}

				// Unregister this callback.
				TiBaseActivity.unregisterPermissionRequestCallback(TiC.PERMISSION_CODE_PUSH_NOTIFICATIONS);
			}
		};
		TiBaseActivity.registerPermissionRequestCallback(TiC.PERMISSION_CODE_PUSH_NOTIFICATIONS, activityCallback);
		String[] permissions = new String[] { Manifest.permission.POST_NOTIFICATIONS };
		activity.requestPermissions(permissions, TiC.PERMISSION_CODE_PUSH_NOTIFICATIONS);
	}

	/**
	 * Adds a cookie to the system cookie store. Any existing cookie with the same domain, path and name will be replaced with
	 * the new cookie. The cookie being set must not have expired, otherwise it will be ignored.
	 * @param cookieURLConnectionProxy the cookie to add
	 */
	@Kroll.method
	public void addSystemCookie(CookieProxy cookieURLConnectionProxy)
	{
		HttpCookie cookie = cookieURLConnectionProxy.getHTTPCookie();
		String cookieString = cookie.getName() + "=" + cookie.getValue() + ";";
		String domain = cookie.getDomain();
		if (domain == null) {
			Log.w(TAG, "Unable to add system cookie. Need to provide domain.");
			return;
		}
		//cookieString += " Domain=" + domain + ";";

		String path = cookie.getPath();
		//Date expiryDate = cookie.getExpiryDate();
		boolean secure = cookie.getSecure();
		boolean httponly = TiConvert.toBoolean(cookieURLConnectionProxy.getProperty(TiC.PROPERTY_HTTP_ONLY), false);
		if (path != null) {
			cookieString += " Path=" + path + ";";
		}
		/*
		if (expiryDate != null) {
			cookieString += "; expires=" + CookieProxy.systemExpiryDateFormatter.format(expiryDate);
		}
		*/
		if (secure) {
			cookieString += " Secure;";
		}
		if (httponly) {
			cookieString += " Httponly";
		}
		CookieSyncManager.createInstance(TiApplication.getInstance().getRootOrCurrentActivity());
		CookieManager cookieManager = CookieManager.getInstance();
		cookieManager.setCookie(domain, cookieString);
		CookieSyncManager.getInstance().sync();
	}

	/**
	 * Gets all the cookies with the domain, path and name matched with the given values. If name is null, gets all the cookies with
	 * the domain and path matched.
	 * @param domain the domain of the cookie to get. It is case-insensitive.
	 * @param path the path of the cookie to get. It is case-sensitive.
	 * @param name the name of the cookie to get. It is case-sensitive.
	 * @return an array of cookies only with name and value specified. If name is null, returns all the cookies with the domain and path matched.
	 */
	@Kroll.method
	public CookieProxy[] getSystemCookies(String domain, String path, String name)
	{
		if (domain == null || domain.length() == 0) {
			if (Log.isDebugModeEnabled()) {
				Log.e(TAG, "Unable to get the HTTP cookies. Need to provide a valid domain.");
			}
			return null;
		}
		if (path == null || path.length() == 0) {
			path = "/";
		}

		ArrayList<CookieProxy> cookieList = new ArrayList<>();
		CookieSyncManager.createInstance(TiApplication.getInstance().getRootOrCurrentActivity());
		CookieManager cookieManager = CookieManager.getInstance();
		String url = domain.toLowerCase() + path;
		String cookieString = cookieManager.getCookie(url); // The cookieString is in the format of NAME=VALUE[;
															// NAME=VALUE]
		if (cookieString != null) {
			String[] cookieValues = cookieString.split("; ");
			for (int i = 0; i < cookieValues.length; i++) {
				String[] pair = cookieValues[i].split("=", 2);
				String cookieName = pair[0];
				String value = pair.length == 2 ? pair[1] : null;
				if (name == null || cookieName.equals(name)) {
					cookieList.add(new CookieProxy(cookieName, value, null, null));
				}
			}
		}
		if (!cookieList.isEmpty()) {
			return cookieList.toArray(new CookieProxy[0]);
		}
		return null;
	}

	/**
	 * Removes the cookie with the domain, path and name exactly the same as the given values.
	 * @param domain the domain of the cookie to remove. It is case-insensitive.
	 * @param path the path of the cookie to remove. It is case-sensitive.
	 * @param name the name of the cookie to remove. It is case-sensitive.
	 */
	@Kroll.method
	public void removeSystemCookie(String domain, String path, String name)
	{
		if (domain == null || name == null) {
			if (Log.isDebugModeEnabled()) {
				Log.e(TAG, "Unable to remove the system cookie. Need to provide a valid domain / name.");
			}
			return;
		}
		String lower_domain = domain.toLowerCase();
		String cookieString = name + "=; domain=" + lower_domain + "; path=" + path
							  + "; expires=" + CookieProxy.systemExpiryDateFormatter.format(new Date(0));
		CookieSyncManager.createInstance(TiApplication.getInstance().getRootOrCurrentActivity());
		CookieManager cookieManager = CookieManager.getInstance();
		cookieManager.setCookie(lower_domain, cookieString);
		CookieSyncManager.getInstance().sync();
	}

	/**
	 * Removes all the cookies in the system cookie store.
	 */
	@Kroll.method
	public void removeAllSystemCookies()
	{
		CookieSyncManager.createInstance(TiApplication.getInstance().getRootOrCurrentActivity());
		CookieManager cookieManager = CookieManager.getInstance();
		cookieManager.removeAllCookie();
		CookieSyncManager.getInstance().sync();
	}

	/**
	 * Helper method to decide whether the domain matches the cookie's domain. If the both domains are null, return true.
	 * The domain matching follows RFC6265 (http://tools.ietf.org/html/rfc6265#section-5.1.3).
	 * @param cookieDomain cookie's domain
	 * @param domain domain to match
	 * @return true if the domain matches cookieDomain; false otherwise. If the both domains are null, return true.
	 */
	private boolean domainMatch(String cookieDomain, String domain)
	{
		if (cookieDomain == null && domain == null) {
			return true;
		}
		if (cookieDomain == null || domain == null) {
			return false;
		}

		String lower_cookieDomain = cookieDomain.toLowerCase();
		String lower_domain = domain.toLowerCase();
		if (lower_cookieDomain.startsWith(".")) {
			if (lower_domain.endsWith(lower_cookieDomain.substring(1))) {
				int cookieLen = lower_cookieDomain.length();
				int domainLen = lower_domain.length();
				if (domainLen > cookieLen - 1) {
					// make sure bar.com doesn't match .ar.com
					return lower_domain.charAt(domainLen - cookieLen) == '.';
				}
				return true;
			}
			return false;
		} else {
			return lower_domain.equals(lower_cookieDomain);
		}
	}

	/**
	 * Helper method to decide whether the path matches the cookie's path. If the cookie's path is null or an empty string, return true.
	 * If the path is null or an empty string, use "/" as the default value. The path matching follows RFC6265 (http://tools.ietf.org/html/rfc6265#section-5.1.4).
	 * @param cookiePath cookie's path
	 * @param path path to match
	 * @return true if the path matches cookiePath; false otherwise. If cookiePath is null or an empty string, return true.
	 */
	private boolean pathMatch(String cookiePath, String path)
	{
		if (cookiePath == null || cookiePath.length() == 0) {
			return true;
		}
		if (path == null || path.length() == 0) {
			path = "/";
		}

		if (path.startsWith(cookiePath)) {
			int cookieLen = cookiePath.length();
			int pathLen = path.length();
			if (cookiePath.charAt(cookieLen - 1) != '/' && pathLen > cookieLen) {
				// make sure /wee doesn't match /we
				return path.charAt(cookieLen) == '/';
			}
			return true;
		}
		return false;
	}

	/**
	 * Helper method to determine whether two strings are equal.
	 * @param s1 string to compare
	 * @param s2 string to compare
	 * @param isCaseSensitive true if using case-sensitive comparison; false if using case-insensitive comparison.
	 * @return true if the two strings are both null or they are equal.
	 */
	private boolean stringEqual(String s1, String s2, boolean isCaseSensitive)
	{
		if (s1 == null && s2 == null) {
			return true;
		}
		if (s1 != null && s2 != null) {
			if ((isCaseSensitive && s1.equals(s2)) || (!isCaseSensitive && s1.equalsIgnoreCase(s2))) {
				return true;
			}
		}
		return false;
	}

	@Override
	public String getApiName()
	{
		return "Ti.Network";
	}

	@SuppressLint("NewApi")
	private final class DisplayInfoCallback extends TelephonyCallback
		implements TelephonyCallback.DisplayInfoListener
	{
		KrollFunction clbSuccess;

		public DisplayInfoCallback(KrollFunction clb)
		{
			clbSuccess = clb;
		}

		@Override
		public void onDisplayInfoChanged(TelephonyDisplayInfo telephonyDisplayInfo)
		{
			int overrideNetworkType = telephonyDisplayInfo.getOverrideNetworkType();
			boolean is5gNsa =
				overrideNetworkType == TelephonyDisplayInfo.OVERRIDE_NETWORK_TYPE_NR_NSA
					|| overrideNetworkType == TelephonyDisplayInfo.OVERRIDE_NETWORK_TYPE_NR_NSA_MMWAVE
					|| overrideNetworkType == TelephonyDisplayInfo.OVERRIDE_NETWORK_TYPE_NR_ADVANCED;
			KrollDict kd = new KrollDict();
			kd.put("is5gNsa", is5gNsa);
			kd.put("networkOverrideType", overrideNetworkType);
			kd.put("networkType", is5gNsa ? NETWORK_TYPE_5G_NSA : NETWORK_TYPE_4G);
			clbSuccess.call(getKrollObject(), kd);
		}
	}
}
