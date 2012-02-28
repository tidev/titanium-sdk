/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import android.content.Intent;

public interface TiActivitySupport
{
	/**
	 * Launches an activity for which you would like a result when it finished. When this activity exits,
	 * {@link TiActivityResultHandler#onResult(android.app.Activity, int, int, Intent)} method will be invoked.
	 * @param intent the passed in intent.
	 * @param code  the launching code.
	 * @param handler the callback handler.
	 */
	public void launchActivityForResult(Intent intent, int code, TiActivityResultHandler handler);
	
	/**
	 * @return a unique result code.
	 */
	public int getUniqueResultCode();
}
