	/**
	 * Titanium SDK
	 * Copyright TiDev, Inc. 04/07/2022-Present
	 * Licensed under the terms of the Apache Public License
	 * Please see the LICENSE included with this distribution for details.
	 */
package ti.modules.titanium.ui;

import android.app.Activity;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUIBlurView;

@Kroll.proxy(creatableInModule = UIModule.class)
public class BlurViewProxy extends TiViewProxy
{
	public BlurViewProxy()
	{
		super();
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUIBlurView(this);
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.BlurView";
	}
}

