/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.app.properties;

import org.appcelerator.kroll.KrollDefaultValueProvider;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollInvocation;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiProperties;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConvert;
import org.json.JSONException;
import org.json.JSONObject;

import ti.modules.titanium.app.AppModule;

@Kroll.module(parentModule=AppModule.class)
public class PropertiesModule extends KrollModule {

	private static final String LCAT = "PropertiesModule";
	private TiProperties appProperties;
	
	public PropertiesModule(TiContext tiContext) {
		super(tiContext);
		
		appProperties = tiContext.getTiApp().getAppProperties();
	}

	public static class DefaultValues implements KrollDefaultValueProvider {
		protected static DefaultValues _instance = new DefaultValues();
		@Override
		public Object getDefaultValue(Class<?> clazz) {
			return null;
		}
		public static DefaultValues getInstance() {
			return _instance;
		}
	}
	
	@Kroll.method
	public Object getBool(String key,
		@Kroll.argument(optional=true, defaultValueProvider=DefaultValues.class) Boolean defaultValue) {
		
		if (!appProperties.hasProperty(key)) {
			// pre-empt so we can correctly return null for primitive types
			return defaultValue;
		}
		return appProperties.getBool(key, defaultValue);
	}
	
	@Kroll.method
	public Object getDouble(String key,
		@Kroll.argument(optional=true, defaultValueProvider=DefaultValues.class) Double defaultValue) {
		if (!appProperties.hasProperty(key)) {
			// pre-empt so we can correctly return null for primitive types
			return defaultValue;
		}
		return appProperties.getDouble(key, defaultValue);
	}
	
	@Kroll.method
	public Object getInt(String key,
		@Kroll.argument(optional=true, defaultValueProvider=DefaultValues.class) Integer defaultValue) {
		if (!appProperties.hasProperty(key)) {
			// pre-empt so we can correctly return null for primitive types
			return defaultValue;
		}
		return appProperties.getInt(key, defaultValue);
	}	
	
	@Kroll.method
	public Object getString(String key,
		@Kroll.argument(optional=true, defaultValueProvider=DefaultValues.class) String defaultValue) {
		return appProperties.getString(key, defaultValue);
	}	
	
	@Kroll.method
	public Object getList(KrollInvocation invocation, String key,
		@Kroll.argument(optional=true, defaultValueProvider=DefaultValues.class) Object[] defaultValue) {
		
		String[] values = new String[0];
		if (appProperties.hasListProperty(key)) {
			//auto transform JSON data into objects 
			values = appProperties.getList(key, values);
		} else {
			if (defaultValue == null) {
				return null;
			}
			values = TiConvert.toStringArray(defaultValue);
		}
		// Now we should process values - we want the default process to happen with both stored & default values
		Object list[] = new Object[values.length];
		for (int i = 0; i < values.length; i++) {
			String value = values[i];
			if (value.startsWith("{") && value.endsWith("}")) {
				try {
					list[i] = new KrollDict(new JSONObject(value));
				} catch (JSONException e) {
					Log.e(LCAT, "Error converting JSON string to KrollDict, property:" + key, e);
				}
			} else {
				list[i] = value;
			}
		}
		return list;
	}

	@Kroll.method
	public boolean hasProperty(String key) {
		return appProperties.hasProperty(key);
	}

	@Kroll.method
	public String[] listProperties() {
		return appProperties.listProperties();
	}

	@Kroll.method
	public void removeProperty(String key) {
		appProperties.removeProperty(key);
	}

	@Kroll.method
	public void setBool(String key, boolean value) {
		appProperties.setBool(key, value);
	}

	@Kroll.method
	public void setDouble(String key, double value) {
		appProperties.setDouble(key, value);
	}

	@Kroll.method
	public void setInt(String key, int value) {
		appProperties.setInt(key, value);
	}

	@Kroll.method
	public void setList(String key, Object[] value) {
		
		Log.i(LCAT, "setList passed with ["+key+"] and a list of ["+value.length+"] items.");

		String[] valueList = new String[value.length];
		for (int i = 0; i < value.length; i++) {
			Object v = value[i];
			if (v instanceof KrollDict) {
				valueList[i] = TiConvert.toJSON((KrollDict)v).toString();
			} else if (v instanceof Object[]) {
				valueList[i] = TiConvert.toJSONArray((Object[])v).toString();
			} else {
				valueList[i] = v.toString();
			}
		}
		appProperties.setList(key, valueList);
	}

	@Kroll.method
	public void setString(String key, String value) {
		appProperties.setString(key, value);
	}
}
