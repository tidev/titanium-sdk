package org.appcelerator.titanium.api;

import android.os.Bundle;

public interface ITitaniumNativeControl
{
	// Used externally
	public int addEventListener(String eventName, String listener);
	public void removeEventListener(String eventName, int listenerId);

	// Used internally
	public void open();
	public String getHtmlId();
	public void handleLayoutRequest(Bundle position);
	public void setOptions(String json);
}
