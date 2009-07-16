package org.appcelerator.titanium.api;

import android.os.Bundle;

public interface ITitaniumNativeControl
{
	// Used externally
	public void open(String json);
	public int addEventListener(String eventName, String listener);
	public void removeEventListener(String eventName, int listenerId);

	// Used internally
	public String getHtmlId();
	public void handleLayoutRequest(Bundle position);
	public void setOptions(String json);
}
