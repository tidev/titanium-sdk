/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.titanium.util.AsyncResult;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;

import android.os.Handler;
import android.os.Looper;
import android.os.Message;

/**
 * A message queue interface similar to {@link android.os.MessageQueue}, and
 * {@link android.os.Looper} but with better primitives for blocking and single
 * loop iteration. This class is meant to be used as a replacement and wrapper
 * around {@link android.os.Handler}
 * 
 * TiMessageQueues have one instance per thread tied by a ThreadLocal. The main
 * thread's TiMessageQueue can be retrieved by calling {@link
 * #getMainMessageQueue()}, or a TiMessageQueue can be lazily created/queried for
 * the current Thread by calling {@link #getMessageQueue()}.
 * 
 * To simply send a message, see {@link #sendMessage(Message)} and {@link
 * #post(Runnable)}.
 * 
 * In situations where the current thread needs to be blocked while waiting on
 * another thread to process a message, see {@link
 * #sendBlockingMessage(Message, TiMessageQueue, AsyncResult)}.
 * 
 * If the thread blocking is simply a busy loop, a simple 1-count CountDownLatch
 * is stored internally that can be used in multiple places by calling {@link
 * #startBlocking()} and {@link #stopBlocking()}.
 * 
 * To process and dispatch a single message from the message queue, see {@link
 * #dispatchMessage()}.
 */
public class TiMessageQueue implements Handler.Callback
{
	private static final String TAG = "TiMessageQueue";
	private static final boolean DBG = TiConfig.LOGD;
	private static final int MSG_RUN = 3000;

	public static final int DEFAULT_TIMEOUT = 50;

	protected static ThreadLocal<TiMessageQueue> threadLocalQueue = new ThreadLocal<TiMessageQueue>() {
		protected TiMessageQueue initialValue() {
			TiMessageQueue queue = new TiMessageQueue();
			if (Thread.currentThread().getId() == Looper.getMainLooper().getThread().getId()) {
				mainQueue = queue;
			}
			return queue;
		}
	};
	protected static TiMessageQueue mainQueue;

	protected ArrayBlockingQueue<Message> messageQueue = new ArrayBlockingQueue<Message>(10);
	protected CountDownLatch blockingLatch;
	protected AtomicInteger blockCount = new AtomicInteger(0);
	protected Handler handler = new Handler(this);
	protected Handler.Callback callback;

	protected TiMessageQueue() { }

	/**
	 * @return the TiMessageQueue tied to the current thread (it is created if necessary)
	 */
	public static TiMessageQueue getMessageQueue()
	{
		if (Looper.myLooper() == null) {
			synchronized (threadLocalQueue) {
				if (Looper.myLooper() == null) {
					Looper.prepare();
				}
			}
		}
		return threadLocalQueue.get();
	}

	/**
	 * @return The TiMessageQueue tied to the main thread
	 */
	public static TiMessageQueue getMainMessageQueue()
	{
		return mainQueue;
	}

	/**
	 * Sends this message using one three methods:
	 * <ul>
	 * <li>If the current thread is the same thread as the message Handler's
	 * thread, it is dispatched immediately to the Handler</li>
	 * <li>If this TiMessageQueue is currently blocking, it is pushed into the
	 * internal message queue to be processed by the next call to {@link
	 * #dispatchMessage()}</li>
	 * <li>If this TiMessageQuee is <b>NOT</b> current blocking, it is queued to
	 * it's Handler normally by using msg.sendToTarget()</li>
	 * </ul>
	 * 
	 * @param msg The message to send
	 */
	public void sendMessage(Message msg)
	{
		Handler target = msg.getTarget();
		long currentThreadId = Thread.currentThread().getId();
		long targetThreadId = -1;
		if (target != null) {
			targetThreadId = target.getLooper().getThread().getId();
		}
		if (target != null && currentThreadId == targetThreadId) {
			target.dispatchMessage(msg);
		} else {
			if (isBlocking()) {
				try {
					messageQueue.put(msg);
				} catch (InterruptedException e) {
					Log.w(TAG, "interrupted trying to put new message, sending to handler", e);
					msg.sendToTarget();
				}
			} else {
				msg.sendToTarget();
			}
		}
	}

	/**
	 * Sends a message on the current queue, and dispatches messages on the
	 * current queue while blocking on the passed in AsyncResult
	 * 
	 * @param msg The message to send.
	 * @param result The AsyncResult to block on.
	 * @return The value of result.getResult().
	 */
	public Object sendBlockingMessage(Message msg, AsyncResult result)
	{
		return sendBlockingMessage(msg, getMessageQueue(), result);
	}

	/**
	 * Sends a message on blockQueue, and dispatches messages on the current
	 * queue while blocking on the passed in AsyncResult
	 * 
	 * @param msg The message to send.
	 * @param blockQueue The TiMessageQueue to send it to.
	 * @param asyncResult The AsyncResult to block on.
	 * @return The value of asyncResult.getResult()
	 */
	public Object sendBlockingMessage(Message msg, final TiMessageQueue blockQueue, final AsyncResult asyncResult)
	{
		@SuppressWarnings("serial")
		AsyncResult blockingResult = new AsyncResult(asyncResult.getArg()) {
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
				asyncResult.setResult(result);
			}
		};
		blockCount.incrementAndGet();
		msg.obj = blockingResult;
		blockQueue.sendMessage(msg);

		Object o = blockingResult.getResult();
		blockCount.decrementAndGet();
		dispatchPendingMessages();
		return o;
	}

	/**
	 * Set a delegate Handler.Callback for messages passed internally to this
	 * TiMessageQueue. WARNING: this is a 1-to-1 association and meant to be
	 * used with classes that are tightly coupled with the TiMessageQueue (such
	 * as KrollContext)
	 * 
	 * @param callback a delegate Handler.Callback
	 */
	public void setCallback(Handler.Callback callback)
	{
		this.callback = callback;
	}

	// TODO @Override
	public boolean handleMessage(Message msg)
	{
		if (msg.what == MSG_RUN) {
			((Runnable)msg.obj).run();
			return true;
		}
		if (callback != null) {
			return callback.handleMessage(msg);
		}
		return false;
	}

	/**
	 * Convenience function for posting a Runnable block of code on this message
	 * queue's thread using {@link #sendMessage(Message)}
	 * 
	 * @param runnable A runnable block of code
	 */
	public void post(Runnable runnable)
	{
		sendMessage(handler.obtainMessage(MSG_RUN, runnable));
	}

	/**
	 * Resets the internal blocking latch
	 */
	public void resetLatch()
	{
		blockingLatch = new CountDownLatch(1);
	}

	/**
	 * Start blocking the current thread with a busy loop that blocks on an
	 * internal CountDownLatch.
	 * 
	 * Another thread or entry point will need to call {@link #stopBlocking()}
	 * for this method to return. While looping, the queue will also dispatch
	 * messages.
	 */
	public void startBlocking()
	{
		synchronized (this) {
			if (isBlocking()) return;
			resetLatch();
			blockCount.incrementAndGet();
		}
		int timeout = 0;
		try {
			while (!blockingLatch.await(timeout, TimeUnit.MILLISECONDS)) {
				if (messageQueue.size() == 0) {
					timeout = 50;
				} else {
					dispatchPendingMessages();
				}
			}
		} catch (InterruptedException e) {
			Log.e(TAG, "interrupted while blocking", e);
		}
		dispatchPendingMessages();
		blockCount.decrementAndGet();
	}

	/**
	 * Stop blocking by counting down the internal CountDownLatch
	 */
	public void stopBlocking()
	{
		synchronized (this) {
			if (blockingLatch != null) {
				blockingLatch.countDown();
			}
		}
	}

	/**
	 * @return whether or not this message queue is currently blocking
	 */
	public boolean isBlocking()
	{
		return blockCount.get() > 0;
	}

	/**
	 * Dispatch all pending messages
	 */
	public void dispatchPendingMessages()
	{
		while (true) {
			if (!dispatchMessage()) break;
		}
	}

	/**
	 * Try to process and dispatch a message without polling
	 * 
	 * @return Whether or not a message was processed and dispatched
	 */
	public boolean dispatchMessage()
	{
		Message msg = messageQueue.poll();
		if (msg == null) {
			return false;
		}
		if (msg.getTarget() != null) {
			msg.getTarget().dispatchMessage(msg);
			return true;
		}
		return false;
	}

	/**
	 * Dispatch a message using the passed in poll timeout and TimeUnit.
	 * Warning: The InterruptedException thrown by poll() is swallowed here.
	 * 
	 * @param timeout The polling timeout value
	 * @param unit The unit of the timeout value
	 * @return Whether or not a message was processed and dispatched
	 */
	public boolean dispatchMessage(int timeout, TimeUnit unit)
	{
		try {
			Message msg = messageQueue.poll(timeout, unit);
			if (msg != null) {
				if (DBG) {
					Log.d(TAG, "Dispatching message: " + msg);
				}
				if (msg.getTarget() != null) {
					msg.getTarget().dispatchMessage(msg);
					return true;
				}
				return false;
			}
		} catch (InterruptedException e) {
			// ignore
		}
		return false;
	}

	/**
	 * @return The Handler associated with this message queue and thread
	 */
	public Handler getHandler()
	{
		return handler;
	}
}
