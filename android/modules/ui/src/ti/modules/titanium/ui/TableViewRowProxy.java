/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.util.ArrayList;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;

public class TableViewRowProxy extends TiViewProxy
{
	protected ArrayList<TiViewProxy> controls;

	public TableViewRowProxy(TiContext tiContext, Object[] args) {
		super(tiContext, args);
	}

	@Override
	public TiUIView createView(Activity activity) {
		return null;
	}

	public ArrayList<TiViewProxy> getControls() {
		return controls;
	}

	public boolean hasControls() {
		return (controls != null && controls.size() > 0);
	}

	public void add(TiViewProxy control) {
		if (controls == null) {
			controls = new ArrayList<TiViewProxy>();
		}
		controls.add(control);
	}
}
