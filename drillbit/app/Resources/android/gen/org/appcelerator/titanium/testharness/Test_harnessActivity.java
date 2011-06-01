package org.appcelerator.titanium.testharness;

import android.app.Instrumentation;
import android.os.Bundle;

import org.appcelerator.titanium.TiRootActivity;
import org.appcelerator.titanium.kroll.KrollBridge;
import org.appcelerator.titanium.drillbit.InstrumentedActivity;

public final class Test_harnessActivity extends TiRootActivity
	implements InstrumentedActivity
{
	protected Instrumentation instrumentation;

	@Override
	public void onCreate(Bundle savedInstanceState)
	{
		super.onCreate(savedInstanceState);
	}

	public void setInstrumentation(Instrumentation instrumentation)
	{
		this.instrumentation = instrumentation;

		// Our TiContext should hopefully be non-null at this point
		if (tiContext != null) {
			KrollBridge bridge = tiContext.getKrollBridge();
			if (bridge != null) {
				bridge.bindToTopLevel("TestHarnessRunner", instrumentation);
			}
		}
	}
}