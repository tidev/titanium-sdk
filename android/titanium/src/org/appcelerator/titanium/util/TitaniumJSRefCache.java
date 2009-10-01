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
/*
 * Javascript Reference Object Cache
 *
 * Since there is no access to the native references in Javascript, such that
 * garbage collection could be tracked, this object is an attempt to work around
 * the problem.
 *
 * When creating an object to be used by Javascript wrap it in a TitaniumJSRef.
 * If the object is created on the native side, then the flow is as follows.
 *
 * 1) Object o = new Object();
 * 2) TitaniumJSRef ref = new TitaniumJSRef(o);
 * 3) cache.add(ref);
 * 4) evalJS(callback, "{ key : " + ref.getKey() + " }");
 *
 * on the JS side, basically use the key to get the native reference.
 * function(e) {
 *     return Titanium.API.getReference(e.key);
 * };
 *
 * When done with the JS object delete it and hopefully, normal Java GCing will
 * Remove the underlying object. The cache can later be "GC'd" by a background
 * thread if necessary.
 *
 */

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
