package org.appcelerator.titanium.api;

public interface ITitaniumTableView
{
	public void setData(String data);
	public void setRowHeight(String height);
	public void open(String json, String callback);
	public void close();
}
