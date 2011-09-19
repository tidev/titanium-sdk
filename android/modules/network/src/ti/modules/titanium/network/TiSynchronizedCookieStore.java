/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.network;

import java.util.Date;
import java.util.List;

import org.apache.http.client.CookieStore;
import org.apache.http.cookie.Cookie;
import org.apache.http.impl.client.BasicCookieStore;

public class TiSynchronizedCookieStore implements CookieStore {
	
	private CookieStore cookieStore;
	
	public TiSynchronizedCookieStore() {
		cookieStore = new BasicCookieStore();
	}
	
	@Override
	public void addCookie(Cookie cookie) {
		synchronized (cookieStore) {
			cookieStore.addCookie(cookie);
		}
	}

	@Override
	public void clear() {
		synchronized (cookieStore) {
			cookieStore.clear();
		}
	}

	@Override
	public boolean clearExpired(Date date) {
		synchronized (cookieStore) {
			return cookieStore.clearExpired(date);
		}
	}

	@Override
	public List<Cookie> getCookies() {
		synchronized (cookieStore) {
			return cookieStore.getCookies();
		}
	}

}
