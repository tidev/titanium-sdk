package org.appcelerator.titanium.api;

public interface ITitaniumTableView
{
	public void setData(String data);
	public void setRowHeight(String height);
	public void setIsRoot(boolean root);
	public void setCallback(String callback);
	public void close();

	// New in 0.6.0
	public void insertRowAfter(int index, String json);
	public void insertRowBefore(int index, String json);
	public void deleteRow(int index);
	public void updateRow(int index, String json);
	public int getIndexByName(String name);
	public int getRowCount();

	// New in 0.6.3/1.0
	public void appendRow(String rowData, String json);
	public void setFontWeight(String fontWeight);
	public void setFontSize(String fontSize);
}
