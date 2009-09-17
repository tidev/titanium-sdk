/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.api;

public interface ITitaniumResultSet
{

	public boolean isValidRow();
	public void next();
	public void close();
	public int getFieldCount();
	public int getRowCount();
	public String getFieldName(int index);
	public String getField(int index);
	public String getFieldByName(String fieldName);

	// Internal
	public String getLastException();
}
