package org.appcelerator.titanium.api;

public interface ITitaniumDatePicker extends ITitaniumNativeControl
{
	public static final int MODE_DATE = 0;
	public static final int MODE_TIME = 1;
	public static final int MODE_DATE_TIME = 2;

	public void setValue(long date, String options);
}
