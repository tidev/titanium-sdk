/**
 * TiDev Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.android;

import android.app.Activity;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiDrawableReference;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUICollapseToolbar;

@Kroll.proxy(creatableInModule = AndroidModule.class)
public class CollapseToolbarProxy extends TiViewProxy
{
	private static final String TAG = "CollapseToolbarProxy";
	private TiUICollapseToolbar collapseToolbar;

	@Override
	public TiUIView createView(Activity activity)
	{
		collapseToolbar = new TiUICollapseToolbar(this);
		collapseToolbar.getLayoutParams().autoFillsHeight = true;
		collapseToolbar.getLayoutParams().autoFillsWidth = true;
		return collapseToolbar;
	}

	@Kroll.setProperty
	public void setImage(Object obj)
	{
		collapseToolbar.setImage(TiDrawableReference.fromObject(this, obj).getBitmap(false));
	}
	@Kroll.setProperty
	public void setTitle(String text)
	{
		collapseToolbar.setTitle(text);
	}

	@Kroll.setProperty
	public void setContentView(Object obj)
	{
		if (obj instanceof TiViewProxy) {
			collapseToolbar.setContentView((TiViewProxy) obj);
		}
	}

	@Kroll.setProperty
	public void setBarColor(String value)
	{
		collapseToolbar.setBarColor(TiConvert.toColor(value, TiApplication.getAppCurrentActivity()));
	}

	@Kroll.setProperty
	public void setContentScrimColor(String value)
	{
		collapseToolbar.setContentScrimColor(TiConvert.toColor(value, TiApplication.getAppCurrentActivity()));
	}

	@Kroll.setProperty
	public void setFlags(int value)
	{
		collapseToolbar.setFlags(value);
	}
}
