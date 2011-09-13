package org.appcelerator.kroll.runtime.v8;

public class V8Runtime
{
	public static native void init(String source);
	public static native void destroy();

	private V8Function callback;

	public void setCallback(long handle)
	{
		this.callback = new V8Function(handle);
	}

	public V8Function getCallback()
	{
		return this.callback;
	}
}
