/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.view.TiAnimation;

public class AnimationProxy extends TiAnimation {

	public AnimationProxy(TiContext tiContext, Object[] args) {
		super(tiContext);
		// Since transform is an object, KrollObject will not
		// treat it as a dynamic property by default.
		setDynamicValue("transform", null);
	}
}
