/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.util.TiConvert;

@Kroll.proxy(propertyAccessors = {
	TiC.PROPERTY_ATTRIBUTE_TYPE,
	TiC.PROPERTY_ATTRIBUTE_VALUE
})
public class AttributeProxy extends KrollProxy
{
	private static final String TAG = "Attribute";
	
	protected int[] range = null;

	protected AttributeProxy()
	{
	}

	@Kroll.method @Kroll.setProperty
	public void setRange (int[] range)
	{
		this.range = range;
	}
	
	@Kroll.method @Kroll.getProperty
	public int[] getRange()
	{
		return range;
	}
	
	@Override
	public void handleCreationDict(KrollDict options) {
		super.handleCreationDict(options);

		// Support setting range at creation.
		Object inRange = options.get(TiC.PROPERTY_ATTRIBUTE_RANGE);
		if (inRange != null && inRange instanceof Object[]) {
			try {
				int[] rangeArr = TiConvert.toIntArray((Object[]) inRange);
				setRange(rangeArr);

			} catch (ClassCastException e) {
				Log.e(TAG, "Invalid range array. Must only contain numbers.");
			}
		}
	}
	
	@Override
	public String getApiName()
	{
		return "Ti.Android.Attribute";
	}
}
