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
