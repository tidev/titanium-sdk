package org.appcelerator.kroll.runtime.v8;

public class V8Function
{
	private long handle;

	public V8Function(long handle)
	{
		this.handle = handle;
	}

	public void call()
	{
		nativeCall(handle);
	}

	private native void nativeCall(long handle);
}
