/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import android.app.Activity;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;
import ti.modules.titanium.ui.widget.TiUIButtonBar;

@Kroll.proxy(creatableInModule = UIModule.class, propertyAccessors = {
	TiC.PROPERTY_LABELS,
})
public class ButtonBarProxy extends TiViewProxy
{
	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUIButtonBar(this);
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.ButtonBar";
	}
}
