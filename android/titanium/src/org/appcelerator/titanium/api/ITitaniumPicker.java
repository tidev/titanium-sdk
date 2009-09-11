package org.appcelerator.titanium.api;

public interface ITitaniumPicker extends ITitaniumNativeControl
{
	public void setData(String json);
	public void setColumnData(int col, String json);
	public int getSelectedRow(int col);
	public void selectRow(int col, int row, String json);
}
