package org.appcelerator.titanium.api;

import android.os.Bundle;

public interface ITitaniumNativeControl
{
	public String getHtmlId();
	public void handleLayoutRequest(Bundle position);
}
