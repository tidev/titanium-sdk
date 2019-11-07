/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.v8;

import java.lang.ref.WeakReference;

import org.appcelerator.kroll.KrollRuntime;

/**
 * Detect JVM garbage collections to initiate V8 garbage collections.
 *
 * We do this because the V8 objects do not represent the memory footprint
 * of the Java objects, this means V8 does not garbage collect as often as is
 * necessary and prevents JVM from collecting objects as they are still referenced.
 * This GCWatcher will coincide JVM collections with V8 collections.
 */
public final class GCWatcher
{

	private static WeakReference watcher = new WeakReference(new GCWatcher());

	@Override
	protected void finalize() throws Throwable
	{

		// suggest V8 GC
		KrollRuntime.suggestGC();

		// re-new weak reference
		if (watcher != null && watcher.get() == null) {
			watcher = new WeakReference(new GCWatcher());
		}

		super.finalize();
	}
}
