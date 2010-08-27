/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.iphone.systembutton;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiContext;

public class SystemButtonModule extends TiModule
{
	private static KrollDict constants;

	public SystemButtonModule(TiContext tiContext) {
		super(tiContext);
	}

	@Override
	public KrollDict getConstants() {
		if (constants == null) {
			constants = new KrollDict();

			constants.put("ACTION", "iphone only");
			constants.put("ADD", "iphone only");
			constants.put("BOOKMARKS", "iphone only");
			constants.put("CAMERA", "iphone only");
			constants.put("CANCEL", "iphone only");
			constants.put("COMPOSE", "iphone only");
			constants.put("CONTACT_ADD", "iphone only");
			constants.put("DISCLOSURE", "iphone only");
			constants.put("DONE", "iphone only");
			constants.put("EDIT", "iphone only");
			constants.put("FAST_FORWARD", "iphone only");
			constants.put("FIXED_SPACE", "iphone only");
			constants.put("FLEXIBLE_SPACE", "iphone only");
			constants.put("INFO_DARK", "iphone only");
			constants.put("INFO_LIGHT", "iphone only");
			constants.put("ORGANIZE", "iphone only");
			constants.put("PAUSE", "iphone only");
			constants.put("PLAY", "iphone only");
			constants.put("REFRESH", "iphone only");
			constants.put("REPLY", "iphone only");
			constants.put("REWIND", "iphone only");
			constants.put("SAVE", "iphone only");
			constants.put("SEARCH", "iphone only");
			constants.put("SPINNER", "iphone only");
			constants.put("STOP", "iphone only");
			constants.put("TRASH", "iphone only");
		}

		return constants;
	}

}
