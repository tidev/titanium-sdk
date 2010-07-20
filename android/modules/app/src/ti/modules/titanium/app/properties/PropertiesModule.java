/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.app.properties;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiModule;
import org.appcelerator.titanium.TiProperties;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConvert;
import org.json.JSONException;
import org.json.JSONObject;

public class PropertiesModule extends TiModule {

	private static final String LCAT = "PropertiesModule";
	private TiProperties appProperties;
	
	public PropertiesModule(TiContext tiContext) {
		super(tiContext);
		
		appProperties = tiContext.getTiApp().getAppProperties();
		
	}

	public Object getBool(Object[] args) {
		
		if (null != args && args.length>0) {
			// We have some args to work with
			String key = TiConvert.toString(args[0]);
			
			boolean defaultValue = false;
			if (!appProperties.hasProperty(key)) {
				// Without being forced to pass in a default - we need to handle the case where there isn't one passed
				// This means we either have to return null or throw something
				return null;
			} else if (args.length > 1) {
				// grab the default that's been passed
				defaultValue = TiConvert.toBoolean(args[1]);
			}			
			return appProperties.getBool(key, defaultValue);
		} else {
			// Should throw something - as we always expect at least a key
			return null;
		}
	}
	
	public Object getDouble(Object[] args) {
		
		if (null != args && args.length>0) {
			// We have some args to work with
			String key = TiConvert.toString(args[0]);
			
			double defaultValue = 0.00f;
			if (!appProperties.hasProperty(key)) {
				// Without being forced to pass in a default - we need to handle the case where there isn't one passed
				// This means we either have to return null or throw something
				return null;
			} else if (args.length > 1) {
				// grab the default that's been passed
				defaultValue = TiConvert.toDouble(args[1]);
			}			
			return appProperties.getDouble(key, defaultValue);
		} else {
			// Should throw something - as we always expect at least a key
			return null;
		}
	}
	
	public Object getInt(Object[] args) {
		
		if (null != args && args.length>0) {
			// We have some args to work with
			String key = TiConvert.toString(args[0]);
			
			int defaultValue = 0;
			if (!appProperties.hasProperty(key)) {
				// Without being forced to pass in a default - we need to handle the case where there isn't one passed
				// This means we either have to return null or throw something
				return null;
			} else if (args.length > 1) {
				// grab the default that's been passed
				defaultValue = TiConvert.toInt(args[1]);
			}			
			return appProperties.getInt(key, defaultValue);
		} else {
			// Should throw something - as we always expect at least a key
			return null;
		}
	}	
	
	public Object getString(Object[] args) {
		
		if (null != args && args.length>0) {
			// We have some args to work with
			String key = TiConvert.toString(args[0]);
			
			String defaultValue = "";
			if (!appProperties.hasProperty(key)) {
				// Without being forced to pass in a default - we need to handle the case where there isn't one passed
				// This means we either have to return null or throw something
				return null;
			} else if (args.length > 1) {
				// grab the default that's been passed
				defaultValue = TiConvert.toString(args[1]);
			}			
			return appProperties.getString(key, defaultValue);
		} else {
			// Should throw something - as we always expect at least a key
			return null;
		}
	}	
	
	public Object[] getList(Object[] args) {
		
		if (null != args && args.length>0) {
			// We have some args to work with
			String key = TiConvert.toString(args[0]);
			
			String[] defaultValue = new String[0];
			if (!appProperties.hasListProperty(key)) {
				// Without being forced to pass in a default - we need to handle the case where there isn't one passed
				// This means we either have to return null or throw something
				return defaultValue;
			} else if (args.length > 1) {
				// grab the default that's been passed
				defaultValue = TiConvert.toStringArray((String[])args[1]);
			}
			
			//auto transform JSON data into objects
			String values[] = appProperties.getList(key, defaultValue);
			
			Object list[] = new Object[values.length];
			for (int i = 0; i < values.length; i++) {
				String value = values[i];
				if (value.startsWith("{") && value.endsWith("}")) {
					try {
						list[i] = new TiDict(new JSONObject(value));
					} catch (JSONException e) {
						Log.e(LCAT, "Error converting JSON string to TiDict, property:" + key, e);
					}
				} else {
					list[i] = value;
				}
			}
			return list;
		} else {
			// Should throw something - as we always expect at least a key
			return null;
		}		
	}

	public boolean hasProperty(String key) {
		return appProperties.hasProperty(key);
	}

	public String[] listProperties() {
		return appProperties.listProperties();
	}

	public void removeProperty(String key) {
		appProperties.removeProperty(key);
	}

	public void setBool(String key, boolean value) {
		appProperties.setBool(key, value);
	}

	public void setDouble(String key, double value) {
		appProperties.setDouble(key, value);
	}

	public void setInt(String key, int value) {
		appProperties.setInt(key, value);
	}

	public void setList(String key, Object[] value) {
		
		Log.i(LCAT, "setList passed with ["+key+"] and a list of ["+value.length+"] items.");

		String[] valueList = new String[value.length];
		for (int i = 0; i < value.length; i++) {
			Object v = value[i];
			if (v instanceof TiDict) {
				valueList[i] = TiConvert.toJSON((TiDict)v).toString();
			} else if (v instanceof Object[]) {
				valueList[i] = TiConvert.toJSONArray((Object[])v).toString();
			} else {
				valueList[i] = v.toString();
			}
		}
		appProperties.setList(key, valueList);
	}

	public void setString(String key, String value) {
		appProperties.setString(key, value);
	}
	
	
}
