package org.appcelerator.titanium;


public interface TiProxyListener
{
	void propertyChanged(String key, Object oldValue, Object newValue, TiProxy proxy);
	void processProperties(TiDict d);

	void listenerAdded(String type, int count, TiProxy proxy);
	void listenerRemoved(String type, int count, TiProxy proxy);
}
