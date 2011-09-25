/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUINotification;
import android.app.Activity;

@Kroll.proxy(creatableInModule=UIModule.class)
public class NotificationProxy extends TiViewProxy
{
	public NotificationProxy()
	{
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUINotification(this);
	}

	@Override
	protected void handleShow(KrollDict options) {
		super.handleShow(options);

		TiUINotification n = (TiUINotification) getOrCreateView();
		n.show(options);
	}
}
