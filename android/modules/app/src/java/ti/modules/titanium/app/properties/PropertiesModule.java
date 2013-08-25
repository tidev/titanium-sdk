/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.app.properties;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiProperties;

import ti.modules.titanium.app.AppModule;

@Kroll.module(parentModule=AppModule.class)
public class PropertiesModule extends KrollModule {
	private static final String TAG = "PropertiesModule";
	private TiProperties appProperties;

	public PropertiesModule()
	{
		super();

		appProperties = TiApplication.getInstance().getAppProperties();
	}

	public PropertiesModule(TiContext tiContext)
	{
		this();
	}
	
	private static final String NULL_STRING = "null";
	
	private String getStringValueIfExists(String key)
	{
		Object stringVal = getPreferenceValue(key);
		if (stringVal instanceof String) {
			return (String) stringVal;
		}
		return null;
	}

	@Kroll.method
	public Object getBool(String key)
	{
		String stringValue = getStringValueIfExists(key);
		if (KrollRuntime.UNDEFINED.toString().equals(stringValue)) {
			return KrollRuntime.UNDEFINED;
		} else if (NULL_STRING.equals(stringValue)) {
			return null;
		}
		return appProperties.getBool(key, false);
	}


	@Kroll.method
	public Object getDouble(String key)
	{
		String stringValue = getStringValueIfExists(key);
		if (KrollRuntime.UNDEFINED.toString().equals(stringValue)) {
			return KrollRuntime.UNDEFINED;
		} else if (NULL_STRING.equals(stringValue)) {
			return null;
		}
		return appProperties.getDouble(key, 0D);
	}

	@Kroll.method
	public Object getInt(String key)
	{
		String stringValue = getStringValueIfExists(key);
		if (KrollRuntime.UNDEFINED.toString().equals(stringValue)) {
			return KrollRuntime.UNDEFINED;
		} else if (NULL_STRING.equals(stringValue)) {
			return null;
		}
		return appProperties.getInt(key, 0);
	}

	private static final int UNDEFINED_VALUE = -1;
	@Kroll.method
	public Object getString(String key)
	{
		int intVal = appProperties.getInt(key, 0);
		if (intVal == UNDEFINED_VALUE) {
			return KrollRuntime.UNDEFINED;
		}
		return appProperties.getString(key, null);
	}

	@Kroll.method
	public boolean hasProperty(String key)
	{
		return appProperties.hasProperty(key);
	}

	@Kroll.method
	public String[] listProperties()
	{
		return appProperties.listProperties();
	}

	@Kroll.method
	public void removeProperty(String key)
	{
		if (hasProperty(key)) {
			appProperties.removeProperty(key);
			fireEvent(TiC.EVENT_CHANGE, null);
		}
	}

	//Convenience method for pulling raw values
	public Object getPreferenceValue(String key)
	{
		return appProperties.getPreference().getAll().get(key);
	}
	
	private void setUndefinedOrNull(String key, Object value, Object currentValue)
	{
		if (value == KrollRuntime.UNDEFINED) {
			if (!KrollRuntime.UNDEFINED.toString().equals(currentValue)) {
				appProperties.setString(key, KrollRuntime.UNDEFINED.toString());
				fireEvent(TiC.EVENT_CHANGE, null);
			}
		} else if (value == null) {
			if (!"null".equals(currentValue)) {
				appProperties.setString(key, "null");
				fireEvent(TiC.EVENT_CHANGE, null);
			}
		} else {
			Log.w(TAG, "Invalid type");
		}
	}
	
	@Kroll.method
	public void setBool(String key, Object value)
	{
		Object boolValue = getPreferenceValue(key);
		if (value instanceof Boolean) {
			boolean valueToSet = ((Boolean) value).booleanValue();
			if (boolValue == null || !boolValue.equals(valueToSet)) {
				appProperties.setBool(key, valueToSet);
				fireEvent(TiC.EVENT_CHANGE, null);
			}
		} else {
			setUndefinedOrNull(key, value, boolValue);
		}

	}

	@Kroll.method
	public void setDouble(String key, Object value)
	{
		Object doubleValue = getPreferenceValue(key);
		if (value instanceof Double) {
			double valueToSet = ((Double) value).doubleValue();
			// Since there is no double type in SharedPreferences, we store doubles as strings, i.e "10.0"
			// so we need to convert before comparing.
			if (doubleValue == null || !doubleValue.equals(String.valueOf(valueToSet))) {
				appProperties.setDouble(key, valueToSet);
				fireEvent(TiC.EVENT_CHANGE, null);
			}
		} else {
			setUndefinedOrNull(key, value, doubleValue);
		}
	}

	@Kroll.method
	public void setInt(String key, Integer value)
	{
		Object intValue = getPreferenceValue(key);
		if (value instanceof Integer) {
			int valueToSet = ((Integer) value).intValue();
			if (intValue == null || !intValue.equals(valueToSet)) {
				appProperties.setInt(key, valueToSet);
				fireEvent(TiC.EVENT_CHANGE, null);
			}
		} else {
			setUndefinedOrNull(key, value, intValue);
		}

	}

	@Kroll.method
	public void setString(String key, Object value)
	{
		if (value == KrollRuntime.UNDEFINED) {
			appProperties.setInt(key, UNDEFINED_VALUE);
		} else if (value == null || value instanceof String) {
			Object stringValue = getPreferenceValue(key);
			if (stringValue == null || !stringValue.equals(value)) {
				appProperties.setString(key, (String) value);
				fireEvent(TiC.EVENT_CHANGE, null);
			}
		}
	}

}
