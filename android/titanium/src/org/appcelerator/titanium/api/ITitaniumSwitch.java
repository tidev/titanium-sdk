package org.appcelerator.titanium.api;

public interface ITitaniumSwitch extends ITitaniumNativeControl
{
	// Added in 0.6.3
	public void setValue(boolean value);
	public boolean getValue();
}
