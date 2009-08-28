/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.api;

public interface ITitaniumUI
{
	// In 0.4.0
	public ITitaniumUserWindow createWindow();

	public ITitaniumMenuItem createMenu();
	public void setMenu(ITitaniumMenuItem menu);
	public ITitaniumMenuItem getMenu();

	public ITitaniumUserWindow getCurrentWindow();

	public ITitaniumDialog createOptionDialog();
	public ITitaniumDialog createAlertDialog();
	public ITitaniumProgressDialog createProgressDialog();

	public ITitaniumNotifier createNotification();

	// In 0.5.0
	public ITitaniumTableView createTableView();

	// In 0.6.0
	public ITitaniumButton createButton(String json);
	public ITitaniumSwitch createSwitch(String json);
	public ITitaniumSlider createSlider(String json);
	public ITitaniumText createTextArea(String json);
	public ITitaniumText createTextField(String json);
	public ITitaniumEmailDialog createEmailDialog();
	public ITitaniumUIWebView createWebView();

	// In 0.6.2
	public String getTabs();
	public String getTabByName(String tabName);
	public void setActiveTab(String tabInfo);
	public int addEventListener(String eventName, String eventListener);
	public void removeEventListener(String eventName, int listenerId);

	// In 0.6.3/1.0.0 not sure yet.
	public ITitaniumDatePicker createDatePicker(String json);
	public ITitaniumDatePicker createModalDatePicker(String json);
}
