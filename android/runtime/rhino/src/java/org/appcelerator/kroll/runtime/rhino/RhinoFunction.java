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
import org.appcelerator.kroll.common.AsyncResult;
import org.appcelerator.kroll.common.TiMessenger;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

import android.os.Handler;
import android.os.Message;
import android.util.Log;


/**
 * An implementation of KrollFunction for Rhino
 */
public class RhinoFunction implements KrollFunction, Handler.Callback
{
	private static final long serialVersionUID = 5260765490022979346L;

	private Function function;
	private Handler handler;

	protected static final int MSG_CALL_SYNC = 100;
	protected static final int MSG_LAST_ID = MSG_CALL_SYNC;

	public RhinoFunction(Function function)
	{
		this.function = function;
		handler = new Handler(TiMessenger.getRuntimeMessenger().getLooper(), this);
	}

	public void call(KrollObject krollObject, HashMap args)
	{
		call(krollObject, new Object[] { args });
	}

	public void call(KrollObject krollObject, Object[] args)
	{
		if (KrollRuntime.getInstance().isRuntimeThread())
		{
			callSync(krollObject, args);

		} else {
			TiMessenger.sendBlockingRuntimeMessage(handler.obtainMessage(MSG_CALL_SYNC), new FunctionArgs(krollObject, args));
		}
	}

	public void callSync(KrollObject krollObject, Object[] args)
	{
		RhinoObject rhinoObject = (RhinoObject) krollObject;
		Scriptable nativeObject = (Scriptable) rhinoObject.getNativeObject();

		Context context = Context.enter();
		context.setOptimizationLevel(-1);

		try {
			for (int i = 0; i < args.length; i++) {
				args[i] = TypeConverter.javaObjectToJsObject(args[i], nativeObject);
			}

			Scriptable parentScope = function.getParentScope();
			Scriptable scope = parentScope;
			boolean useWith = false;

			if (parentScope instanceof KrollWith.WithScope) {
				KrollWith.WithScope withScope = (KrollWith.WithScope) parentScope;
				Scriptable sandbox = withScope.getKrollWith().getPrototype();
				scope = KrollWith.enterWith(sandbox, RhinoRuntime.getGlobalScope());
				useWith = true;
			}

			function.call(context, scope, nativeObject, args);

			if (useWith) {
				KrollWith.leaveWith();
			}

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
		TiMessenger.postOnRuntime(new Runnable() {
			public void run()
			{
				call(krollObject, args);
			}
		});
	}

	public Function getFunction()
	{
		return function;
	}

	public boolean handleMessage(Message message)
	{
		switch (message.what) {
			case MSG_CALL_SYNC: {
				AsyncResult asyncResult = ((AsyncResult) message.obj);
				FunctionArgs functionArgs = (FunctionArgs) asyncResult.getArg();
				callSync(functionArgs.krollObject, functionArgs.args);
				asyncResult.setResult(null);

				return true;
			}
		}

		return false;
	}
}

