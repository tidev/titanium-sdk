/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import android.app.Activity;

public class TitaniumActivityHelper
{
	public static Activity getRootActivity(Activity activity)
	{
		Activity parent = activity;

		while(parent.getParent() != null && ! parent.isTaskRoot()) {
			parent = parent.getParent();
		}

		return  parent;
	}


}
