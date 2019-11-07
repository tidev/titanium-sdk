/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.Menu;

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
	public static final int LIFECYCLE_ON_CREATE = 5;
	public static final int ON_SAVE_INSTANCE_STATE = 6;
	public static final int ON_RESTORE_INSTANCE_STATE = 7;

	/**
	 * An interface for receiving Android lifecycle events. 
	 */
	public interface OnLifecycleEvent {

		/**
		 * Implementing classes should use this to receive native Android onStart lifecycle events.
		 * @param activity the attached activity.
		 */
		public void onCreate(Activity activity, Bundle savedInstanceState);

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

	public interface OnInstanceStateEvent {

		/**
		 * Implementing classes should use this to receive native Android onSaveInstanceState events.
		 * @param activity the attached activity.
		 */
		public void onSaveInstanceState(Bundle bundle);

		/**
		 * Implementing classes should use this to receive native Android onRestoreInstanceState events.
		 * @param activity the attached activity.
		 */
		public void onRestoreInstanceState(Bundle bundle);
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

	/**
	 * An interface to handle onActivityResult events.
	 */
	public interface OnActivityResultEvent {
		/**
		 * Implementing classes should use this to receive native Android onActivityResult events.
		 */
		public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data);
	}

	/**
     * An interface to handle onCreateOptionsMenu events.
     */
	public interface OnCreateOptionsMenuEvent {
		/**
		 * Implementing classes should use this to receive native Android onCreateOptionsMenu events.
		 */
		public void onCreateOptionsMenu(Activity activity, Menu menu);
	}

	/**
	 * An interface to handle onPrepareOptionsMenu events.
	 */
	public interface OnPrepareOptionsMenuEvent {
		/**
		 * Implementing classes should use this to receive native Android onPrepareOptionsMenu events.
		 */
		public void onPrepareOptionsMenu(Activity activity, Menu menu);
	}

	/**
	 * An interface to intercept OnBackPressed events.
	 */
	public interface interceptOnBackPressedEvent {
		/**
		 * Implementing classes should use this to intercept native Android onBackPressed events.
		 */
		public boolean interceptOnBackPressed();
	}

	public static void fireOnCreateOptionsMenuEvent(Activity activity, OnCreateOptionsMenuEvent listener, Menu menu)
	{
		listener.onCreateOptionsMenu(activity, menu);
	}

	public static void fireOnPrepareOptionsMenuEvent(Activity activity, OnPrepareOptionsMenuEvent listener, Menu menu)
	{
		listener.onPrepareOptionsMenu(activity, menu);
	}

	public static void fireLifecycleEvent(Activity activity, OnLifecycleEvent listener, int which)
	{
		switch (which) {
			case LIFECYCLE_ON_START:
				listener.onStart(activity);
				break;
			case LIFECYCLE_ON_RESUME:
				listener.onResume(activity);
				break;
			case LIFECYCLE_ON_PAUSE:
				listener.onPause(activity);
				break;
			case LIFECYCLE_ON_STOP:
				listener.onStop(activity);
				break;
			case LIFECYCLE_ON_DESTROY:
				listener.onDestroy(activity);
				break;
		}
	}

	public static void fireLifecycleEvent(Activity activity, OnLifecycleEvent listener, Bundle bundle, int which)
	{
		switch (which) {
			case LIFECYCLE_ON_CREATE:
				listener.onCreate(activity, bundle);
				break;
		}
	}

	public static void fireOnActivityResultEvent(Activity activity, OnActivityResultEvent listener, int requestCode,
												 int resultCode, Intent data)
	{
		listener.onActivityResult(activity, requestCode, resultCode, data);
	}

	public static void fireInstanceStateEvent(Bundle bundle, OnInstanceStateEvent listener, int which)
	{
		switch (which) {
			case ON_SAVE_INSTANCE_STATE:
				listener.onSaveInstanceState(bundle);
				break;
			case ON_RESTORE_INSTANCE_STATE:
				listener.onRestoreInstanceState(bundle);
				break;
		}
	}
}
