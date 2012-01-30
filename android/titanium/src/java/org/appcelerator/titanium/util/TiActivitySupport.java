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
	public void launchActivityForResult(Intent intent, int code, TiActivityResultHandler handler);
	public int getUniqueResultCode();
}
