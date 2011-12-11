/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.rhino;

import org.appcelerator.kroll.KrollRuntime;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.IdFunctionObject;
import org.mozilla.javascript.IdScriptableObject;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.Undefined;

import android.util.Log;

/**
 * The prototype that represents the global "kroll" object
 * used by the supporting Javascript in Titanium
 */
public class KrollGlobal extends IdScriptableObject
{
	private static final long serialVersionUID = 724917364689500034L;

	private static final String RUNTIME_RHINO = "rhino";
	private static final String DEPLOY_DEBUG = "DBG";
	private static boolean DBG = true;
	private static final String KROLL_TAG = "Kroll";

	public static Function init(Scriptable scope)
	{
		KrollGlobal kroll = new KrollGlobal();
		if (KrollRuntime.getInstance().getKrollApplication().getDeployType().equals("production")) {
			DBG = false;
		}
		return kroll.exportAsJSClass(MAX_PROTOTYPE_ID, scope, false);
	}

	private void log(Object[] args)
	{
		if (args.length < 2) {
			throw new IllegalArgumentException("kroll.log requires a tag and a message");
		}
		if (args[0] == null) {
			throw new IllegalArgumentException("tag must not be null");
		}

		Log.d(args[0].toString(), args[1] == null ? "null" : args[1].toString());
	}

	private Object binding(Context context, Scriptable scope, Object[] args)
	{
		if (args.length < 1) {
			throw new IllegalArgumentException("kroll.binding requires a binding name");
		}
		if (args[0] == null) {
			throw new IllegalArgumentException("binding must not be null");
		}

		return KrollBindings.getBinding(context, scope, args[0].toString());
	}

	private Object externalBinding(Context context, Scriptable scope, Object[] args)
	{
		if (args.length < 1) {
			throw new IllegalArgumentException("kroll.externalBinding requires a binding name");
		}
		if (args[0] == null) {
			throw new IllegalArgumentException("externalBinding must not be null");
		}

		return KrollBindings.getExternalBinding(context, scope, args[0].toString());
	}

	private void requireNative(Context context, Scriptable scope, Object[] args)
	{
		if (args.length < 1) {
			throw new IllegalArgumentException("kroll.requireNative requires a javascript source name");
		}

		String name = (String) args[0];
		//Scriptable scopeVars = (Scriptable) args[1];

		Object[] wrapperArgs = new Object[args.length - 1];
		System.arraycopy(args, 1, wrapperArgs, 0, args.length - 1);

		Object result = KrollBindings.requireNative(context, scope, name);
		if (result instanceof Function) {
			Function wrapper = (Function) result;
			wrapper.call(context, scope, scope, wrapperArgs);
		}
	}

// #string_id_map#
	private static final int
		Id_constructor = 1,
		Id_log = 2,
		Id_binding = 3,
		Id_externalBinding = 4,
		Id_requireNative = 5,
		MAX_PROTOTYPE_ID = Id_requireNative;

	@Override
	protected int findPrototypeId(String s)
	{
		int id = 0;
// #generated# Last update: 2011-11-17 23:44:15 CST
        L0: { id = 0; String X = null;
            L: switch (s.length()) {
            case 3: X="log";id=Id_log; break L;
            case 7: X="binding";id=Id_binding; break L;
            case 11: X="constructor";id=Id_constructor; break L;
            case 13: X="requireNative";id=Id_requireNative; break L;
            case 15: X="externalBinding";id=Id_externalBinding; break L;
            }
            if (X!=null && X!=s && !X.equals(s)) id = 0;
            break L0;
        }
// #/generated#
		return id;
	}
// #/string_id_map#

	@Override
	protected void initPrototypeId(int id)
	{
		String name;
		int arity;
		switch (id) {
			case Id_constructor:
				arity = 0; name = "constructor";
				break;
			case Id_log:
				arity = 2; name = "log";
				break;
			case Id_binding:
				arity = 1; name = "binding";
				break;
			case Id_externalBinding:
				arity = 1; name = "externalBinding";
				break;
			case Id_requireNative:
				arity = 2; name = "requireNative";
				break;
			default:
				super.initPrototypeId(id);
				return;
		}
		initPrototypeMethod(KROLL_TAG, id, name, arity);
	}

	@Override
	public Object execIdCall(IdFunctionObject f,
		Context cx, Scriptable scope, Scriptable thisObj, Object[] args)
	{
		if (!f.hasTag(KROLL_TAG)) {
			return super.execIdCall(f, cx, scope, thisObj, args);
		}

		int id = f.methodId();
		switch (id) {
			case Id_constructor:
				return new KrollGlobal();
			case Id_log:
				log(args);
				return Undefined.instance;
			case Id_binding:
				return binding(cx, scope, args);
			case Id_externalBinding:
				return externalBinding(cx, scope, args);
			case Id_requireNative:
				requireNative(cx, scope, args);
				return Undefined.instance;
			default:
				throw new IllegalArgumentException(String.valueOf(id));
		}
	}

	private static final int
		Id_runtime = 1,
		Id_debug = 2,
		MAX_INSTANCE_ID = Id_runtime;

	@Override
	protected int getMaxInstanceId()
	{
		return MAX_INSTANCE_ID;
	}


	@Override
	protected int findInstanceIdInfo(String name)
	{
		if ("runtime".equals(name)) {
			return Id_runtime;
		}
		if (DEPLOY_DEBUG.equals(name)) {
			return Id_debug;
		}
		return super.findInstanceIdInfo(name);
	}

	@Override
	protected String getInstanceIdName(int id)
	{
		switch (id) {
			case Id_runtime:
				return "runtime";
			case Id_debug:
				return DEPLOY_DEBUG;
		}
		return super.getInstanceIdName(id);
	}

	@Override
	protected Object getInstanceIdValue(int id)
	{
		switch (id) {
			case Id_runtime:
				return RUNTIME_RHINO;
			case Id_debug:
				return DBG;
		}
		return super.getInstanceIdValue(id);
	}

	@Override
	public String getClassName()
	{
		return KROLL_TAG;
	}
}
