/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.util;

import org.appcelerator.kroll.KrollRuntime;

import java.lang.ref.WeakReference;

/**
 * Detect JVM garbage collections to initiate garbage collections of the JS engine.
 *
 * We do this because the JS objects do not represent the memory footprint
 * of the Java objects, this means the JS engine does not garbage collect as often as is
 * necessary and prevents JVM from collecting objects as they are still referenced.
 * This GCWatcher will coincide JVM collections with JS engine collections.
 */
public final class GCWatcher
{

	private static WeakReference watcher = new WeakReference(new GCWatcher());

	@Override
	protected void finalize() throws Throwable
	{

		// suggest a GC of the JS engine
		KrollRuntime.suggestGC();

		// re-new weak reference
		if (watcher != null && watcher.get() == null) {
			watcher = new WeakReference(new GCWatcher());
		}

		super.finalize();
	}
}
