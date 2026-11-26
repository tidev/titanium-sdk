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
		if (thisObject.getPointer() == 0) {
			// Hermes collected the JS object of the proxy. The proxy gets a new one.
			HermesObject renewed = thisObject.renew();
			if (renewed != null) {
				thisObject = renewed;
			}
		}
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
