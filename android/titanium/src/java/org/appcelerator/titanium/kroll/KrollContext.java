/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.kroll;

import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.util.KrollAssetHelper;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiMessageQueue;
import org.appcelerator.titanium.util.AsyncResult;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;

import android.os.Handler;
import android.os.Message;
import android.os.Messenger;
import android.os.RemoteException;

public class KrollContext implements Handler.Callback
{
	private static final String LCAT = "KrollContext";
	private static boolean DBG = TiConfig.DEBUG;

	private static final int MSG_EVAL_STRING = 1000;
	private static final int MSG_EVAL_FILE = 1001;

	public static final String CONTEXT_KEY = "krollContext";

	private static KrollContext _instance;

	private TiMessageQueue messageQueue;


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
		if (DBG) {
			Log.d(LCAT, "Context Thread: " + Thread.currentThread().getName());
		}

		messageQueue = TiMessageQueue.getMessageQueue();
		messageQueue.setCallback(this);
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
		messageQueue.post(r);
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

		if (DBG) {
			Log.i(LCAT, "evalFile: " + filename);
		}

		if (isOurThread()) {
			return handleEvalFile(filename);
		}

		AsyncResult asyncResult = new AsyncResult();
		Message msg = messageQueue.getHandler().obtainMessage(MSG_EVAL_FILE, asyncResult);
		msg.getData().putString(TiC.MSG_PROPERTY_FILENAME, filename);
		TiMessageQueue.getMessageQueue().sendBlockingMessage(msg, messageQueue, asyncResult);

		if (messenger != null) {
			try {
				Message responseMsg = Message.obtain();
				responseMsg.what = messageId;
				messenger.send(responseMsg);
				if (DBG) {
					Log.d(LCAT, "Notifying caller that evalFile has completed");
				}
			} catch(RemoteException e) {
				Log.w(LCAT, "Failed to notify caller that eval completed");
			}
		}

		return result;
	}

	public Object handleEvalFile(String filename)
	{
		KrollRuntime.getInstance().runModule(
			KrollAssetHelper.readAsset(filename), filename);

		return null;
	}

	public TiMessageQueue getMessageQueue()
	{
		return messageQueue;
	}

	public void release()
	{
	}
}
