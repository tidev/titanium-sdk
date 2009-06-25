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
