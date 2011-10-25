/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.util.ArrayList;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiConfig;

import android.content.Context;
import android.content.SharedPreferences;

public class TiProperties
{
	private static final String LCAT = "TiProperties";
	public static boolean DBG = TiConfig.LOGD && false;

	SharedPreferences preferences;

	public TiProperties(Context context, String name, boolean clear) {
		preferences = context.getSharedPreferences(name,Context.MODE_PRIVATE);
		if (clear) {
			preferences.edit().clear().commit();
		}
	}

	public String getString(String key, String def)
	{
		if (DBG) {
			Log.d(LCAT,"getString called with key:"+key+", def:"+def);
		}

		if (!preferences.contains(key))
			return def;

		return preferences.getAll().get(key).toString();
	}

	public void setString(String key, String value)
	{
		if (DBG) {
			Log.d(LCAT,"setString called with key:"+key+", value:"+value);
		}
		SharedPreferences.Editor editor = preferences.edit();
		if (value==null)
		{
			editor.remove(key);
		}
		else
		{
			editor.putString(key,value);
		}
		editor.commit();
	}

	public int getInt(String key, int def)
	{
		if (DBG) {
			Log.d(LCAT,"getInt called with key:"+key+", def:"+def);
		}
		return preferences.getInt(key,def);
	}
	public void setInt(String key, int value)
	{
		if (DBG) {
			Log.d(LCAT,"setInt called with key:"+key+", value:"+value);
		}

		SharedPreferences.Editor editor = preferences.edit();
		editor.putInt(key,value);
		editor.commit();
	}
	public double getDouble(String key, double def)
	{
		if (DBG) {
			Log.d(LCAT,"getDouble called with key:"+key+", def:"+def);
		}
		if (!hasProperty(key)) {
			return def;
		}

		String stringValue = preferences.getString(key, "");
		try {
			return Double.parseDouble(stringValue);
		} catch (NumberFormatException e) {
			return def;
		}
	}
	public void setDouble(String key, double value)
	{
		if (DBG) {
			Log.d(LCAT,"setDouble called with key:"+key+", value:"+value);
		}
		
		SharedPreferences.Editor editor = preferences.edit();
		editor.putString(key,value + "");
		editor.commit();
	}
	public boolean getBool(String key, boolean def)
	{
		if (DBG) {
			Log.d(LCAT,"getBool called with key:"+key+", def:"+def);
		}
		return preferences.getBoolean(key,def);
	}
	public void setBool(String key, boolean value)
	{
		if (DBG) {
			Log.d(LCAT,"setBool called with key:"+key+", value:"+value);
		}

		SharedPreferences.Editor editor = preferences.edit();
		editor.putBoolean(key,value);
		editor.commit();
	}

	public String[] getList(String key, String def[])
	{
		if (DBG) {
			Log.d(LCAT,"getList called with key:"+key+", def:"+def);
		}

		int length = preferences.getInt(key+".length", -1);
		if (length == -1) {
			return def;
		}

		String list[] = new String[length];
		for (int i = 0; i < length; i++) {
			list[i] = preferences.getString(key+"."+i, "");
		}
		return list;
	}

	public void setList(String key, String[] value)
	{
		if (DBG) {
			Log.d(LCAT,"setList called with key:"+key+", value:"+value);
		}

		SharedPreferences.Editor editor = preferences.edit();
		for (int i = 0; i < value.length; i++)
		{
			editor.putString(key+"."+i, value[i]);
		}
		editor.putInt(key+".length", value.length);

		editor.commit();

	}

	public boolean hasListProperty(String key) {
		return hasProperty(key+".0");
	}
	
	public boolean hasProperty(String key)
	{
		return preferences.contains(key);
	}

	public String[] listProperties()
	{
		ArrayList<String> properties = new ArrayList<String>();
		for (String key : preferences.getAll().keySet())
		{
			if (key.endsWith(".length")) {
				properties.add(key.substring(0, key.length()-7));
			}
			else if (key.matches(".+\\.\\d+$")) {

			}
			else {
				properties.add(key);
			}
		}
		return properties.toArray(new String[properties.size()]);
	}

	public void removeProperty(String key)
	{
		if (preferences.contains(key)) {
			SharedPreferences.Editor editor = preferences.edit();
			editor.remove(key);
			editor.commit();
		}
	}
}
