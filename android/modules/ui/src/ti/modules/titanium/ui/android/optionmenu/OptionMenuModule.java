/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.android.optionmenu;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollInvocation;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.TiActivitySupport;

//import ti.modules.titanium.android.MenuItemProxy;
//import ti.modules.titanium.android.MenuProxy;
//import ti.modules.titanium.android.TiMenuDispatchListener;
import ti.modules.titanium.ui.android.AndroidModule;

@Kroll.module(parentModule=AndroidModule.class)
public class OptionMenuModule extends KrollModule {

	public OptionMenuModule(TiContext tiContext) {
		super(tiContext);
	}

//	@Kroll.setProperty @Kroll.method
//	public void setMenu(KrollInvocation invocation, MenuProxy menu) {
//		TiContext tiContext = invocation.getTiContext();
//		TiActivitySupport activitySupport = (TiActivitySupport) tiContext.getActivity();
//		if (activitySupport == null) return;
//		
//		activitySupport.setMenuDispatchListener(new TiMenuDispatchListener(tiContext, menu));
//	}
//	
//	// pre 1.5 API Compatibility
//	
//	@Kroll.method
//	public MenuItemProxy createMenuItem(KrollInvocation invocation, @Kroll.argument(optional=true) KrollDict options) {
//		MenuItemProxy menuItem = new MenuItemProxy(invocation.getTiContext());
//		menuItem.handleCreationArgs(this, new Object[] { options });
//		return menuItem;
//	}
//	
//	@Kroll.method
//	public MenuProxy createMenu(KrollInvocation invocation, @Kroll.argument(optional=true) KrollDict options) {
//		MenuProxy menu = new MenuProxy(invocation.getTiContext());
//		menu.handleCreationArgs(this, new Object[] { options });
//		return menu;
//	}
}
