/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import android.os.Bundle;

/**
 * Implementations of this interface can be notified when their activity window has been created
 * by registering themselves with {@link TiActivityWindows#addWindow(TiActivityWindow)}.
 *
 * To retrieve the callback, fill the Activity's Intent with the following two properties:
 * <code>
 * int uniqueWindowId = TiActivityWindows.addWindow(this);
 * intent.putExtra(TiC.INTENT_PROPERTY_WINDOW_ID, uniqueWindowId);
 * </code>
 */
public interface TiActivityWindow {
	void windowCreated(TiBaseActivity activity, Bundle savedInstanceState);
}
