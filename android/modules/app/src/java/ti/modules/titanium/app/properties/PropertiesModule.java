/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.app.properties;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiProperties;

import ti.modules.titanium.app.AppModule;

@Kroll.module(parentModule = AppModule.class)
public class PropertiesModule extends KrollModule
{

	private TiProperties appProperties;

	public PropertiesModule()
	{
		super();

		appProperties = TiApplication.getInstance().getAppProperties();
	}

	@Kroll.method
	public boolean getBool(String key)
	{
		return appProperties.getBool(key, false);
	}

	@Kroll.method
	public double getDouble(String key)
	{
		return appProperties.getDouble(key, 0D);
	}

	@Kroll.method
	public int getInt(String key)
	{
		return appProperties.getInt(key, 0);
	}

	@Kroll.method
	public String getString(String key)
	{
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

	@Kroll.method
	public void removeAllProperties()
	{
		appProperties.removeAllProperties();
	}

	@Kroll.method
	public void setBool(String key, boolean value)
	{
		Object boolValue = appProperties.getPreference(key);
		if (boolValue == null || !boolValue.equals(value)) {
			appProperties.setBool(key, value);
			fireEvent(TiC.EVENT_CHANGE, null);
		}
	}

	@Kroll.method
	public void setDouble(String key, double value)
	{
		Object doubleValue = appProperties.getPreference(key);
		//Since there is no double type in SharedPreferences, we store doubles as strings, i.e "10.0"
		//so we need to convert before comparing.
		if (doubleValue == null || !doubleValue.equals(String.valueOf(value))) {
			appProperties.setDouble(key, value);
			fireEvent(TiC.EVENT_CHANGE, null);
		}
	}

	@Kroll.method
	public void setInt(String key, int value)
	{
		Object intValue = appProperties.getPreference(key);
		if (intValue == null || !intValue.equals(value)) {
			appProperties.setInt(key, value);
			fireEvent(TiC.EVENT_CHANGE, null);
		}
	}

	@Kroll.method
	public void setString(String key, String value)
	{
		Object stringValue = appProperties.getPreference(key);
		if (stringValue == null || !stringValue.equals(value)) {
			appProperties.setString(key, value);
			fireEvent(TiC.EVENT_CHANGE, null);
		}
	}

	@Override
	public String getApiName()
	{
		return "Ti.App.Properties";
	}
}
