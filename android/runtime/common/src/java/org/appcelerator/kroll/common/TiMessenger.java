/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.common;

import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.KrollRuntime;

import android.os.Handler;
import android.os.Looper;
import android.os.Message;


public class TiMessenger implements Handler.Callback
{
	private static final String TAG = "TiMessenger";
	private static final boolean DBG = TiConfig.LOGD;
	private static final int MSG_RUN = 3000;

	protected static TiMessenger mainMessenger;
	protected static TiMessenger runtimeMessenger;

	protected static ThreadLocal<TiMessenger> threadLocalMessenger = new ThreadLocal<TiMessenger>() {
		protected TiMessenger initialValue()
		{
			TiMessenger messenger = new TiMessenger();

			long currentThreadId = Thread.currentThread().getId();
			if (currentThreadId == Looper.getMainLooper().getThread().getId()) {
				mainMessenger = messenger;

			} else if (currentThreadId == KrollRuntime.getInstance().getThreadId()) {
				runtimeMessenger = messenger;
			}

			return messenger;
		}
	};

	protected ArrayBlockingQueue<Message> messageQueue = new ArrayBlockingQueue<Message>(10);
	protected CountDownLatch blockingLatch;
	protected AtomicInteger blockingMessageCount = new AtomicInteger(0);
	protected Handler.Callback callback;
	protected long creationThreadId = -1;
	protected Looper looper;
	protected Handler handler;

	public static final int DEFAULT_TIMEOUT = 50;


	public static TiMessenger getMessenger()
	{
		if (Looper.myLooper() == null) {
			synchronized (threadLocalMessenger) {
				if (Looper.myLooper() == null) {
					Looper.prepare();
				}
			}
		}

		return threadLocalMessenger.get();
	}

	public static TiMessenger getMainMessenger()
	{
		return mainMessenger;
	}

	public static TiMessenger getRuntimeMessenger()
	{
		return runtimeMessenger;
	}

	public static void postOnMain(Runnable runnable)
	{
		if (mainMessenger != null) {
			mainMessenger.handler.post(runnable);

			return;
		}

		Log.w(TAG, "unable to post runnable on main, main message queue is null");
	}

	public static void postOnRuntime(Runnable runnable)
	{
		if (runtimeMessenger != null) {
			runtimeMessenger.handler.post(runnable);

			return;
		}

		Log.w(TAG, "unable to post runnable on runtime, runtime message queue is null");
	}

	public static Object sendBlockingMainMessage(Message message)
	{
		return threadLocalMessenger.get().sendBlockingMessage(message, mainMessenger, null);
	}

	public static Object sendBlockingMainMessage(Message message, Object asyncArg)
	{
		return threadLocalMessenger.get().sendBlockingMessage(message, mainMessenger, asyncArg);
	}

	public static Object sendBlockingRuntimeMessage(Message message)
	{
		return threadLocalMessenger.get().sendBlockingMessage(message, runtimeMessenger, null);
	}

	public static Object sendBlockingRuntimeMessage(Message message, Object asyncArg)
	{
		return threadLocalMessenger.get().sendBlockingMessage(message, runtimeMessenger, asyncArg);
	}


	private TiMessenger()
	{
		looper = Looper.myLooper();
		handler = new Handler(this);
	}

	public Looper getLooper()
	{
		return looper;
	}

	public Handler getHandler()
	{
		return handler;
	}

	private Object sendBlockingMessage(Message message, TiMessenger targetMessenger, Object asyncArg)
	{
		@SuppressWarnings("serial")
		AsyncResult wrappedAsyncResult = new AsyncResult(asyncArg) {
			@Override
			public Object getResult()
			{
				int timeout = 0;
				try {
					// TODO: create a multi-semaphore condition
					// here so we don't unnecessarily poll
					while (!tryAcquire(timeout, TimeUnit.MILLISECONDS)) {
						if (messageQueue.size() == 0) {
							timeout = 50;

						} else {
							dispatchPendingMessages();
						}
					}

				} catch (InterruptedException e) {
					Log.e(TAG, "interrupted waiting for async result", e);
					dispatchPendingMessages();
				}

				if (exception != null) {
					throw new RuntimeException(exception);
				}

				return result;
			}

			@Override
			public void setResult(Object result)
			{
				super.setResult(result);
			}
		};

		blockingMessageCount.incrementAndGet();
		message.obj = wrappedAsyncResult;
		targetMessenger.sendMessage(message);

		Object messageResult = wrappedAsyncResult.getResult();
		blockingMessageCount.decrementAndGet();
		dispatchPendingMessages();

		return messageResult;
	}

	public void sendMessage(Message message)
	{
		Handler target = message.getTarget();
		long currentThreadId = Thread.currentThread().getId();
		long targetThreadId = -1;

		if (target != null) {
			targetThreadId = target.getLooper().getThread().getId();
		}

		if (target != null && currentThreadId == targetThreadId) {
			target.dispatchMessage(message);

		} else {
			if (isBlocking()) {
				try {
					messageQueue.put(message);

				} catch (InterruptedException e) {
					Log.w(TAG, "interrupted trying to put new message, sending to handler", e);
					message.sendToTarget();
				}

			} else {
				message.sendToTarget();
			}
		}
	}

	public void post(Runnable runnable)
	{
		sendMessage(handler.obtainMessage(MSG_RUN, runnable));
	}

	public void setCallback(Handler.Callback callback)
	{
		this.callback = callback;
	}

	public boolean handleMessage(Message message)
	{
		if (message.what == MSG_RUN) {
			((Runnable)message.obj).run();

			return true;
		}

		if (callback != null) {
			return callback.handleMessage(message);
		}

		return false;
	}

	public void resetLatch()
	{
		blockingLatch = new CountDownLatch(1);
	}

	public boolean isBlocking()
	{
		return blockingMessageCount.get() > 0;
	}

	public void dispatchPendingMessages()
	{
		while (true) {
			if (!dispatchMessage()) {
				break;
			}
		}
	}

	public boolean dispatchMessage()
	{
		Message message = messageQueue.poll();

		if (message == null) {
			return false;
		}

		if (message.getTarget() != null) {
			message.getTarget().dispatchMessage(message);

			return true;
		}

		return false;
	}

	public boolean dispatchMessage(int timeout, TimeUnit timeUnit)
	{
		try {
			Message message = messageQueue.poll(timeout, timeUnit);
			if (message != null) {
				if (DBG) {
					Log.d(TAG, "Dispatching message: " + message);
				}

				if (message.getTarget() != null) {
					message.getTarget().dispatchMessage(message);

					return true;
				}

				return false;
			}

		} catch (InterruptedException e) {
			// ignore
		}
		return false;
	}
}

