/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
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
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;

import android.app.Activity;
import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.webkit.CookieManager;
import android.webkit.CookieSyncManager;

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

	private Handler messageHandler = new Handler() {
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

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public boolean getOnline()
	// clang-format on
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
				default:
					type = NetworkModule.NETWORK_UNKNOWN;
			}
		} else {
			type = NetworkModule.NETWORK_NONE;
		}
		return type;
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getNetworkType()
	// clang-format on
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

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getNetworkTypeName()
	// clang-format on
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

	// clang-format off
	@Kroll.method
	@Kroll.topLevel
	public String encodeURIComponent(String component)
	// clang-format on
	{
		return Uri.encode(component);
	}

	// clang-format off
	@Kroll.method
	@Kroll.topLevel
	public String decodeURIComponent(String component)
	// clang-format on
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
		ArrayList<CookieProxy> cookieList = new ArrayList<CookieProxy>();
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
			return cookieList.toArray(new CookieProxy[cookieList.size()]);
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
		ArrayList<CookieProxy> cookieList = new ArrayList<CookieProxy>();
		List<HttpCookie> cookies = getCookieManagerInstance().getCookieStore().getCookies();
		for (HttpCookie cookie : cookies) {
			String cookieDomain = cookie.getDomain();
			if (domainMatch(cookieDomain, domain)) {
				cookieList.add(new CookieProxy(cookie));
			}
		}
		if (!cookieList.isEmpty()) {
			return cookieList.toArray(new CookieProxy[cookieList.size()]);
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
		List<HttpCookie> cookies = new ArrayList<HttpCookie>(getCookieManagerInstance().getCookieStore().getCookies());
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
		List<HttpCookie> cookies = new ArrayList<HttpCookie>(getCookieManagerInstance().getCookieStore().getCookies());
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
	 * Adds a cookie to the system cookie store. Any existing cookie with the same domain, path and name will be replaced with
	 * the new cookie. The cookie being set must not have expired, otherwise it will be ignored.
	 * @param cookieProxy the cookie to add
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

		ArrayList<CookieProxy> cookieList = new ArrayList<CookieProxy>();
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
			return cookieList.toArray(new CookieProxy[cookieList.size()]);
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
			if ((isCaseSensitive && s1.equals(s2)) || (!isCaseSensitive && s1.toLowerCase().equals(s2.toLowerCase()))) {
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
}
