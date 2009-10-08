/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.util;

import java.lang.ref.WeakReference;
import java.util.HashMap;

import org.appcelerator.titanium.config.TitaniumConfig;

public class TitaniumJSRefCache
{
	private static final String LCAT = "TiJSRefCache";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private HashMap<Integer, WeakReference<TitaniumJSRef>> cache;

	private static final int DEFAULT_CAPACITY = 100;

	private static final long serialVersionUID = 1L;

	public TitaniumJSRefCache() {
		this(DEFAULT_CAPACITY);
	}

	public TitaniumJSRefCache(int initialCapacity) {
		this.cache = new HashMap<Integer, WeakReference<TitaniumJSRef>>(initialCapacity);
	}

	public TitaniumJSRef getReference(int key) {
		TitaniumJSRef ref = null;

		synchronized(cache) {
			WeakReference<TitaniumJSRef> wref = cache.get(key);
			if (wref != null) {
				ref = wref.get();
				if (ref == null) {
					cache.remove(key);
					if (DBG) {
						Log.d(LCAT, "Cached reference reclaimed by GC, removing key: " + key);
					}
				}
			}
		}
		return ref;
	}

	public Object getObject(int key) {
		Object obj = null;

		TitaniumJSRef ref = getReference(key);
		if (ref != null) {
			obj = ref.ref;
		}

		return obj;
	}

	public void add(TitaniumJSRef ref) {
		if (ref == null) {
			throw new IllegalArgumentException("Ref must not be null.");
		}

		Integer key = new Integer(ref.key);
		synchronized(cache) {
			if (!cache.containsKey(key)) {
				cache.put(key, new WeakReference<TitaniumJSRef>(ref));
			} else {
				throw new IllegalArgumentException("Attempt to add already cached object to cache, key: " + ref.key);
			}
		}
	}
}
