/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.rhino.modules;

import org.appcelerator.kroll.runtime.rhino.KrollScriptRunner;
import org.appcelerator.kroll.runtime.rhino.RhinoRuntime;
import org.appcelerator.kroll.util.KrollAssetHelper;
import org.mozilla.javascript.BaseFunction;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.ScriptRuntime;
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
		try {
			return context.evaluateString(scope, source, path, 1, null);

		} catch (Throwable throwable) {
			if (displayError) {
				Log.e(TAG, "Error while executing " + path + ": " + throwable.getMessage(), throwable);
			}

			Context.throwAsScriptRuntimeEx(throwable);
			return Undefined.instance;
		}
	}

	private static Object runInSandbox(Context context, Scriptable sandbox, String path, String url)
	{
		Scriptable global = RhinoRuntime.getGlobalScope();
		Object result = Undefined.instance;

		ScriptableObject.putProperty(global, "sandbox", sandbox);
		Scriptable scope = ScriptRuntime.enterWith(sandbox, context, global);

		if (path.contains(".jar:")) {
			// this allows us to load pre-compiled js directly using a jar / classname
			// i.e. with an app ID of org.foo.app and a path of appdata://test.jar:org.foo.app.js.test
			// => loads org.foo.app.js.test from /mnt/sdcard/org.foo.app/test.jar
			String[] parts = path.split(":");
			result = runCompiledJar(context, scope, sandbox, parts[0], parts[1]);

		} else if (path.startsWith("Resources/")) {
			String source = KrollAssetHelper.readAsset(path);
			result = runSource(context, scope, source, url, true);

		} else {
			String source = KrollAssetHelper.readFile(path);
			result = runSource(context, scope, source, url, true);

		}

		ScriptRuntime.leaveWith(scope);
		return result;
	}

	private static class RunInThisContext extends BaseFunction
	{
		private static final long serialVersionUID = -8769143883638508052L;

		@Override
		public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args)
		{
			if (args.length < 2) {
				throw new IllegalArgumentException("runInThisContext requires 2 args: code, filename[, displayError]");
			}

			String code = (String) args[0];
			String filename = (String) args[1];

			boolean displayError = false;
			if (args.length > 2 && args[2] instanceof Boolean) {
				displayError = ((Boolean) args[2]).booleanValue();
			}

			return runSource(cx, RhinoRuntime.getGlobalScope(), code, filename, displayError);
		}
	}

	private static class RunInSandbox extends BaseFunction
	{

		private static final long serialVersionUID = -8831485691910010234L;

		@Override
		public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args)
		{
			if (args.length < 2) {
				throw new IllegalArgumentException("runCompiledInSandbox requires 2 args: url, sandbox");
			}

			String path = (String) args[0];
			String url = (String) args[1];
			Scriptable sandbox = (Scriptable) args[2];

			return runInSandbox(cx, sandbox, path, url);
		}
	}

	@Override
	public String getClassName()
	{
		return TAG;
	}

}
