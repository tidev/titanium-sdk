/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUIDialog;
import android.app.Activity;

@Kroll.proxy (
	creatableInModule=UIModule.class,
	propertyAccessors={
		TiC.PROPERTY_BUTTON_NAMES,
		TiC.PROPERTY_CANCEL,
		TiC.PROPERTY_MESSAGE,
		TiC.PROPERTY_TITLE,
		TiC.PROPERTY_OK,
		TiC.PROPERTY_PERSISTENT
	}
)
public class AlertDialogProxy extends TiViewProxy
{
	public AlertDialogProxy()
	{
		super();
	}

	public AlertDialogProxy(TiContext tiContext)
	{
		this();
	}

	@Override
	protected KrollDict getLangConversionTable() {
		KrollDict table = new KrollDict();
		table.put(TiC.PROPERTY_TITLE, TiC.PROPERTY_TITLEID);
		table.put(TiC.PROPERTY_OK, TiC.PROPERTY_OKID);
		table.put(TiC.PROPERTY_MESSAGE, TiC.PROPERTY_MESSAGEID);
		return table;
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUIDialog(this);
	}

	@Override
	protected void handleShow(KrollDict options) {
		super.handleShow(options);
		final KrollDict fOptions = options;
		// If there's a lock on the UI message queue, there's a good chance
		// we're in the middle of activity stack transitions.  An alert
		// dialog should occur above the "topmost" activity, so if activity
		// stack transitions are occurring, try to give them a chance to "settle"
		// before determining which Activity should be the context for the AlertDialog.
		TiUIHelper.runUiDelayedIfBlock(new Runnable()
		{
			@Override
			public void run()
			{
				TiUIDialog d = (TiUIDialog) getOrCreateView();
				d.show(fOptions);
			}
		});
	}

	@Override
	protected void handleHide(KrollDict options) {
		super.handleHide(options);

		TiUIDialog d = (TiUIDialog) getOrCreateView();
		d.hide(options);
	}

}
