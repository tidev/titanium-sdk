/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.network;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.TimeZone;

import org.apache.http.cookie.Cookie;
import org.apache.http.impl.cookie.BasicClientCookie;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;

@Kroll.proxy(creatableInModule=NetworkModule.class, propertyAccessors={
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
	public static final SimpleDateFormat systemExpiryDateFormatter = new SimpleDateFormat("EEE, dd-MMM-yyyy HH:mm:ss 'GMT'");
	static {
		httpExpiryDateFormatter.setTimeZone(timezone);
		systemExpiryDateFormatter.setTimeZone(timezone);
	}

	private BasicClientCookie basicClientCookie;

	public CookieProxy()
	{
		super();
	}

	public CookieProxy(Cookie cookie)
	{
		super();
		if (cookie instanceof BasicClientCookie) {
			basicClientCookie = (BasicClientCookie) cookie;
			setProperty(TiC.PROPERTY_NAME, basicClientCookie.getName());
			setProperty(TiC.PROPERTY_VALUE, basicClientCookie.getValue());
			setProperty(TiC.PROPERTY_DOMAIN, basicClientCookie.getDomain());
			Date expiryDate = basicClientCookie.getExpiryDate();
			if (expiryDate != null) {
				setProperty(TiC.PROPERTY_EXPIRY_DATE, httpExpiryDateFormatter.format(expiryDate));
			}
			setProperty(TiC.PROPERTY_COMMENT, basicClientCookie.getComment());
			setProperty(TiC.PROPERTY_PATH, basicClientCookie.getPath());
			setProperty(TiC.PROPERTY_SECURE, basicClientCookie.isSecure());
			setProperty(TiC.PROPERTY_VERSION, basicClientCookie.getVersion());
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
			this.basicClientCookie = new BasicClientCookie(name, value);
		} else {
			Log.w(TAG, "Unable to create the http client cookie. Need to provide a valid name.");
			return;
		}

		if (dict.containsKey(TiC.PROPERTY_DOMAIN)) {
			basicClientCookie.setDomain(TiConvert.toString(getProperty(TiC.PROPERTY_DOMAIN)));
		}
		if (dict.containsKey(TiC.PROPERTY_EXPIRY_DATE)) {
			try {
				basicClientCookie.setExpiryDate(httpExpiryDateFormatter.parse(TiConvert
					.toString(getProperty(TiC.PROPERTY_EXPIRY_DATE))));
			} catch (Exception e) {
				Log.e(TAG, "Unable to set expiry date to the cookie.", e);
			}
		}
		if (dict.containsKey(TiC.PROPERTY_COMMENT)) {
			basicClientCookie.setComment(TiConvert.toString(getProperty(TiC.PROPERTY_COMMENT)));
		}
		if (dict.containsKey(TiC.PROPERTY_PATH)) {
			basicClientCookie.setPath(TiConvert.toString(getProperty(TiC.PROPERTY_PATH)));
		}
		if (dict.containsKey(TiC.PROPERTY_SECURE)) {
			basicClientCookie.setSecure(TiConvert.toBoolean(getProperty(TiC.PROPERTY_SECURE)));
		}
		if (dict.containsKey(TiC.PROPERTY_VERSION)) {
			basicClientCookie.setVersion(TiConvert.toInt(getProperty(TiC.PROPERTY_VERSION)));
		}
	}

	@Override
	public void onPropertyChanged(String name, Object value)
	{
		if (basicClientCookie == null) {
			return;
		}

		super.onPropertyChanged(name, value);

		if (TiC.PROPERTY_VALUE.equals(name)) {
			basicClientCookie.setValue(TiConvert.toString(value));
		} else if (TiC.PROPERTY_DOMAIN.equals(name)) {
			basicClientCookie.setDomain(TiConvert.toString(value));
		} else if (TiC.PROPERTY_EXPIRY_DATE.equals(name)) {
			try {
				basicClientCookie.setExpiryDate(httpExpiryDateFormatter.parse(TiConvert.toString(value)));
			} catch (Exception e) {
				Log.e(TAG, "Unable to set expiry date to the cookie.", e);
			}
		} else if (TiC.PROPERTY_COMMENT.equals(name)) {
			basicClientCookie.setComment(TiConvert.toString(value));
		} else if (TiC.PROPERTY_PATH.equals(name)) {
			basicClientCookie.setPath(TiConvert.toString(value));
		} else if (TiC.PROPERTY_SECURE.equals(name)) {
			basicClientCookie.setSecure(TiConvert.toBoolean(value));
		} else if (TiC.PROPERTY_VERSION.equals(name)) {
			basicClientCookie.setVersion(TiConvert.toInt(value));
		}
	}

	public BasicClientCookie getHTTPCookie()
	{
		return basicClientCookie;
	}

	@Kroll.getProperty @Kroll.method
	public String getName()
	{
		return TiConvert.toString(getProperty(TiC.PROPERTY_NAME));
	}

	@Override
	public String getApiName()
	{
		return "Ti.Network.Cookie";
	}
}