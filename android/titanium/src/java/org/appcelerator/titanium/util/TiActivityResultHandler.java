/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.util;

import android.app.Activity;
import android.content.Intent;

/**
 * An interface for receiving Activity results from
 * {@link TiActivitySupport#launchActivityForResult(Intent, int, TiActivityResultHandler)}.
 */
public interface TiActivityResultHandler {
	/**
	 * This method is invoked after the launched activity from
	 * {@link TiActivitySupport#launchActivityForResult(Intent, int, TiActivityResultHandler)} exits.
	 * @param activity the launched activity.
	 * @param requestCode the returned request code.
	 * @param resultCode the returned result code.
	 * @param data the intent.
	 * @module.api
	 */
	void onResult(Activity activity, int requestCode, int resultCode, Intent data);

	/**
	 * This method is invoked when an exception occurred launching the activity via
	 * {@link TiActivitySupport#launchActivityForResult(Intent, int, TiActivityResultHandler)}.
	 * @param activity the launched activity.
	 * @param requestCode the returned request code.
	 * @param e the returned exception
	 * @module.api
	 */
	void onError(Activity activity, int requestCode, Exception e);
}
