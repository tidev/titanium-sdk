/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.rhino.modules;

import org.appcelerator.kroll.KrollEvaluator;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.runtime.rhino.KrollScriptRunner;
import org.appcelerator.kroll.runtime.rhino.KrollWith;
import org.appcelerator.kroll.runtime.rhino.RhinoRuntime;
import org.appcelerator.kroll.util.KrollAssetHelper;
import org.mozilla.javascript.BaseFunction;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;

import android.util.Log;
import dalvik.system.DexClassLoader;

/**
 * A module that provides a node.js-like interface for running code in the current context from Javascript
 */
public class ScriptsModule extends ScriptableObject
{
	private static final long serialVersionUID = -7213547951904515855L;

	private static final String TAG = "ScriptsModule";

	public static void init(Scriptable exports)
	{
		putProperty(exports, "Script", new ScriptsModule());
	}

	public ScriptsModule()
	{
		putProperty(this, "runInThisContext", new RunInThisContext());
		putProperty(this, "runInSandbox", new RunInSandbox());
		putProperty(this, "createContext", new CreateContext());
		putProperty(this, "disposeContext", new BaseFunction());
	}

	private static Object runCompiledJar(Context context, Scriptable scope, Scriptable sandbox, String jarPath, String className)
	{
		String outputDir = KrollAssetHelper.getCacheDir();
		DexClassLoader loader = new DexClassLoader(jarPath, outputDir, null, ScriptsModule.class.getClassLoader());

		try {
			Class<?> scriptClass = loader.loadClass(className);
			return KrollScriptRunner.getInstance().runScript(context, scope, scriptClass);

		} catch (Throwable throwable) {
			Log.e(TAG, throwable.getMessage(), throwable);
			Context.throwAsScriptRuntimeEx(throwable);
		}

		return null;
	}

	private static Object runSource(Context context, Scriptable scope, String source, String path, boolean displayError)
	{
		KrollEvaluator evaluator = KrollRuntime.getInstance().getEvaluator();
		// Rhino raises an assertion exception if source happens to be null,
		// which can occur if an included file is empty, for example.
		if (source == null) {
			source = "";
		}

		try {
			if (evaluator != null) {
				return evaluator.evaluateString(scope, source, path);
			}

			return context.evaluateString(scope, source, path, 1, null);

		} catch (Throwable throwable) {
			if (displayError) {
				Log.e(TAG, "Error while executing " + path + ": " + throwable.getMessage(), throwable);
			}

			Context.throwAsScriptRuntimeEx(throwable);
			return Undefined.instance;
		}
	}

	private static Object runInSandbox(Context context, Scriptable scope, Scriptable sandbox, String path, String url, Scriptable global)
	{
		Object result = Undefined.instance;

		ScriptableObject.putProperty(global, "sandbox", sandbox);
		Scriptable executionScope = KrollWith.enterWith(sandbox, global);

		if (path.contains(".jar:")) {
			// this allows us to load pre-compiled js directly using a jar / classname
			// i.e. with an app ID of org.foo.app and a path of appdata://test.jar:org.foo.app.js.test
			// => loads org.foo.app.js.test from /mnt/sdcard/org.foo.app/test.jar
			String[] parts = path.split(":");
			result = runCompiledJar(context, executionScope, sandbox, parts[0], parts[1]);

		} else if (path.startsWith("Resources/")) {
			String source = KrollAssetHelper.readAsset(path);
			result = runSource(context, executionScope, source, url, true);

		} else {
			String source = KrollAssetHelper.readFile(path);
			result = runSource(context, executionScope, source, url, true);

		}

		KrollWith.leaveWith();

		return result;
	}

	private static class RunInThisContext extends BaseFunction
	{
		private static final long serialVersionUID = -8769143883638508052L;

		@Override
		public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args)
		{
			if (args.length < 2) {
				throw new IllegalArgumentException("runInThisContext requires 2 args: code, filename[, displayError, contextGlobal]");
			}

			String code = (String) args[0];
			String filename = (String) args[1];

			boolean displayError = false;
			if (args.length > 2 && args[2] instanceof Boolean) {
				displayError = ((Boolean) args[2]).booleanValue();
			}

			Scriptable contextGlobal = RhinoRuntime.getGlobalScope();
			if (args.length > 3 && args[3] instanceof ScriptableObject) {
				contextGlobal = (Scriptable) args[3];
			}

			return runSource(cx, contextGlobal, code, filename, displayError);
		}
	}

	private static class RunInSandbox extends BaseFunction
	{
		private static final long serialVersionUID = -8831485691910010234L;

		@Override
		public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args)
		{
			if (args.length < 4) {
				throw new IllegalArgumentException("runInSandbox requires 4 args: path, url, sandbox, global");
			}

			String path = (String) args[0];
			String url = (String) args[1];
			Scriptable sandbox = (Scriptable) args[2];
			Scriptable global = (Scriptable) args[3];

			return runInSandbox(cx, scope, sandbox, path, url, global);
		}
	}

	private static class CreateContext extends BaseFunction
	{
		private static final long serialVersionUID = 2562915206016408283L;

		@Override
		public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args)
		{
			if (args.length < 1) {
				throw new IllegalArgumentException("createContext requires 1 arg: contextGlobal");
			}

			Scriptable contextGlobal = (Scriptable) args[0];
			contextGlobal.setParentScope(null);
			cx.initStandardObjects((ScriptableObject) contextGlobal);

			return contextGlobal;
		}
	}

	@Override
	public String getClassName()
	{
		return TAG;
	}

}
