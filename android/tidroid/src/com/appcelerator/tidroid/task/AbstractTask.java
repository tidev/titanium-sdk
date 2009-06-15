// Copyright(c) 2009 by Appcelerator, Inc. All Rights Reserved.
// This is proprietary software. Do not redistribute without express
// written permission.

package com.appcelerator.tidroid.task;

import android.util.Log;

import com.appcelerator.tidroid.IProgressManager;

public abstract class AbstractTask implements Runnable, IProgressManager
{
	private static final String LCAT = "TiTask";

	protected IProgressManager progressProxy;

	protected AbstractTask(IProgressManager progressProxy) {
		this.progressProxy = progressProxy;
	}

	protected abstract void doTask();

	public void run()
	{
		setProgressOn(true);
		try {
			doTask();
		} catch (Exception e) {
			Log.e(LCAT, "Exception while executing task. ", e);
		} catch (Throwable t) {
			Log.e(LCAT, "Throwable while executing task. ", t);
		} finally {
			setProgressOn(false);
		}
	}

	public void setProgressOn(boolean progressOn) {
		Log.d("TEST","PROGRESS: " + progressOn);
		if (progressProxy != null) {
			progressProxy.setProgressOn(progressOn);
		} else {
			Log.d("TEST", "NO PROXY");
		}
	}
}
