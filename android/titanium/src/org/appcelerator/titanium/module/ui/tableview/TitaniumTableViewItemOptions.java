package org.appcelerator.titanium.module.ui.tableview;

import java.util.HashMap;

import org.json.JSONObject;

public class TitaniumTableViewItemOptions extends HashMap<String, String>
{
	private static final int INITIAL = 10;

	public TitaniumTableViewItemOptions() {
		this(INITIAL);
	}

	public TitaniumTableViewItemOptions(int initialCapacity) {
		super(initialCapacity);
	}

	String resolveOption(String key, JSONObject ... items) {

		String value = get(key);

		for(JSONObject item : items) {
			if (item != null && item.has(key)) {
				value = item.optString(key);
				break;
			}
		}
		return value;
	}

	int resolveIntOption(String key, JSONObject ... items) {
		String value = resolveOption(key, items);
		return value == null ? -1 : Integer.parseInt(value);
	}
}
