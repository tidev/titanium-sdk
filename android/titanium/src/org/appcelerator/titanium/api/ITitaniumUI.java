/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.api;

public interface ITitaniumUI
{
	public ITitaniumUserWindow createWindow();

	public ITitaniumMenuItem createMenu();
	public void setMenu(ITitaniumMenuItem menu);
	public ITitaniumMenuItem getMenu();

	public ITitaniumUserWindow getCurrentWindow();

	public ITitaniumDialog createOptionDialog();
	public ITitaniumDialog createAlertDialog();
	public ITitaniumProgressDialog createProgressDialog();

	public ITitaniumNotifier createNotification();

}
