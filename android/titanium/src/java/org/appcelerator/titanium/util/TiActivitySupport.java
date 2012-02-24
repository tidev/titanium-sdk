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
	 * Launch an activity for which you would like a result when it finished. When this activity exits,
	 * TiActivityResultHandler.onResult() method will be called.
	 * @param intent
	 * @param code a launching code
	 * @param handler the callback handler
	 */
	public void launchActivityForResult(Intent intent, int code, TiActivityResultHandler handler);
	
	/**
	 * Returns a unique result code.
	 * @return the result code
	 */
	public int getUniqueResultCode();
}
