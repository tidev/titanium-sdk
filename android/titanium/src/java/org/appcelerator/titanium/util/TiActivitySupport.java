/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import android.content.Intent;
import android.content.IntentSender;
import android.os.Bundle;

/**
 * This interface is designed to launch an activity for which you would like a result when it finishes.
 * For example, you may want to start an activity that lets the user pick a person from his contacts. When
 * it ends, it returns the number that was selected. You can launch the activity by calling {@link #launchActivityForResult(Intent, int, TiActivityResultHandler)}.
 * The result will come back through {@link TiActivityResultHandler#onResult(android.app.Activity, int, int, Intent)} method.
 */
public interface TiActivitySupport {
	/**
	 * Launches an activity for which you would like a result when it finishes. When this activity exits,
	 * {@link TiActivityResultHandler#onResult(android.app.Activity, int, int, Intent)} method will be invoked.
	 * @param intent the passed in intent.
	 * @param code  the request code, a code that represents the launched activity. This code will be returned in
	 * {@link TiActivityResultHandler#onResult(android.app.Activity, int, int, Intent)} when the activity exits.
	 * @param handler the callback handler.
	 * @module.api
	 */
	void launchActivityForResult(Intent intent, int code, TiActivityResultHandler handler);

	/**
	 * Like {@link TiActivitySupport#launchActivityForResult(Intent, int, TiActivityResultHandler)} but
	 * allowing you to use a IntentSender to describe the activity to be started.
	 * @param intent the IntentSender to launch.
	 * @param requestCode if >= 0, this code will be returned in
	 * {@link TiActivityResultHandler#onResult(android.app.Activity, int, int, Intent)} when the activity exits.
	 * @param fillInIntent if non-null, this will be provided as the intent parameter to sendIntent(Context, int, Intent, IntentSender.OnFinished, Handler).
	 * @param flagsMask	Intent flags in the original IntentSender that you would like to change.
	 * @param flagsValues desired values for any bits set in flagsMask.
	 * @param extraFlags always set to 0.
	 * @param options additional options for how the Activity should be started. See Context.startActivity(Intent, Bundle) for more details.
	 * If options have also been supplied by the IntentSender, options given here will override any that conflict with those given by the IntentSender.
	 * @param handler the callback handler.
	 * @module.api
	 */
	void launchIntentSenderForResult(IntentSender intent, int requestCode, Intent fillInIntent, int flagsMask,
									 int flagsValues, int extraFlags, Bundle options,
									 TiActivityResultHandler resultHandler);

	/**
	 * @return a code that represents the launched activity. This must be unique to differentiate launched activities that
	 * use the same callback handler.
	 * @module.api
	 */
	int getUniqueResultCode();
}
