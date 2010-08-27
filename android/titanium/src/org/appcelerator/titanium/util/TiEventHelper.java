/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.proxy.TiViewProxy;

public class TiEventHelper {

	public static final String EVENT_CLICK = "click";
	public static final String EVENT_FOCUSED = "focused";
	public static final String EVENT_UNFOCUSED = "unfocused";
	
	public static void fireViewEvent(TiViewProxy view, String type, Map<String,Object> extraProperties)
	{
		KrollDict event = new KrollDict();
		event.put("source", view);
		event.put("type", type);
		
		if (extraProperties != null) {
			for (Entry<String,Object> entry : extraProperties.entrySet()) {
				event.put(entry.getKey(), entry.getValue());
			}
		}
		
		view.fireEvent(type, event);
	}
	
	public static void fireViewEvent(TiViewProxy view, String type, String... properties)
	{
		if (properties.length == 0) {
			fireViewEvent(view, type, (Map<String,Object>)null);
		}
		
		Map<String,Object> extraProperties = new HashMap<String,Object>();
		for (int i = 0; i < properties.length; i++) {
			if (i+1 < properties.length) {
				extraProperties.put(properties[i], properties[++i]);
			}
		}
	}
	
	public static void fireClicked(TiViewProxy view) {
		fireViewEvent(view, EVENT_CLICK);
	}
	
	public static void fireFocused(TiViewProxy view) {
		fireViewEvent(view, EVENT_FOCUSED);
	}
	
	public static void fireUnfocused(TiViewProxy view) {
		fireViewEvent(view, EVENT_UNFOCUSED);
	}
}
