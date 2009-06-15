package org.appcelerator.titanium.api;

public interface ITitaniumNotifier
{
	public void setTitle(String title);
	public void setMessage(String message);
	public void setIcon(String iconUrl);
	public void setDelay(int delay);
	public void addEventListener(String eventName, String listener);
	public void show(boolean animate, boolean autohide);
	public void hide(boolean animate);
}
