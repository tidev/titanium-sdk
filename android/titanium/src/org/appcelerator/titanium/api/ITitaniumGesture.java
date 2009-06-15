package org.appcelerator.titanium.api;

public interface ITitaniumGesture {
	public int addEventListener(String eventName, String listener);
	public void removeEventListener(String eventName, int listenerId);
}
