package org.appcelerator.titanium.module.app;

import org.appcelerator.titanium.api.ITitaniumProperties;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Config;
import android.util.Log;

public class TitaniumProperties implements ITitaniumProperties
{
	private static final String LCAT = "TiAppProperties";
	private static final boolean DBG = Config.LOGD;

	SharedPreferences preferences;

	public TitaniumProperties(Context context, String name, boolean clear) {
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
		return preferences.getString(key,def);
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
		return (double)preferences.getFloat(key,(float)def);
	}
	public void setDouble(String key, double value)
	{
		if (DBG) {
			Log.d(LCAT,"setDouble called with key:"+key+", value:"+value);
		}

		SharedPreferences.Editor editor = preferences.edit();
		editor.putFloat(key,(float)value);
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
}