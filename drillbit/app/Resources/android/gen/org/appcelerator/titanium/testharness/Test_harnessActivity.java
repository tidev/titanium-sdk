package org.appcelerator.titanium.testharness;

import android.app.Activity;
import android.app.Instrumentation;
import android.util.Log;
import android.os.Bundle;

import org.appcelerator.titanium.TiRootActivity;
import org.appcelerator.titanium.kroll.KrollBridge;
import org.appcelerator.titanium.kroll.KrollContext;
import org.appcelerator.titanium.drillbit.InstrumentedActivity;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Scriptable;

public final class Test_harnessActivity extends TiRootActivity
	implements InstrumentedActivity
{
	private static final String TAG = "TestHarnessActivity";
	protected Instrumentation instrumentation;

	@Override
	public void onCreate(Bundle savedInstanceState)
	{
		super.onCreate(savedInstanceState);
	}

	protected boolean isDrillbitFinished(Scriptable global)
	{
		if (global == null) return false;

		Object drillbitTest = global.get("DrillbitTest", global);
		if (drillbitTest == null || drillbitTest.equals(Scriptable.NOT_FOUND)
			|| !(drillbitTest instanceof Scriptable))
		{
			Log.w(TAG, "DrillbitTest is not found");
			return false;
		}

		Scriptable drillbitTestJs = (Scriptable) drillbitTest;
		Object completed = drillbitTestJs.get("completed", drillbitTestJs);
		if (completed instanceof Boolean) {
			return ((Boolean)completed).booleanValue();
		}
		return false;
	}

	public void setInstrumentation(Instrumentation instrumentation)
	{
		this.instrumentation = instrumentation;

		// Our TiContext should hopefully be non-null at this point
		if (tiContext == null) {
			Log.w(TAG, "TiContext is null for test_harness activity, binding aborted");
			return;
		}

		KrollBridge bridge = tiContext.getKrollBridge();
		if (bridge == null) {
			Log.w(TAG, "KrollBridge is null for test_harness activity, binding aborted");
			return;
		}

		KrollContext krollContext = bridge.getKrollContext();
		if (krollContext == null) {
			Log.w(TAG, "KrollContext is null for test_harness activity, binding aborted");
			return;
		}

		Scriptable global = krollContext.getScope();

		Context context = Context.enter();
		context.setOptimizationLevel(-1);
		try {
			bridge.bindToTopLevel("TestHarnessRunner", Context.javaToJS(instrumentation, global));
		} finally {
			Context.exit();
		}

		// In some cases the drillbit test will finish executing
		// before the Instrumentation can be injected, so we need to double check
		if (isDrillbitFinished(global)) {
			Log.i(TAG, "Drillbit test suite finished early, shutting down.");
			instrumentation.finish(Activity.RESULT_OK, new Bundle());
		}
	}
}