/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;

@Kroll.proxy(creatableInModule=UIModule.class, propertyAccessors = {
	TiC.PROPERTY_ATTRIBUTES,
	TiC.PROPERTY_TEXT
})
public class AttributedStringProxy extends KrollProxy
{
	private static final String TAG = "AttributedString";

	public AttributedStringProxy()
	{
	}

	public static AttributeProxy attributeProxyFor(Object obj, KrollProxy proxy){
		AttributeProxy attributeProxy = null;
		if (obj instanceof AttributeProxy) {
			return (AttributeProxy)obj;
		} else {
			KrollDict attributeDict = null;
			if (obj instanceof KrollDict) {
				attributeDict = (KrollDict)obj;
			} else if (obj instanceof HashMap) {
				attributeDict = new KrollDict((HashMap)obj);
			}
			if (attributeDict != null) {
				attributeProxy = new AttributeProxy();
				attributeProxy.setCreationUrl(proxy.getCreationUrl().getNormalizedUrl());
				attributeProxy.handleCreationDict(attributeDict);
			}
			if(attributeProxy == null) {
				Log.e(TAG, "Unable to create attribute proxy for object, likely an error in the type of the object passed in.");
			}
			
			return attributeProxy;
		}
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.AttributedString";
	}
}
