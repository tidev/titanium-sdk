/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.rhino;

import org.appcelerator.kroll.KrollProxySupport;
import org.appcelerator.kroll.KrollRuntime;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.ContextFactory;
import org.mozilla.javascript.ErrorReporter;
import org.mozilla.javascript.EvaluatorException;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.RhinoException;
import org.mozilla.javascript.Script;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

import android.util.Log;

public class RhinoRuntime extends KrollRuntime implements ErrorReporter
{
	private static final String TAG = "RhinoRuntime";
	private static final String NAME = "rhino";

	private Scriptable globalScope;
	private Scriptable globalKrollObject;
	private Scriptable moduleObject;
	private Function runModuleFunction;
	private Context context;
	private static ErrorReporter errorReporter;

	@Override
	public void initRuntime()
	{
		context = Context.enter();
		context.setOptimizationLevel(-1);
		context.setErrorReporter(getErrorReporter());

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
		globalScope = null;
		globalKrollObject = null;
		moduleObject = null;
		runModuleFunction = null;
		errorReporter = null;

		EventEmitter.dispose();
		KrollBindings.dispose();
		KrollWith.dispose();
		Proxy.dispose();
		ProxyFactory.dispose();
	}

	@Override
	public void doRunModule(String source, String filename, KrollProxySupport activityProxy)
	{
		Context context = ((RhinoRuntime) KrollRuntime.getInstance()).enterContext();

		try {
			if (moduleObject == null) {
				moduleObject = (Scriptable) ScriptableObject.getProperty(globalScope, "Module");
				runModuleFunction = (Function) ScriptableObject.getProperty(moduleObject, "runModule");
			}

			runModuleFunction.call(context, globalScope, moduleObject, new Object[] { source, filename, activityProxy.getKrollObject().getNativeObject() });

		} catch (Exception e) {
			if (e instanceof RhinoException) {
				RhinoException re = (RhinoException) e;
				Context.reportRuntimeError(re.getMessage(), re.sourceName(), re.lineNumber(), re.lineSource(),
					re.columnNumber());
			} else {
				Context.reportError(e.getMessage());
			}
		} finally {
			Context.exit();
		}
	}

	@Override
	public Object doEvalString(String source, String filename)
	{
		Context context = enterContext();

		try {
			Object result = context.evaluateString(globalScope, source, filename, 1, null);
			return TypeConverter.jsObjectToJavaObject(result, globalScope);

		} catch (Exception e) {
			if (e instanceof RhinoException) {
				RhinoException re = (RhinoException) e;
				Context.reportRuntimeError(re.getMessage(), re.sourceName(), re.lineNumber(), re.lineSource(),
					re.columnNumber());

			} else {
				Context.reportError(e.getMessage());
			}
			return null;

		} finally {
			Context.exit();
		}
	}

	@Override
	public void initObject(KrollProxySupport proxy)
	{
		Context context = ((RhinoRuntime) KrollRuntime.getInstance()).enterContext();

		try {
			Proxy rhinoProxy = ProxyFactory.createRhinoProxy(context, globalScope, proxy);
			proxy.setKrollObject(rhinoProxy.getRhinoObject());

		} finally {
			Context.exit();
		}
	}

	// Enter the context for this runtime thread.
	// When done with context, just call Context.exit().
	public Context enterContext()
	{
		return ContextFactory.getGlobal().enterContext(context);
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

		KrollBindings.initJsBindings();

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

	public static ErrorReporter getErrorReporter()
	{
		if (errorReporter == null) {
			errorReporter = ((RhinoRuntime) getInstance());
		}
		return errorReporter;
	}

	@Override
	public void error(String message, String sourceName, int line, String lineSource, int lineOffset)
	{
		KrollRuntime.dispatchException("Error", message, sourceName, line, lineSource, lineOffset);
	}

	@Override
	public EvaluatorException runtimeError(String message, String sourceName, int line, String lineSource,
		int lineOffset)
	{
		KrollRuntime.dispatchException("Runtime Error", message, sourceName, line, lineSource, lineOffset);
		return new EvaluatorException(message, sourceName, line, lineSource, lineOffset);
	}

	@Override
	public String getRuntimeName()
	{
		return NAME;
	}

	@Override
	public void warning(String message, String sourceName, int line, String lineSource, int lineOffset)
	{
		// Don't show error dialog on warnings
	}
}
