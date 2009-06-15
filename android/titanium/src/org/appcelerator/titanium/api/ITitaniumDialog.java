package org.appcelerator.titanium.api;


public interface ITitaniumDialog {

	public void setTitle(String title);
	public void setMessage(String msg);
	public void addListener(String eventName, String listener);
	public void setButtons(String[] buttonText);
	public void setOptions(String[] optionText);
	public void show();
	//TODO add removeEventListener
}
