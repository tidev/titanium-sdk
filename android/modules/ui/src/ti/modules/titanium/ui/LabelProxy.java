/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUILabel;
import android.app.Activity;

@Kroll.proxy(creatableInModule=UIModule.class)
public class LabelProxy extends TiViewProxy
{
	private boolean clickable = false;
	public LabelProxy(TiContext tiContext)
	{
		super(tiContext);
		tiContext.addOnEventChangeListener(this);
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		TiUILabel label = new TiUILabel(this);
		if (clickable) {
			label.setClickable(true);
		}
		return label;
	}
	
	@Override
	public void eventListenerAdded(String eventName, int count, KrollProxy proxy) {
		super.eventListenerAdded(eventName, count, proxy);
		
		if (eventName.equals("click")) {
			((TiUILabel)getView(getTiContext().getActivity())).setClickable(true);
		}
	}
	
	@Override
	public void eventListenerRemoved(String eventName, int count, KrollProxy proxy) {
		super.eventListenerRemoved(eventName, count, proxy);
		
		if (eventName.equals("click") && count == 0) {
			((TiUILabel)getView(getTiContext().getActivity())).setClickable(false);
		}
	}
	
	public void setClickable(boolean clickable) {
		TiUILabel label = (TiUILabel)getView(getTiContext().getActivity());
		if (label != null) {
			label.setClickable(clickable);
		}
		this.clickable = clickable;
	}
}
