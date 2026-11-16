/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;

@Kroll.proxy(propertyAccessors = { TiC.PROPERTY_TYPE, TiC.PROPERTY_VALUE, TiC.PROPERTY_ATTRIBUTE_RANGE })
public class AttributeProxy extends KrollProxy
{
	protected AttributeProxy()
	{
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.Attribute";
	}
}
