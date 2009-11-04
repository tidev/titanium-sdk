/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.api;

public interface ITitaniumTableView
{
	public void setData(String data);
	public void setRowHeight(String height);
	public void setCallback(String callback);

	// New in 0.6.0
	public void insertRowAfter(int index, String json);
	public void insertRowBefore(int index, String json);
	public void deleteRow(int index);
	public void updateRow(int index, String json);
	public int getIndexByName(String name);
	public int getRowCount();

	// New in 0.7.0
	public void appendRow(String rowData, String json);
	public void setFontWeight(String fontWeight);
	public void setFontSize(String fontSize);

	// New in 0.8.0
	public void scrollToIndex(int index, String options);
}
