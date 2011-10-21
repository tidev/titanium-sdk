/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.rhino;

import java.util.HashMap;

import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.runtime.rhino.Proxy.RhinoObject;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;


/**
 * An implementation of KrollFunction for Rhino
 */
public class RhinoFunction implements KrollFunction
{
	private Function function;


	public RhinoFunction(Function function)
	{
		this.function = function;
	}

	public void call(KrollObject krollObject, HashMap args)
	{
		call(krollObject, new Object[] { args });
	}

	public void call(KrollObject krollObject, Object[] args)
	{
		RhinoObject rhinoObject = (RhinoObject) krollObject;
		Scriptable nativeObject = (Scriptable) rhinoObject.getNativeObject();

		Context context = Context.enter();
		context.setOptimizationLevel(-1);

		try {
			for (int i = 0; i < args.length; i++) {
				args[i] = TypeConverter.javaObjectToJsObject(args[i], nativeObject);
			}

			function.call(context, function.getParentScope(), nativeObject, args);

		} finally {
			Context.exit();
		}
	}

	public void callAsync(KrollObject krollObject, HashMap args)
	{
		callAsync(krollObject, new Object[] { args });
	}

	public void callAsync(final KrollObject krollObject, final Object[] args)
	{
		KrollRuntime.getInstance().getRuntimeHandler().post(new Runnable() {
			public void run()
			{
				call(krollObject, args);
			}
		});
	}
}

