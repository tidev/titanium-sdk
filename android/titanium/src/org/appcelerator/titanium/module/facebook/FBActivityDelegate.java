/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.module.facebook;

import android.app.Activity;

/**
 * Generic activity handler
 */
public interface FBActivityDelegate
{
    public void forward(String action, Activity activity);
}
