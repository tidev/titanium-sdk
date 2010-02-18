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
	public void onResult(Activity activity, int requestCode, int resultCode, Intent data);
	public void onError(Activity activity, int requestCode, Exception e);
}
