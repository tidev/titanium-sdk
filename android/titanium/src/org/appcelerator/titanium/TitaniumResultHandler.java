/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium;

import android.content.Intent;

public interface TitaniumResultHandler
{
	public void onResult(TitaniumActivity activity, int requestCode, int resultCode, Intent data);
	public void onError(TitaniumActivity activity, int requestCode, Exception e);
}
