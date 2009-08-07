package org.appcelerator.titanium.api;

public interface ITitaniumTableView
{
	public void setData(String data);
	public void setRowHeight(String height);
	public void setIsRoot(boolean root);
	public void configure(String json, String callback);
	public void close();

	// New in 0.5.1
	public void insertRowAfter(int index, String json);
	public void insertRowBefore(int index, String json);
	public void deleteRow(int index);
	public void updateRow(int index, String json);
	public int getIndexByName(String name);
}
