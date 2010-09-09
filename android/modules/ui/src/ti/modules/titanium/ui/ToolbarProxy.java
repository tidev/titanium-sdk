/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiView;
import android.app.Activity;

@Kroll.proxy(creatableInModule=UIModule.class)
public class ToolbarProxy extends TiViewProxy
{
	public ToolbarProxy(TiContext tiContext)
	{
		super(tiContext);
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
		LabelProxy lp = new LabelProxy(getTiContext());
		lp.handleCreationDict(options);
		TiUIView lf = lp.createView(activity);
		lf.processProperties(lp.getProperties());
		v.add(lf);
		return v; // return a view, to prevent crashing.
	}
}
