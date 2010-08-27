/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.android.optionmenu;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiContext;

public class MenuItemProxy extends KrollProxy {

	public MenuItemProxy(TiContext tiContext, Object[] args) {
		super(tiContext);

		if (args != null && args.length > 0) {
			KrollDict options = (KrollDict) args[0];

			setProperties(options);
		}
	}
}
