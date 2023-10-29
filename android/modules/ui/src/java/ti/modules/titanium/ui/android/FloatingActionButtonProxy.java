/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.android;

import android.app.Activity;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUIFloatingActionButton;

@Kroll.proxy(creatableInModule = AndroidModule.class)
public class FloatingActionButtonProxy extends TiViewProxy
{
	private static final String TAG = "FloatingActionButtonProxy";
	private TiUIFloatingActionButton fab;

	@Override
	public TiUIView createView(Activity activity)
	{
		fab = new TiUIFloatingActionButton(this);
		return fab;
	}
}
