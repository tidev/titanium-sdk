/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.util.ArrayList;
import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;

@Kroll.proxy(creatableInModule=UIModule.class, propertyAccessors = {
	TiC.PROPERTY_TEXT
})
public class AttributedStringProxy extends KrollProxy
{
	private static final String TAG = "AttributedString";
	
	private ArrayList<AttributeProxy> attributes = new ArrayList<AttributeProxy>();

	public AttributedStringProxy()
	{
	}
	
	@Kroll.method
	public void addAttribute(AttributeProxy attribute)
	{
		attributes.add(attribute);
	}
	
	/**
	 * @return An array of attribute.
	 * @module.api
	 */
	@Kroll.getProperty @Kroll.method
	public AttributeProxy[] getAttributes()
	{
		if (attributes == null) return new AttributeProxy[0];
		return attributes.toArray(new AttributeProxy[attributes.size()]);
	}
	
	@Kroll.setProperty @Kroll.method
	public void setAttributes(AttributeProxy[] values)
	{
		for (AttributeProxy attribute:values) {
			addAttribute(attribute);
		}
	}
	
	@Override
	public void handleCreationDict(KrollDict options) {
		super.handleCreationDict(options);

		// Support setting attributes at creation.
		Object[] values = (Object[])options.get(TiC.PROPERTY_ATTRIBUTES);
		if (values != null && values instanceof Object[]) {
			for(int i = 0; i < values.length; i++) {
				if (values[i] == null) {
					Log.e(TAG, "Unable to create attribute proxy for null object passed in.");
					return;
				}
				AttributeProxy attributeProxy = null;
				if (values[i] instanceof AttributeProxy) {
					attributeProxy = (AttributeProxy) values[i];
				}
				else {
					KrollDict attributeDict = null;
					if (values[i] instanceof KrollDict) {
						attributeDict = (KrollDict) values[i];
					} else if (values[i] instanceof HashMap) {
						attributeDict = new KrollDict((HashMap) values[i]);
					}
					
					if (attributeDict != null) {
						attributeProxy = new AttributeProxy();
						attributeProxy.setCreationUrl(getCreationUrl().getNormalizedUrl());
						attributeProxy.handleCreationDict(attributeDict);
					}
				}
				if (attributeProxy != null) {
					addAttribute(attributeProxy);
				}
			}
		}
	}

	@Override
	public String getApiName()
	{
		return "Ti.Android.AttributedString";
	}
}
