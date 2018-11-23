package org.appcelerator.kroll.runtime.v8;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollPromise;

public class V8Promise extends V8Object implements KrollPromise
{
	public V8Promise(long resolver)
	{
		super(resolver);
	}

	@Override
	public void resolve(Object value)
	{
		nativeResolve(getPointer(), value);
	}

	@Override
	public void reject(Object value)
	{
		nativeReject(getPointer(), value);
	}

	@Override
	public void doRelease()
	{
		long resolverPointer = getPointer();
		if (resolverPointer == 0) {
			return;
		}

		nativeRelease(resolverPointer);
	}

	// JNI method prototypes
	private native void nativeResolve(long resolver, Object value);

	private native void nativeReject(long resolver, Object value);

	private native void nativeRelease(long resolver);
}
