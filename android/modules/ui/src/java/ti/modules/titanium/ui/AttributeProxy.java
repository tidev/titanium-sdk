/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;

@Kroll.proxy(propertyAccessors = {
	TiC.PROPERTY_ATTRIBUTE_TYPE,
	TiC.PROPERTY_ATTRIBUTE_VALUE,
	TiC.PROPERTY_ATTRIBUTE_RANGE,
})
public class AttributeProxy extends KrollProxy
{
	private static final String TAG = "Attribute";

	protected AttributeProxy()
	{
	}
	
	@Override
	public String getApiName()
	{
		return "Ti.UI.Attribute";
	}
}
