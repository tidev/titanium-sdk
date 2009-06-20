package org.appcelerator.titanium.util;

import org.appcelerator.titanium.TitaniumActivityGroup;

import android.app.Activity;

public class TitaniumActivityHelper
{
	public static TitaniumActivityGroup getTitaniumActivityGroup(Activity activity)
	{
		Activity parent = activity.getParent();

		while(parent.getParent() != null && ! parent.isTaskRoot()) {
			parent = parent.getParent();
		}
		// ClassCast Exception will guarantee all Titanium Mobile extend
		// TitaniumActivityGroup
		return (TitaniumActivityGroup) parent;
	}


}
