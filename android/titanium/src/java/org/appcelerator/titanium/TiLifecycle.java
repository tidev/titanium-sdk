/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import android.app.Activity;

/**
 *This class contains a single static utility method for firing a lifecycle event to a single listener.
 *It also contains the definition for the listener interface.
 */
public class TiLifecycle
{
	public static final int LIFECYCLE_ON_START = 0;
	public static final int LIFECYCLE_ON_RESUME = 1;
	public static final int LIFECYCLE_ON_PAUSE = 2;
	public static final int LIFECYCLE_ON_STOP = 3;
	public static final int LIFECYCLE_ON_DESTROY = 4;

	/**
	 * An interface for receiving Android lifecycle events. 
	 */
	public interface OnLifecycleEvent {

		/**
		 * Implementing classes should use this to receive native Android onStart lifecycle events.
		 * @param activity the attached activity.
		 */
		public void onStart(Activity activity);

		/**
		 * Implementing classes should use this to receive native Android onResume lifecycle events.
		 * @param activity the attached activity.
		 */
		public void onResume(Activity activity);

		/**
		 * Implementing classes should use this to receive native Android onPause lifecycle events.
		 * @param activity the attached activity.
		 */
		public void onPause(Activity activity);

		/**
		 * Implementing classes should use this to receive native Android onStop lifecycle events.
		 * @param activity the attached activity.
		 */
		public void onStop(Activity activity);

		/**
		 * Implementing classes should use this to receive native Android onDestroy lifecycle events.
		 * @param activity the attached activity.
		 */
		public void onDestroy(Activity activity);
	}

	/**
	 * An interface to handle OnWindowFocusChanged events.
	 */
	public interface OnWindowFocusChangedEvent {
		/**
		 * Implementing classes should use this to receive native Android onWindowFocusChanged events.
		 */
		public void onWindowFocusChanged(boolean hasFocus);
	}

	public static void fireLifecycleEvent(Activity activity, OnLifecycleEvent listener, int which)
	{
		switch (which) {
			case LIFECYCLE_ON_START: listener.onStart(activity); break;
			case LIFECYCLE_ON_RESUME: listener.onResume(activity); break;
			case LIFECYCLE_ON_PAUSE: listener.onPause(activity); break;
			case LIFECYCLE_ON_STOP: listener.onStop(activity); break;
			case LIFECYCLE_ON_DESTROY: listener.onDestroy(activity); break;
		}
	}
}

