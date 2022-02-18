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
import ti.modules.titanium.ui.widget.TiUISwitch;
import android.app.Activity;

@Kroll.proxy(creatableInModule = UIModule.class,
	propertyAccessors = {
		TiC.PROPERTY_VALUE,
		TiC.PROPERTY_STYLE,
		TiC.PROPERTY_TITLE,
		TiC.PROPERTY_TITLE_ON,
		TiC.PROPERTY_TITLE_OFF,
		TiC.PROPERTY_COLOR,
		TiC.PROPERTY_FONT,
		TiC.PROPERTY_TEXT_ALIGN,
		TiC.PROPERTY_VERTICAL_ALIGN
})
public class SwitchProxy extends TiViewProxy
{
	public SwitchProxy()
	{
		super();
		defaultValues.put(TiC.PROPERTY_VALUE, false);
		defaultValues.put(TiC.PROPERTY_STYLE, UIModule.SWITCH_STYLE_SLIDER);
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUISwitch(this);
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.Switch";
	}
}
