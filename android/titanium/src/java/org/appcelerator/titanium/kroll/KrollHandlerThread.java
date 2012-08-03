/*
 * Copyright (C) 2006 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * Changes from Appcelerator
 * - Modified to expose the stack size contructor of Thread
 */

package org.appcelerator.titanium.kroll;

import android.os.Looper;
import android.os.Process;

/**
 * Handy class for starting a new thread that has a looper. The looper can then
 * be used to create handler classes. Note that start() must still be called.
 * 
 * Adopted from Android source and modified for integration w/ Rhino
 */
public class KrollHandlerThread extends Thread
{
	private int mPriority;
	private int mTid = -1;
	private Looper mLooper;
	private KrollContext krollContext;

	public KrollHandlerThread(String name, KrollContext krollContext)
	{
		this(name, Process.THREAD_PRIORITY_DEFAULT, krollContext);
	}

	/**
	 * Constructs a HandlerThread.
	 * 
	 * @param name
	 * @param priority
	 *	The priority to run the thread at. The value supplied must be
	 *	from {@link android.os.Process} and not from java.lang.Thread.
	 */
	public KrollHandlerThread(String name, int priority, KrollContext krollContext)
	{
		super(name);
		mPriority = priority;
		this.krollContext = krollContext;
	}

	public KrollHandlerThread(String name, int priority, int stackSize, KrollContext krollContext)
	{
		super(null, null, name, stackSize);
		mPriority = priority;
		this.krollContext = krollContext;
	}

	/**
	 * Call back method that can be explicitly over ridden if needed to execute
	 * some setup before Looper loops.
	 */
	protected void onLooperPrepared() {
		krollContext.initContext();
	}

	public void run() {
		mTid = Process.myTid();
		Looper.prepare();
		synchronized (this) {
			mLooper = Looper.myLooper();
			Process.setThreadPriority(mPriority);
			notifyAll();
		}
		onLooperPrepared();
		Looper.loop();
		krollContext.threadEnded();
		mTid = -1;
	}

	/**
	 * This method returns the Looper associated with this thread. If this
	 * thread not been started or for any reason is isAlive() returns false,
	 * this method will return null. If this thread has been started, this
	 * method will block until the looper has been initialized.
	 * 
	 * @return The looper.
	 */
	public Looper getLooper() {
		if (!isAlive()) {
			return null;
		}

		// If the thread has been started, wait until the looper has been
		// created.
		synchronized (this) {
			while (isAlive() && mLooper == null) {
				try {
					wait();
				} catch (InterruptedException e) {
				}
			}
		}
		return mLooper;
	}

	/**
	 * Ask the currently running looper to quit. If the thread has not been
	 * started or has finished (that is if {@link #getLooper} returns null),
	 * then false is returned. Otherwise the looper is asked to quit and true is
	 * returned.
	 */
	public boolean quit() {
		Looper looper = getLooper();
		if (looper != null) {
			looper.quit();
			return true;
		}
		return false;
	}

	/**
	 * Returns the identifier of this thread. See Process.myTid().
	 */
	public int getThreadId() {
		return mTid;
	}

	public KrollContext getKrollContext() {
		return krollContext;
	}
}
