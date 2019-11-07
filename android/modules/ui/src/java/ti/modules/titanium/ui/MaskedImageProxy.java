/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;

import ti.modules.titanium.ui.widget.TiUIMaskedImage;

// clang-format off
@Kroll.proxy(creatableInModule = UIModule.class,
	propertyAccessors = {
		TiC.PROPERTY_IMAGE,
		TiC.PROPERTY_MASK,
		TiC.PROPERTY_MODE,
		TiC.PROPERTY_TINT,
		TiC.PROPERTY_TINT_COLOR
})
// clang-format on
public class MaskedImageProxy extends ViewProxy
{
	public MaskedImageProxy()
	{
		defaultValues.put(TiC.PROPERTY_MODE, UIModule.BLEND_MODE_SOURCE_IN);
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUIMaskedImage(this);
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.MaskedImage";
	}
}
