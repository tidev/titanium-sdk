/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.iphone.animationstyle;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;

public class AnimationStyleModule extends TiModule
{

	private static TiDict constants;

	public AnimationStyleModule(TiContext tiContext) {
		super(tiContext);
	}

	@Override
	public TiDict getConstants() {
		if (constants == null) {
			constants = new TiDict();

			constants.put("CURL_DOWN", "iphone only");
			constants.put("CURL_UP", "iphone only");
			constants.put("FLIP_FROM_LEFT", "iphone only");
			constants.put("FLIP_FROM_RIGHT", "iphone only");
		}

		return constants;
	}

}
