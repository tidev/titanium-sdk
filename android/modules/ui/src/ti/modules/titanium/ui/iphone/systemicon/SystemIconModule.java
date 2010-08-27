/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.iphone.systemicon;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiContext;

public class SystemIconModule extends TiModule
{
	private static KrollDict constants;

	public SystemIconModule(TiContext tiContext)
	{
		super(tiContext);
	}

	@Override
	public KrollDict getConstants() {
		if (constants == null) {
			constants = new KrollDict();

			constants.put("BOOKMARKS", "iphone only");
			constants.put("CONTACTS", "iphone only");
			constants.put("DOWNLOADS", "iphone only");
			constants.put("FAVORITES", "iphone only");
			constants.put("FEATURED", "iphone only");
			constants.put("HISTORY", "iphone only");
			constants.put("MORE", "iphone only");
			constants.put("MOST_RECENT", "iphone only");
			constants.put("MOST_VIEWED", "iphone only");
			constants.put("RECENTS", "iphone only");
			constants.put("SEARCH", "iphone only");
			constants.put("TOP_RATED", "iphone only");
		}

		return constants;
	}

}
