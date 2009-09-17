/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.api;

public interface ITitaniumPicker extends ITitaniumNativeControl
{
	public void setData(String json);
	public void setColumnData(int col, String json);
	public int getSelectedRow(int col);
	public void selectRow(int col, int row, String json);
}
