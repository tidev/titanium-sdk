/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import android.os.Bundle;
import java.util.HashMap;

/**
 * A registry for TiBaseActivity<->Window creation logic.
 */
public final class TiActivityWindows
{
	public static final int INVALID_WINDOW_ID = -1;

	private static int nextWindowId = 1;
	private static HashMap<Integer, TiActivityWindow> windowMap = new HashMap<>(32);

	private TiActivityWindows()
	{
	}

	public static int addWindow(TiActivityWindow window)
	{
		// Validate argument.
		if (window == null) {
			return INVALID_WINDOW_ID;
		}

		// Do not continue if window has already been added to the collection.
		// Instead, return its already assigned ID.
		for (HashMap.Entry<Integer, TiActivityWindow> nextEntry : windowMap.entrySet()) {
			if ((nextEntry != null) && (nextEntry.getValue() == window)) {
				return nextEntry.getKey().intValue();
			}
		}

		// Generate a unique ID for the given window.
		int windowId = nextWindowId;
		while ((windowId == INVALID_WINDOW_ID) || windowMap.containsKey(Integer.valueOf(windowId))) {
			windowId++;
		}
		nextWindowId = windowId + 1;

		// Add the window to the collection.
		windowMap.put(windowId, window);
		return windowId;
	}

	public static void windowCreated(TiBaseActivity activity, int windowId, Bundle savedInstanceState)
	{
		TiActivityWindow window = windowMap.get(Integer.valueOf(windowId));
		if (window != null) {
			window.windowCreated(activity, savedInstanceState);
		}
	}

	public static void removeWindow(TiActivityWindow window)
	{
		if (window != null) {
			for (HashMap.Entry<Integer, TiActivityWindow> nextEntry : windowMap.entrySet()) {
				if ((nextEntry != null) && (nextEntry.getValue() == window)) {
					windowMap.remove(nextEntry.getKey());
					break;
				}
			}
		}
	}

	public static void removeWindow(int windowId)
	{
		if (windowId != INVALID_WINDOW_ID) {
			windowMap.remove(Integer.valueOf(windowId));
		}
	}

	public static boolean hasWindow(int windowId)
	{
		return (windowMap.get(Integer.valueOf(windowId)) != null);
	}

	public static int getWindowCount()
	{
		return windowMap.size();
	}

	public static void dispose()
	{
		windowMap.clear();
	}
}
