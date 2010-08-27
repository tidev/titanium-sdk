/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.iphone.statusbar;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiContext;

public class StatusBarModule extends TiModule
{

	private static KrollDict constants;

	public StatusBarModule(TiContext tiContext) {
		super(tiContext);
	}

	@Override
	public KrollDict getConstants() {
		if (constants == null) {
			constants = new KrollDict();

			constants.put("DEFAULT", "iphone only");
			constants.put("GRAY", "iphone only");
			constants.put("OPAQUE_BLACK", "iphone only");
			constants.put("TRANSLUCENT_BLACK", "iphone only");
		}

		return constants;
	}
}
