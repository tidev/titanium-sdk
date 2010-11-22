/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

@SuppressWarnings({"serial"})
public class TiWeakList<T> extends ArrayList<WeakReference<T>> {
	
	@Override
	public boolean contains(Object o) {
		if (o instanceof WeakReference) return super.contains(o);
		for (WeakReference<T> ref : this) {
			if (ref.get() == o) {
				return true;
			}
		}
		return false;
	}
	
	@Override
	public boolean remove(Object o) {
		if (o instanceof WeakReference) return super.remove(o);
		Iterator<WeakReference<T>> iter = iterator();
		while (iter.hasNext()) {
			WeakReference<T> ref = iter.next();
			if (ref.get() == o) {
				iter.remove();
				return true;
			}
		}
		return false;
	}
	
	public List<T> getNonNull() {
		ArrayList<T> nonNull= new ArrayList<T>();
		for (WeakReference<T> ref : this) {
			if (ref.get() != null) {
				nonNull.add(ref.get());
			}
		}
		return nonNull;
	}
}
