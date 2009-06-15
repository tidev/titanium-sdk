package org.appcelerator.titanium.api;


public interface ITitaniumGeolocation
{
	public void getCurrentPosition(String successListener, String failureListener, String options);
	public int watchPosition(String successListener, String failureListener, String options);
	public void clearWatch(int watchId);
}
