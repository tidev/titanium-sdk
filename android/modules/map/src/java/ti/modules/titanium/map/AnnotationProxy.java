/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.map;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiConfig;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;

@Kroll.proxy(creatableInModule=MapModule.class, propertyAccessors = {
	TiC.PROPERTY_ANIMATE,
	TiC.PROPERTY_IMAGE,
	TiC.PROPERTY_LEFT_BUTTON,
	TiC.PROPERTY_LEFT_VIEW,
	TiC.PROPERTY_PIN_IMAGE,
	TiC.PROPERTY_PINCOLOR,
	TiC.PROPERTY_RIGHT_IMAGE,
	TiC.PROPERTY_RIGHT_VIEW,
	TiC.PROPERTY_SUBTITLE,
	TiC.PROPERTY_TITLE
})
public class AnnotationProxy extends KrollProxy
{
	private static final String LCAT = "AnnotationProxy";
	private static final boolean DBG = TiConfig.LOGD;

	public AnnotationProxy()
	{
		super();

		if (DBG) {
			Log.d(LCAT, "Creating an Annotation");
		}
	}

	public AnnotationProxy(TiContext tiContext)
	{
		this();
	}
}
