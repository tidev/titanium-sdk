package org.appcelerator.titanium.api;


public interface ITitaniumNetwork
{
	public ITitaniumHttpClient createHTTPClient();

	public int addEventListener(String eventName, String eventListener);
	public void removeEventListener(String eventName, int id);

	public String getUserAgent();
	public boolean isOnline();
	public String getNetworkTypeName();
	public int getNetworkType();
}
