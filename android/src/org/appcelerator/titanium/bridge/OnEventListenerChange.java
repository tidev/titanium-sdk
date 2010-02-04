package org.appcelerator.titanium.bridge;

import org.appcelerator.titanium.TiProxy;

public interface OnEventListenerChange
{
	void eventListenerAdded(String eventName, int count, TiProxy proxy);
	void eventListenerRemoved(String eventName, int count, TiProxy proxy);
}
