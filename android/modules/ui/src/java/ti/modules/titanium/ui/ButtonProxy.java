/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import android.app.Activity;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUIButton;

@Kroll.proxy(creatableInModule = UIModule.class,
	propertyAccessors = {
		TiC.PROPERTY_TITLE,
		TiC.PROPERTY_TITLEID,
		TiC.PROPERTY_COLOR,
		TiC.PROPERTY_ENABLED,
		TiC.PROPERTY_FONT,
		TiC.PROPERTY_IMAGE,
		TiC.PROPERTY_IMAGE_IS_MASK,
		TiC.PROPERTY_TEXT_ALIGN,
		TiC.PROPERTY_VERTICAL_ALIGN,
		TiC.PROPERTY_SHADOW_OFFSET,
		TiC.PROPERTY_SHADOW_COLOR,
		TiC.PROPERTY_SHADOW_RADIUS,
		TiC.PROPERTY_TINT_COLOR
	})
public class ButtonProxy extends TiViewProxy
{
	public ButtonProxy()
	{
		defaultValues.put(TiC.PROPERTY_TITLE, "");
		defaultValues.put(TiC.PROPERTY_SHADOW_RADIUS, 1f);
	}

	@Override
	protected KrollDict getLangConversionTable()
	{
		KrollDict table = new KrollDict();
		table.put(TiC.PROPERTY_TITLE, TiC.PROPERTY_TITLEID);
		return table;
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUIButton(this);
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.Button";
	}
}
