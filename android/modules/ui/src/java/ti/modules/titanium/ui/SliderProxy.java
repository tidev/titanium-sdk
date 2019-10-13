/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUISlider;
import android.app.Activity;
// clang-format off
@Kroll.proxy(creatableInModule = UIModule.class,
	propertyAccessors = {
		"min",
		"max",
		"minRange",
		"maxRange",
		"thumbImage",
		TiC.PROPERTY_SPLIT_TRACK,
		"leftTrackImage",
		"rightTrackImage",
		TiC.PROPERTY_TINT_COLOR,
		TiC.PROPERTY_TRACK_TINT_COLOR,
		TiC.PROPERTY_VALUE
})
// clang-format on
public class SliderProxy extends TiViewProxy
{
	public SliderProxy()
	{
		super();
		defaultValues.put(TiC.PROPERTY_SPLIT_TRACK, false);
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUISlider(this);
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.Slider";
	}
}
