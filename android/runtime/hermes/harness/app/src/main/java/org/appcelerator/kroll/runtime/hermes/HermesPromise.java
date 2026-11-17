package org.appcelerator.kroll.runtime.hermes;

/** Harness version of the class that Phase 2 adds to the SDK. */
public class HermesPromise extends HermesObject
{
	public HermesPromise()
	{
		super(nativeCreate());
	}

	public HermesPromise(long ptr)
	{
		super(ptr);
	}

	public void resolve(Object value)
	{
		nativeResolve(getPointer(), value);
	}

	public void reject(Object value)
	{
		nativeReject(getPointer(), value);
	}

	private static native long nativeCreate();
	private native void nativeResolve(long resolver, Object value);
	private native void nativeReject(long resolver, Object value);
	@Override
	protected native boolean nativeRelease(long resolver);
}
