/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tableview;

import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;

public class TiTableViewItemOptions extends HashMap<String, String>
{
	private static final long serialVersionUID = 1L;
	private static final int INITIAL = 10;

	public TiTableViewItemOptions() {
		this(INITIAL);
	}

	public TiTableViewItemOptions(int initialCapacity) {
		super(initialCapacity);
	}

	public String resolveOption(String key, KrollDict ... items) {

		String value = get(key);

		for(KrollDict item : items) {
			if (item != null && item.containsKey(key)) {
				value = item.getString(key);
				break;
			}
		}
		return value;
	}

	public int resolveIntOption(String key, KrollDict ... items) {
		String value = resolveOption(key, items);
		return value == null ? -1 : Integer.parseInt(value);
	}

	public int getIntOption(String key) {
		String value = get(key);
		return value == null ? -1 : Integer.parseInt(value);
	}
}
