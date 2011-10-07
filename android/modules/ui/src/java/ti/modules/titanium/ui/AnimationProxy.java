/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.view.TiAnimation;

@Kroll.proxy(creatableInModule=UIModule.class, propertyAccessors={
	TiC.PROPERTY_ANCHOR_POINT,
	TiC.PROPERTY_TRANSFORM,
	TiC.PROPERTY_DELAY,
	TiC.PROPERTY_DURATION,
	TiC.PROPERTY_OPACITY,
	TiC.PROPERTY_REPEAT,
	TiC.PROPERTY_AUTOREVERSE,
	TiC.PROPERTY_TOP,
	TiC.PROPERTY_BOTTOM,
	TiC.PROPERTY_LEFT,
	TiC.PROPERTY_RIGHT,
	TiC.PROPERTY_CENTER,
	TiC.PROPERTY_WIDTH,
	TiC.PROPERTY_HEIGHT
})

public class AnimationProxy extends TiAnimation {

	public void handleCreationDict(org.appcelerator.kroll.KrollDict dict) {
		super.handleCreationDict(dict);
		
		// Since transform is an object, KrollObject will not
		// treat it as a dynamic property by default.
		setProperty(TiC.PROPERTY_TRANSFORM, null);
	}
}
