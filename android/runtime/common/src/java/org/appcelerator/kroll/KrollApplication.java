/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
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
public interface KrollApplication
{
	public int getThreadStackSize();

	public Activity getCurrentActivity();

	public void waitForCurrentActivity(CurrentActivityListener l);

	public TiTempFileHelper getTempFileHelper();

	public TiDeployData getDeployData();

	public boolean isFastDevMode();

	public String getAppGUID();

	public boolean isDebuggerEnabled();

	public void dispose();
	
	public String getDeployType();

	public String getDefaultUnit();

	public void cancelTimers(Thread thread);
}
