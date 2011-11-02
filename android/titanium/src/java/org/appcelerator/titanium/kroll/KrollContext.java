/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.kroll;

import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.common.AsyncResult;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiConfig;
import org.appcelerator.kroll.common.TiMessenger;
import org.appcelerator.kroll.util.KrollAssetHelper;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;

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

	//private TiMessenger messageQueue;
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
		if (DBG) {
			Log.d(LCAT, "Context Thread: " + Thread.currentThread().getName());
		}

		// TODO - look at this again to make sure the behavior is correct
		//messageQueue = TiApplication.getInstance().getMessageQueue();
		//messageQueue = TiMessenger.getMessageQueue();
		//messageQueue.setCallback(this);
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

		if (DBG) {
			Log.i(LCAT, "evalFile: " + filename);
		}

		if (isOurThread()) {
			return handleEvalFile(filename);
		}

		//AsyncResult asyncResult = new AsyncResult();
		//Message message = messageQueue.getHandler().obtainMessage(MSG_EVAL_FILE, asyncResult);
		Message message = handler.obtainMessage(MSG_EVAL_FILE);
		message.getData().putString(TiC.MSG_PROPERTY_FILENAME, filename);
		//TiMessenger.getMessageQueue().sendBlockingMessage(msg, messageQueue, asyncResult);
		//messageQueue.sendBlockingMessage(msg, asyncResult);
		TiMessenger.sendBlockingRuntimeMessage(message);

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
		/*KrollRuntime.getInstance().runModule(
			KrollAssetHelper.readAsset(filename), filename);*/

		return null;
	}

	/*public TiMessenger getMessageQueue()
	{
		return TiMessenger.getMessageQueue();
	}*/

	public void release()
	{
	}
}
