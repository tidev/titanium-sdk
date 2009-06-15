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
}
