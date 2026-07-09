/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.view;

import org.appcelerator.titanium.view.TiCompositeLayout.LayoutParams;

import android.view.View;

public interface ITiWindowHandler {
	void addWindow(View v, LayoutParams params);
	void removeWindow(View v);
}
