package org.appcelerator.kroll.runtime.hermes;

/** Harness version of the class that Phase 2 adds to the SDK. */
public class HermesFunction extends HermesObject
{
	public HermesFunction(long ptr)
	{
		super(ptr);
	}

	public Object call(HermesObject thisObject, Object[] args)
	{
		return nativeInvoke(thisObject.getPointer(), getPointer(), args);
	}

	public void release()
	{
		if (getPointer() != 0 && nativeRelease(getPointer())) {
			setPointer(0);
		}
	}

	private native Object nativeInvoke(long thisPointer, long functionPointer, Object[] functionArgs);
	@Override
	protected native boolean nativeRelease(long functionPointer);
}
