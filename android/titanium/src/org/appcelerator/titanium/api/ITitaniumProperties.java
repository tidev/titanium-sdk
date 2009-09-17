/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.api;

public interface ITitaniumProperties
{
	public String getString(String key, String def);
	public void setString(String key, String value);
	public int getInt(String key, int def);
	public void setInt(String key, int value);
	public double getDouble(String key, double def);
	public void setDouble(String key, double value);
	public boolean getBool(String key, boolean def);
	public void setBool(String key, boolean value);
	public String getList(String key, String def);
	public void setList(String key, String value);
	public boolean hasProperty(String key);
	public String listProperties();
	public void removeProperty(String key);
}
