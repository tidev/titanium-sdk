package org.appcelerator.titanium.proxy;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;

import android.app.Instrumentation;
import android.os.Bundle;

@Kroll.proxy
public class InstrumentationProxy extends KrollProxy
{
	private Instrumentation instrumentation;

	public InstrumentationProxy(Instrumentation instrumentation)
	{
		this.instrumentation = instrumentation;
	}

	@Kroll.method
	public void finish(int resultCode)
	{
		instrumentation.finish(resultCode, new Bundle());
	}
}
