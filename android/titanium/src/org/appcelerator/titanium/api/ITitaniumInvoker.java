package org.appcelerator.titanium.api;

public interface ITitaniumInvoker
{
	public void pushString(String s);
	public void pushObject(Object o);
	public void pushInteger(int i);
	public void pushDouble(double d);
	public void pushBoolean(boolean b);

	ITitaniumCheckedResult call(String name);
}
