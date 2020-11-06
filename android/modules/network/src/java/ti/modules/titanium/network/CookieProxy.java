/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.network;

import java.net.HttpCookie;
import java.text.SimpleDateFormat;
import java.util.TimeZone;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;

@Kroll.proxy(creatableInModule = NetworkModule.class,
	propertyAccessors = {
		TiC.PROPERTY_VALUE,
		TiC.PROPERTY_DOMAIN,
		TiC.PROPERTY_EXPIRY_DATE,
		TiC.PROPERTY_COMMENT,
		TiC.PROPERTY_PATH,
		TiC.PROPERTY_SECURE,
		TiC.PROPERTY_HTTP_ONLY,
		TiC.PROPERTY_VERSION
})
public class CookieProxy extends KrollProxy
{
	private static final String TAG = "CookieProxy";
	private static TimeZone timezone = TimeZone.getTimeZone("GMT");
	private static final SimpleDateFormat httpExpiryDateFormatter = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZ");
	public static final SimpleDateFormat systemExpiryDateFormatter =
		new SimpleDateFormat("EEE, dd-MMM-yyyy HH:mm:ss 'GMT'");
	static
	{
		httpExpiryDateFormatter.setTimeZone(timezone);
		systemExpiryDateFormatter.setTimeZone(timezone);
	}

	private HttpCookie httpCookie;

	public CookieProxy()
	{
		super();
	}

	public CookieProxy(HttpCookie cookie)
	{
		super();
		if (cookie instanceof HttpCookie) {
			httpCookie = (HttpCookie) cookie;
			setProperty(TiC.PROPERTY_NAME, httpCookie.getName());
			setProperty(TiC.PROPERTY_VALUE, httpCookie.getValue());
			setProperty(TiC.PROPERTY_DOMAIN, httpCookie.getDomain());
			// PROPERTY_EXPIRY_DATE not used instead, PROPERTY_MAX_AGE is used
			// See http://developer.android.com/reference/java/net/HttpCookie.html for more info
			setProperty(TiC.PROPERTY_MAX_AGE, httpCookie.getMaxAge());
			setProperty(TiC.PROPERTY_COMMENT, httpCookie.getComment());
			setProperty(TiC.PROPERTY_PATH, httpCookie.getPath());
			setProperty(TiC.PROPERTY_SECURE, httpCookie.getSecure());
			setProperty(TiC.PROPERTY_VERSION, httpCookie.getVersion());
		} else {
			Log.e(TAG, "Unable to create CookieProxy. Invalid cookie type.");
		}
	}

	public CookieProxy(String name, String value, String domain, String path)
	{
		KrollDict dict = new KrollDict();
		dict.put(TiC.PROPERTY_NAME, name);
		dict.put(TiC.PROPERTY_VALUE, value);
		setProperty(TiC.PROPERTY_NAME, name);
		setProperty(TiC.PROPERTY_VALUE, value);
		if (domain != null) {
			dict.put(TiC.PROPERTY_DOMAIN, domain);
			setProperty(TiC.PROPERTY_DOMAIN, domain);
		}
		if (path != null) {
			dict.put(TiC.PROPERTY_PATH, path);
			setProperty(TiC.PROPERTY_PATH, path);
		}
		handleCreationDict(dict);
	}

	@Override
	public void handleCreationDict(KrollDict dict)
	{
		super.handleCreationDict(dict);

		String name = TiConvert.toString(getProperty(TiC.PROPERTY_NAME));
		String value = TiConvert.toString(getProperty(TiC.PROPERTY_VALUE));
		if (name != null) {
			this.httpCookie = new HttpCookie(name, value);
		} else {
			Log.w(TAG, "Unable to create the http client cookie. Need to provide a valid name.");
			return;
		}

		if (dict.containsKey(TiC.PROPERTY_DOMAIN)) {
			httpCookie.setDomain(TiConvert.toString(getProperty(TiC.PROPERTY_DOMAIN)));
		}
		if (dict.containsKey(TiC.PROPERTY_MAX_AGE)) {
			// PROPERTY_EXPIRY_DATE not used instead, PROPERTY_MAX_AGE is used
			// See http://developer.android.com/reference/java/net/HttpCookie.html for more info
			httpCookie.setMaxAge(TiConvert.toInt(getProperty(TiC.PROPERTY_MAX_AGE)));
		}
		if (dict.containsKey(TiC.PROPERTY_COMMENT)) {
			httpCookie.setComment(TiConvert.toString(getProperty(TiC.PROPERTY_COMMENT)));
		}
		if (dict.containsKey(TiC.PROPERTY_PATH)) {
			httpCookie.setPath(TiConvert.toString(getProperty(TiC.PROPERTY_PATH)));
		}
		if (dict.containsKey(TiC.PROPERTY_SECURE)) {
			httpCookie.setSecure(TiConvert.toBoolean(getProperty(TiC.PROPERTY_SECURE)));
		}
		if (dict.containsKey(TiC.PROPERTY_VERSION)) {
			httpCookie.setVersion(TiConvert.toInt(getProperty(TiC.PROPERTY_VERSION)));
		}
	}

	@Override
	public void onPropertyChanged(String name, Object value)
	{
		if (httpCookie == null) {
			return;
		}

		super.onPropertyChanged(name, value);

		if (TiC.PROPERTY_VALUE.equals(name)) {
			httpCookie.setValue(TiConvert.toString(value));
		} else if (TiC.PROPERTY_DOMAIN.equals(name)) {
			httpCookie.setDomain(TiConvert.toString(value));
		} else if (TiC.PROPERTY_MAX_AGE.equals(name)) {
			// PROPERTY_EXPIRY_DATE not used instead, PROPERTY_MAX_AGE is used
			// See http://developer.android.com/reference/java/net/HttpCookie.html for more info
			httpCookie.setMaxAge(TiConvert.toInt(value));
		} else if (TiC.PROPERTY_COMMENT.equals(name)) {
			httpCookie.setComment(TiConvert.toString(value));
		} else if (TiC.PROPERTY_PATH.equals(name)) {
			httpCookie.setPath(TiConvert.toString(value));
		} else if (TiC.PROPERTY_SECURE.equals(name)) {
			httpCookie.setSecure(TiConvert.toBoolean(value));
		} else if (TiC.PROPERTY_VERSION.equals(name)) {
			httpCookie.setVersion(TiConvert.toInt(value));
		}
	}

	public HttpCookie getHTTPCookie()
	{
		return httpCookie;
	}

	@Kroll.method
	@Kroll.getProperty
	public String getName()
	{
		return TiConvert.toString(getProperty(TiC.PROPERTY_NAME));
	}

	@Kroll.method
	public boolean isValid()
	{
		String name = TiConvert.toString(getProperty(TiC.PROPERTY_NAME));
		String value = TiConvert.toString(getProperty(TiC.PROPERTY_VALUE));
		String path = TiConvert.toString(getProperty(TiC.PROPERTY_PATH));
		String domain = TiConvert.toString(getProperty(TiC.PROPERTY_DOMAIN));
		return (name != null && value != null && path != null && domain != null);
	}

	@Override
	public String getApiName()
	{
		return "Ti.Network.Cookie";
	}
}
