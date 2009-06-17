/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.api;

public interface ITitaniumProgressDialog
{
	enum Type {
		INDETERMINANT,
		DETERMINANT
	}
	enum Location {
		STATUS_BAR,
		DIALOG
	}
	public void setMessage(String message);
	public void setLocation(int location);
	public void setType(int type);
	public void setMin(int min);
	public void setMax(int max);
	public void setPosition(int pos);
	public void show();
	public void hide();
}
