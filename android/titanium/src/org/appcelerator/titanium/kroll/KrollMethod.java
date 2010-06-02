/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.kroll;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;

public class KrollMethod extends KrollObject implements Function
{
	private static final String LCAT = "KrollMethod";
	private static final boolean DBG = TiConfig.LOGD && false; //TODO remove false.

	private static final long serialVersionUID = 1L;

	public enum KrollMethodType {
		KrollMethodSetter,
		KrollMethodGetter,
		KrollMethodInvoke,
		KrollMethodFactory,
		KrollMethodPropertySetter,
		KrollMethodPropertyGetter,
		KrollMethodDynamic
	}

	protected Method method;
	protected KrollMethodType type;
	protected String methodName;

	public KrollMethod(KrollObject parent, Object target, Method method, KrollMethodType type) {
		this(parent, target, method, type, null);
	}

	public KrollMethod(KrollObject parent, Object target, Method method, KrollMethodType type, String methodName) {
		super(parent, target);
		this.method = method;
		this.type = type;
		this.methodName = methodName;
	}

	@Override
	public String getClassName() {
		return "KrollMethod";
	}


	public Object call(Context ctx, Scriptable scope, Scriptable thisObj, Object[] args) {
		Object result = null;
		Object[] newArgs = null;

		if (type == KrollMethodType.KrollMethodFactory) {
			newArgs = new Object[2];
			newArgs[0] = args;
			newArgs[1] = methodName;
			args = newArgs;
			newArgs = null;
		} else if (type == KrollMethodType.KrollMethodDynamic) {
			newArgs = new Object[args.length + 1];
			newArgs[0] = methodName;
			if (newArgs.length > 1) {
				newArgs[1] = args[0];
			}
			args = newArgs;
			newArgs = null;
		}

		try {
			if (method != null) {
				newArgs = argsForMethod(method, args, getKrollContext().getTiContext());

				if (method.getReturnType() == java.lang.Void.TYPE) {
					method.invoke(target, newArgs);
					result = getParentScope();
				} else {
					result = KrollObject.fromNative(method.invoke(target, newArgs), getKrollContext());
				}
			} else {
				result = KrollObject.fromNative(target, getKrollContext());
			}
		} catch (InvocationTargetException e) {
			for (int i = 0; i < newArgs.length; i++) {
				Log.e(LCAT, "Arg: " + i + " Type: " + (newArgs[i] != null ? newArgs[i].getClass().getName() : "null"));
			}
			Context.throwAsScriptRuntimeEx(e);
		} catch (IllegalAccessException e) {
			Context.throwAsScriptRuntimeEx(e);
		} catch (IllegalArgumentException e) {
			Log.e(LCAT, e.getMessage() + " for " + method.getName());
			for(Class<?> t : method.getParameterTypes()) {
				Log.e(LCAT, "Expected Type: " + t.getSimpleName());
			}
			for(Object o : newArgs) {
				Log.e(LCAT, "Presented Type: " + (o == null ? null : o.getClass().getSimpleName()));
			}
			Context.throwAsScriptRuntimeEx(e);
		}
		if (DBG) {
			Log.d(LCAT, "RESULT: " + ((result == null) ? "<null>" : result.toString()));
		}
		return result;
	}

	public Scriptable construct(Context cx, Scriptable scope, Object[] args) {
		return null;
	}

	@Override
	public boolean equals(Object obj) {
		KrollMethod km = (KrollMethod) obj;
		return method.equals(km.method);
	}
}
