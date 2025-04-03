/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.android;

import android.app.Activity;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUIRadioButtons;

@Kroll.proxy(creatableInModule = AndroidModule.class, propertyAccessors = {
	TiC.PROPERTY_LABELS, TiC.PROPERTY_SELECTED_INDEX
})
public class RadioButtonsProxy extends TiViewProxy
{
	@Override
	public TiUIView createView(Activity activity)
	{
		defaultValues.put(TiC.PROPERTY_SELECTED_INDEX, -1);
		return new TiUIRadioButtons(this);
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.RadioButtons";
	}
}
