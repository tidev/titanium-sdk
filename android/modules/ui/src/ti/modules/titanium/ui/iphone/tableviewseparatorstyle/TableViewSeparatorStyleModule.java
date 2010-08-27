/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.iphone.tableviewseparatorstyle;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiContext;

public class TableViewSeparatorStyleModule extends TiModule
{
	private static KrollDict constants;

	public TableViewSeparatorStyleModule(TiContext tiContext) {
		super(tiContext);
	}

	@Override
	public KrollDict getConstants() {
		if (constants == null) {
			constants = new KrollDict();

			constants.put("NONE", "iphone only");
			constants.put("SINGLE_LINE", "iphone only");
		}

		return constants;
	}
}
