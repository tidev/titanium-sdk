/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiView;
import android.app.Activity;

public class ToolbarProxy extends TiViewProxy
{
	public ToolbarProxy(TiContext tiContext, Object[] args)
	{
		super(tiContext, args);
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		Log.e("Toolbar", "Not implemented on Android yet. Placeholder proxy.");
		TiView v = new TiView(this);
		v.getLayoutParams().autoFillsWidth = true;
		KrollDict options = new KrollDict();
		options.put("backgroundColor", "red");
		options.put("color", "white");
		options.put("width", "auto");
		options.put("top", 0);
		options.put("bottom", 0);
		options.put("text", "Not yet implemented for Android.");
		LabelProxy lp = new LabelProxy(getTiContext(), new Object[]{ options });
		TiUIView lf = lp.createView(activity);
		lf.processProperties(lp.getDynamicProperties());
		v.add(lf);
		return v; // return a view, to prevent crashing.
	}
}
