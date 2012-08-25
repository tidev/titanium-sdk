/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.app.properties;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiProperties;

import ti.modules.titanium.app.AppModule;

@Kroll.module(parentModule=AppModule.class)
public class PropertiesModule extends KrollModule {

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
	public void setBool(String key, boolean value)
	{
		fireChange(key, value);
		appProperties.setBool(key, value);
		
	}

	@Kroll.method
	public void setDouble(String key, double value)
	{
		fireChange(key, value);
		appProperties.setDouble(key, value);
	}

	@Kroll.method
	public void setInt(String key, int value)
	{
		fireChange(key, value);
		appProperties.setInt(key, value);
	}

	@Kroll.method
	public void setString(String key, String value)
	{
		fireChange(key, value);
		appProperties.setString(key, value);
	}
	
	private boolean shouldFireChange(String key, Object newValue) 
	{
		if (!hasProperty(key)) {
			return true;
		}
		
		String newString = getString(key);
		//if newValue is null and the key's oldValue is a non-null String, we will remove the key
		//from our database so we need to fire change.
		if (newValue == null && newString != null) {
			return true;
		}

		Object oldValue = null;
		if (newValue instanceof String) {
			oldValue = newString;
		} else if (newValue instanceof Integer) {
			oldValue = getInt(key);
		} else if (newValue instanceof Double) {
			oldValue = getDouble(key);
		} else if (newValue instanceof Boolean) {
			oldValue = getBool(key);
		}
		
		if (oldValue != null && newValue != null && !oldValue.equals(newValue)) {
			return true;
		} else {
			return false;
		}
	}
	
	private void fireChange(String key, Object value)
	{
		if (shouldFireChange(key, value)) {
			fireEvent(TiC.EVENT_CHANGE, null);
		}
	}
}
