/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.lang.ref.WeakReference;
import java.util.HashMap;

@SuppressWarnings("serial")
public class TiWeakMap<K, V> extends HashMap<WeakReference<K>, V>
{

	@Override
	public boolean containsKey(Object object)
	{
		if (object instanceof WeakReference) {
			return super.containsKey(object);
		}
		for (WeakReference<K> ref : this.keySet()) {
			if (ref.get() == object) {
				return true;
			}
		}
		return false;
	}

	@Override
	public V get(Object key)
	{
		if (key instanceof WeakReference) {
			return super.get(key);
		}
		for (WeakReference<K> ref : this.keySet()) {
			if (ref.get() == key) {
				return super.get(ref);
			}
		}
		return null;
		
	}

	@Override
	public V remove(Object key)
	{
		if (key instanceof WeakReference) {
			return super.remove(key);	
		}
		WeakReference<K> toRemove = null;
		for (WeakReference<K> ref: this.keySet()) {
			if (ref.get() == key) {
				toRemove = ref;
				break;
			}
		}
		if (toRemove != null) {
			return super.remove(toRemove);
		} else {
			return null;
		}
	}

}
