package org.appcelerator.titanium.api;

public interface ITitaniumSwitch extends ITitaniumNativeControl
{
	// Added in 0.7.0
	public void setValue(boolean value);
	public boolean getValue();
}
