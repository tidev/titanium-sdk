package org.appcelerator.titanium.api;

public interface ITitaniumModalPicker
{

	public int addEventListener(String eventName, String listener);
	public void removeEventListener(String eventName, int listenerId);

	public void show();
	public void hide();

	// used internally
	public void open();
}
