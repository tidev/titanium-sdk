/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.common;

import android.app.Activity;

public interface CurrentActivityListener
{
	/**
	 * Implementing classes should use this method after waited for the current activity to be visible.
	 * Refer to {@link TiUIHelper#waitForCurrentActivity(CurrentActivityListener)} for an example use case.
	 * @param activity the associated activity.
	 */
	public void onCurrentActivityReady(Activity activity);
}
