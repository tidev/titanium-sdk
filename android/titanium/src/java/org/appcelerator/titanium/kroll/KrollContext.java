/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.kroll;

import org.appcelerator.kroll.common.AsyncResult;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiMessenger;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;

import android.os.Handler;
import android.os.Message;
import android.os.Messenger;
import android.os.RemoteException;

/**
 * This class is deprecated, please see {@link org.appcelerator.kroll.KrollRuntime} instead
 * @deprecated
 */
public class KrollContext implements Handler.Callback
{
	private static final String TAG = "KrollContext";

	private static final int MSG_EVAL_STRING = 1000;
	private static final int MSG_EVAL_FILE = 1001;

	public static final String CONTEXT_KEY = "krollContext";

	private static KrollContext _instance;

	private Handler handler;


	public static KrollContext getKrollContext()
	{
		if (_instance == null) {
			_instance = new KrollContext();
		}
		return _instance;
	}

	protected KrollContext()
	{
		initContext();
	}

	protected void initContext()
	{
		Log.d(TAG, "Context Thread: " + Thread.currentThread().getName(), Log.DEBUG_MODE);

		handler = new Handler(this);
	}

	protected void threadEnded()
	{
	}

	public boolean handleMessage(Message msg)
	{
		switch (msg.what)
		{
			case MSG_EVAL_STRING : {
			}
			case MSG_EVAL_FILE : {
				AsyncResult result = (AsyncResult) msg.obj;
				String filename = msg.getData().getString(TiC.MSG_PROPERTY_FILENAME);
				result.setResult(handleEvalFile(filename));
				return true;
			}
		}
		return false;
	}

	public void post(Runnable r)
	{
		TiMessenger.getMainMessenger().getHandler().post(r);
	}

	protected boolean isOurThread()
	{
		return TiApplication.isUIThread();
	}

	public Object evalFile(String filename)
	{
		return evalFile(filename, null, -1);
	}

	public Object evalFile(String filename, Messenger messenger, int messageId)
	{
		Object result = null;

		if (filename.startsWith(TiC.URL_APP_PREFIX)) {
			filename = filename.replaceAll("app:/", "Resources");
		} else if (filename.startsWith(TiC.URL_ANDROID_ASSET_RESOURCES)) {
			filename = filename.replaceAll("file:///android_asset/", "");
		}

		Log.d(TAG, "evalFile: " + filename, Log.DEBUG_MODE);

		if (isOurThread()) {
			return handleEvalFile(filename);
		}

		Message message = handler.obtainMessage(MSG_EVAL_FILE);
		message.getData().putString(TiC.MSG_PROPERTY_FILENAME, filename);

		TiMessenger.sendBlockingRuntimeMessage(message);

		if (messenger != null) {
			try {
				Message responseMsg = Message.obtain();
				responseMsg.what = messageId;
				messenger.send(responseMsg);
				Log.d(TAG, "Notifying caller that evalFile has completed", Log.DEBUG_MODE);
			} catch(RemoteException e) {
				Log.w(TAG, "Failed to notify caller that eval completed");
			}
		}

		return result;
	}

	public Object handleEvalFile(String filename)
	{
		return null;
	}

	public void release()
	{
	}
}
