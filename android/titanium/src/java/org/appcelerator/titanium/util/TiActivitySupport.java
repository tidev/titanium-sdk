/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import android.content.Intent;

/**
 * This interface is designed to launch an activity for which you would like a result when it finishes.
 * For example, you may want to start an activity that lets the user pick a person from his contacts. When
 * it ends, it returns the number that was selected. You can launch the activity by calling {@link #launchActivityForResult(Intent, int, TiActivityResultHandler)}.
 * The result will come back through {@link TiActivityResultHandler#onResult(android.app.Activity, int, int, Intent)} method.
 */
public interface TiActivitySupport
{
	/**
	 * Launches an activity for which you would like a result when it finishes. When this activity exits,
	 * {@link TiActivityResultHandler#onResult(android.app.Activity, int, int, Intent)} method will be invoked.
	 * @param intent the passed in intent.
	 * @param code  the request code, a code that represents the launched activity. This code will be returned in
	 * {@link TiActivityResultHandler#onResult(android.app.Activity, int, int, Intent)} when the activity exits. 
	 * @param handler the callback handler.
	 * @module.api
	 */
	public void launchActivityForResult(Intent intent, int code, TiActivityResultHandler handler);
	
	/**
	 * @return a code that represents the launched activity. This must be unique to differentiate launched activities that 
	 * use the same callback handler.
	 * @module.api
	 */
	public int getUniqueResultCode();
}
