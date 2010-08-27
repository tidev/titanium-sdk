/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.map;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.TiConfig;

public class MapModule extends TiModule
{
	private static final String LCAT = "TiMap";
	private static final boolean DBG = TiConfig.LOGD;

	private static KrollDict constants;

	public MapModule(TiContext tiContext)
	{
		super(tiContext);
	}

	@Override
	public KrollDict getConstants() {
		if (constants == null) {
			constants = new KrollDict();

			constants.put("ANNOTATION_RED", 1);
			constants.put("ANNOTATION_GREEN", 2);
			constants.put("ANNOTATION_PURPLE", 3);

			constants.put("STANDARD_TYPE", TiMapView.MAP_VIEW_STANDARD);
			constants.put("SATELLITE_TYPE", TiMapView.MAP_VIEW_SATELLITE);
			constants.put("HYBRID_TYPE", TiMapView.MAP_VIEW_HYBRID);
		}

		return constants;
	}


}
