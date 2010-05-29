/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.facebook;

import android.app.Activity;
import android.os.Bundle;

/**
 * Generic activity handler
 */
public interface FBActivityDelegate
{
    public FBDialog onCreate(String action, Activity activity, Bundle savedInstanceState);
}
