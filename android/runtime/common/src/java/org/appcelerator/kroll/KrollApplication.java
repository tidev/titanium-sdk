/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import org.appcelerator.kroll.common.CurrentActivityListener;
import org.appcelerator.kroll.common.TiDeployData;
import org.appcelerator.kroll.util.TiTempFileHelper;

import android.app.Activity;

/**
 * An interface for things Kroll needs from the application instance
 */
public interface KrollApplication {
	boolean DEFAULT_RUN_ON_MAIN_THREAD = false;

	int getThreadStackSize();

	Activity getCurrentActivity();

	void waitForCurrentActivity(CurrentActivityListener l);

	TiTempFileHelper getTempFileHelper();

	TiDeployData getDeployData();

	boolean isFastDevMode();

	String getAppGUID();

	boolean isDebuggerEnabled();

	boolean runOnMainThread();

	void dispose();

	String getDeployType();

	String getDefaultUnit();

	String getSDKVersion();

	void cancelTimers();

	void loadAppProperties();
}
