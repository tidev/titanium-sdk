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
import org.appcelerator.titanium.proxy.TiWindowProxy;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;

@Kroll.proxy(creatableInModule="UI")
public class TabProxy extends TiViewProxy
{
	private static final String LCAT = "TabProxy";
	private static final boolean DBG = TiConfig.LOGD;

	private TiWindowProxy win;
	private TabGroupProxy tabGroupProxy;

	public TabProxy(TiContext tiContext) {
		super(tiContext);
	}

	@Override
	public TiUIView createView(Activity activity) {
		return null;
	}

	@Kroll.method
	public void open(TiWindowProxy win, @Kroll.argument(optional=true) KrollDict options) {
		if (win != null) {
			if (options == null) {
				options = new KrollDict();
			}

			this.win = win;
			this.win.setTabProxy(this);
			this.win.setTabGroupProxy(tabGroupProxy);
			options.put("tabOpen", true);
			win.open(options);
		}
	}

	@Kroll.method
	public void close(@Kroll.argument(optional=true) KrollDict options) {
		if (win != null) {
			win.close(options);
			win = null;
		}
	}

	public void setTabGroup(TabGroupProxy tabGroupProxy) {
		this.tabGroupProxy = tabGroupProxy;
	}
}
