/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.rhino.modules;

import org.mozilla.javascript.BaseFunction;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;

import android.util.Log;

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

			try {
				return cx.evaluateString(scope, code, filename, 1, null);
			} catch (Throwable throwable) {
				if (displayError) {
					Log.e(TAG, "Error while executing " + filename + ": " + throwable.getMessage(), throwable);
				}
				Context.throwAsScriptRuntimeEx(throwable);
				return Undefined.instance;
			}
		}
	}

	@Override
	public String getClassName()
	{
		return TAG;
	}

}
