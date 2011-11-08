/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.rhino;

import org.appcelerator.kroll.KrollProxySupport;
import org.appcelerator.kroll.KrollRuntime;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Script;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

import android.util.Log;

public class RhinoRuntime extends KrollRuntime
{
	private static final String TAG = "RhinoRuntime";

	private Scriptable globalScope;
	private Scriptable globalKrollObject;
	private Scriptable moduleObject;
	private Function runModuleFunction;

	@Override
	public void initRuntime()
	{
		Context context = Context.enter();
		context.setOptimizationLevel(-1);

		try {
			globalScope = context.initStandardObjects();
			bootstrap(context, globalScope);

		} finally {
			Context.exit();
		}
	}

	@Override
	public void doDispose()
	{
	}

	@Override
	public void doRunModule(String source, String filename, KrollProxySupport activityProxy)
	{
		Context context = Context.enter();
		context.setOptimizationLevel(-1);

		try {
			if (moduleObject == null) {
				moduleObject = (Scriptable) ScriptableObject.getProperty(globalScope, "Module");
				runModuleFunction = (Function) ScriptableObject.getProperty(moduleObject, "runModule");
			}

			runModuleFunction.call(context, globalScope, moduleObject, new Object[] { source, filename, activityProxy.getKrollObject().getNativeObject() });

		} finally {
			Context.exit();
		}
	}

	@Override
	public void initObject(KrollProxySupport proxy)
	{
		Context context = Context.enter();
		context.setOptimizationLevel(-1);

		try {
			Proxy rhinoProxy = ProxyFactory.createRhinoProxy(context, globalScope, proxy);
			proxy.setKrollObject(rhinoProxy.getRhinoObject());

		} finally {
			Context.exit();
		}
	}

	public static Scriptable getGlobalScope()
	{
		return ((RhinoRuntime) getInstance()).globalScope;
	}

	private void bootstrap(Context context, Scriptable scope)
	{
		Function krollConstructor = KrollGlobal.init(globalScope);
		globalKrollObject = krollConstructor.construct(context, globalScope, ScriptRuntime.emptyArgs);

		EventEmitter.init(globalKrollObject);
		GlobalSandbox.init(globalKrollObject);

		Script krollScript = KrollBindings.getJsBinding("kroll");
		Object result = krollScript.exec(context, globalScope);

		if (!(result instanceof Function)) {
			Log.e(TAG, "kroll.js result is not a function");

			return;
		}

		Function mainFunction = (Function) result;
		Object[] args = new Object[] { globalKrollObject };

		try {
			mainFunction.call(context, globalScope, globalScope, args);

		} catch (Exception e) {
			Log.e(TAG, "Caught exception while bootstrapping kroll: " + e.getMessage(), e);
		}
	}
}

