/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.network;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.commons.codec.binary.Hex;
import org.apache.http.client.CookieStore;
import org.apache.http.cookie.Cookie;
import org.apache.http.impl.client.BasicCookieStore;
import org.apache.http.impl.cookie.BasicClientCookie;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;

import android.content.SharedPreferences;

public class TiCookieStore implements CookieStore
{

	private static final String TAG = "TiCookieStore";

	private static final String COOKIE_PREFERENCES = "TiCookiePreferences";
	private static final String COOKIE_PREFIX = "ti_cookie_";
	private CookieStore cookieStore;
	private final SharedPreferences pref;
	private static TiCookieStore _instance;

	public static TiCookieStore getInstance()
	{
		if (_instance == null) {
			_instance = new TiCookieStore();
		}
		return _instance;
	}

	public TiCookieStore()
	{
		cookieStore = new BasicCookieStore();
		pref = TiApplication.getInstance().getSharedPreferences(COOKIE_PREFERENCES, 0);

		synchronized (cookieStore) {
			// read from preferences and update local cookie store
			Map<String, ?> allPrefs = pref.getAll();
			if (!allPrefs.isEmpty()) {
				Set<String> keys = allPrefs.keySet();
				for (String key : keys) {
					if (key.startsWith(COOKIE_PREFIX)) {
						String encodedCookie = (String) allPrefs.get(key);
						if (encodedCookie != null) {
							Cookie cookie = decodeCookie(encodedCookie);
							if (cookie != null) {
								cookieStore.addCookie(cookie);
							}
						}
					}
				}
			}
		}
	}

	@Override
	public void addCookie(Cookie cookie)
	{
		String encodedCookie = encodeCookie(cookie);
		SharedPreferences.Editor prefWriter = pref.edit();

		synchronized (cookieStore) {
			if (encodedCookie == null) {
				return;
			}

			cookieStore.addCookie(cookie);
			prefWriter.putString(COOKIE_PREFIX + cookie.getName(), encodedCookie);
			prefWriter.commit();
		}
	}

	@Override
	public void clear()
	{
		SharedPreferences.Editor prefWriter = pref.edit();

		synchronized (cookieStore) {
			for (String name : getCookieNames()) {
				prefWriter.remove(COOKIE_PREFIX + name);
			}
			prefWriter.commit();
			cookieStore.clear();
		}
	}

	@Override
	public boolean clearExpired(Date date)
	{
		synchronized (cookieStore) {
			List<Cookie> cookies = cookieStore.getCookies();
			boolean clearedExpired = cookieStore.clearExpired(date);

			if (clearedExpired) {
				SharedPreferences.Editor prefWriter = pref.edit();

				for (Cookie cookie : cookies) {
					if (cookie.isExpired(date)) {
						prefWriter.remove(COOKIE_PREFIX + cookie.getName());
					}
				}
				prefWriter.commit();
			}

			return clearedExpired;
		}
	}

	@Override
	public List<Cookie> getCookies()
	{
		synchronized (cookieStore) {
			return cookieStore.getCookies();
		}
	}

	private List<String> getCookieNames()
	{
		List<Cookie> cookies = cookieStore.getCookies();
		List<String> cookieNames = new ArrayList<String>();

		for (Cookie cookie : cookies) {
			cookieNames.add(cookie.getName());
		}
		return cookieNames;
	}

	private Cookie decodeCookie(String cookieString)
	{

		byte[] cookieBytes = hexStringToByteArray(cookieString);
		ByteArrayInputStream inputStream = new ByteArrayInputStream(cookieBytes);
		BasicClientCookie cookie = null;
		try {
			ObjectInputStream objectInputStream = new ObjectInputStream(inputStream);
			String name = (String) objectInputStream.readObject();
			String value = (String) objectInputStream.readObject();
			cookie = new BasicClientCookie(name, value);
			cookie.setComment((String) objectInputStream.readObject());
			cookie.setDomain((String) objectInputStream.readObject());
			cookie.setVersion(objectInputStream.readInt());
			cookie.setSecure(objectInputStream.readBoolean());
			cookie.setExpiryDate((Date) objectInputStream.readObject());
			cookie.setPath((String) objectInputStream.readObject());

		} catch (Exception e) {
			Log.w(TAG, "Failed to decode cookie", Log.DEBUG_MODE);
			return null;
		}

		return cookie;
	}

	private String encodeCookie(Cookie cookie)
	{

		ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
		try {

			ObjectOutputStream objectOutputStream = new ObjectOutputStream(outputStream);
			objectOutputStream.writeObject(cookie.getName());
			objectOutputStream.writeObject(cookie.getValue());
			objectOutputStream.writeObject(cookie.getComment());
			objectOutputStream.writeObject(cookie.getDomain());
			objectOutputStream.writeInt(cookie.getVersion());
			objectOutputStream.writeBoolean(cookie.isSecure());
			objectOutputStream.writeObject(cookie.getExpiryDate());
			objectOutputStream.writeObject(cookie.getPath());

		} catch (Exception e) {
			Log.w(TAG, "Failed to encode cookie", Log.DEBUG_MODE);
			return null;
		}

		return new String(Hex.encodeHex(outputStream.toByteArray()));
	}

	protected byte[] hexStringToByteArray(String s)
	{
		int len = s.length();
		byte[] data = new byte[len / 2];
		for (int i = 0; i < len; i += 2) {
			data[i / 2] = (byte) ((Character.digit(s.charAt(i), 16) << 4) + Character.digit(s.charAt(i + 1), 16));
		}
		return data;
	}

}