/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUIDialog;
import android.app.Activity;

public class OptionDialogProxy extends TiViewProxy
{
	public OptionDialogProxy(TiContext tiContext, Object[] args)
	{
		super(tiContext, args);
	}
	
	@Override
	protected TiDict getLangConverstionTable() {
		TiDict table = new TiDict();
		table.put("title","titleid");
		return table;
	}
	
	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUIDialog(this);
	}

	@Override
	protected void handleShow(TiDict options) {
		super.handleShow(options);

		TiUIDialog d = (TiUIDialog) getView(getTiContext().getActivity());
		d.show(options);
	}

	@Override
	protected void handleHide(TiDict options) {
		super.handleHide(options);

		TiUIDialog d = (TiUIDialog) getView(getTiContext().getActivity());
		d.hide(options);
	}
}
