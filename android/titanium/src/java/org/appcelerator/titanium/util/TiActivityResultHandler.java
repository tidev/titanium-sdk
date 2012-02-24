/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.util;

import android.app.Activity;
import android.content.Intent;

public interface TiActivityResultHandler
{
	/**
	 * This is invoked after the launched activity exits via launchActivityForResult
	 * @param activity the launched Activity
	 * @param requestCode 
	 * @param resultCode
	 * @param data the intent
	 */
	public void onResult(Activity activity, int requestCode, int resultCode, Intent data);
	
	/**
	 * This is invoked when there's an exception launching the activity via launchActivityForresult
	 * @param activity
	 * @param requestCode
	 * @param e
	 */
	public void onError(Activity activity, int requestCode, Exception e);
}
