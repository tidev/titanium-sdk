/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.api;

public interface ITitaniumDB {
	public void close();
	public void remove();
	public ITitaniumResultSet execute(String sql, String[] args);
	public int getLastInsertRowId();
	public int getRowsAffected();

	// Internal
	public String getLastException();
	public void setStatementLogging(boolean enabled);
}
