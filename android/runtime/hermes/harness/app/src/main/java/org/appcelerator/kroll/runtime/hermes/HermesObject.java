package org.appcelerator.kroll.runtime.hermes;

import org.appcelerator.kroll.KrollObject;

/** Harness version of the class that Phase 2 adds to the SDK. */
public class HermesObject extends KrollObject
{
	// The id of the native titanium::Proxy. It is not a memory address.
	private volatile long ptr;

	// Set by ReferenceTable.armReference(). The canary must be reachable from the proxy only.
	Object canary;

	public HermesObject(long ptr)
	{
		this.ptr = ptr;
	}

	public long getPointer()
	{
		return this.ptr;
	}

	public void setPointer(long ptr)
	{
		this.ptr = ptr;
	}

	public boolean fireEvent(String type, Object data)
	{
		return nativeFireEvent(this.ptr, null, 0, type, data, false, false, 0, null);
	}

	public Object callProperty(String name, Object[] args)
	{
		return nativeCallProperty(this.ptr, name, args);
	}

	public void setProperty(String name, Object value)
	{
		nativeSetProperty(this.ptr, name, value);
	}

	public static native void nativeInitObject(Class<?> proxyClass, Object proxyObject);
	protected native boolean nativeRelease(long ptr);
	private native Object nativeCallProperty(long ptr, String propertyName, Object[] args);
	private native void nativeSetProperty(long ptr, String name, Object value);
	private native boolean nativeFireEvent(long ptr, Object source, long sourcePtr, String event, Object data,
		boolean bubble, boolean reportSuccess, int code, String errorMessage);
	private native void nativeSetWindow(long ptr, Object windowProxyObject);
}
