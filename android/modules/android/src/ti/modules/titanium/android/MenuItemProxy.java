/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.android;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;

public class MenuItemProxy extends TiProxy {

	public MenuItemProxy(TiContext tiContext, Object[] args) {
		super(tiContext);

		if (args != null && args.length > 0) {
			TiDict options = (TiDict) args[0];

			setProperties(options);
		}
	}
}
