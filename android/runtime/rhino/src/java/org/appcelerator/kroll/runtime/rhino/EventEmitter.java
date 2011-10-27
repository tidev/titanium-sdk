/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.rhino;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.IdFunctionObject;
import org.mozilla.javascript.IdScriptableObject;
import org.mozilla.javascript.Scriptable;

/**
 * A javascript object that supports listeners and event firing
 */
public class EventEmitter extends IdScriptableObject
{
	private static final long serialVersionUID = 4010452205917668011L;

	public static final String EVENT_EMITTER_TAG = "EventEmitter";
	private static EventEmitter prototype;

	public static void init(Scriptable scope)
	{
		EventEmitter prototype = getEventEmitterPrototype();

		IdFunctionObject constructor =
			prototype.exportAsJSClass(MAX_PROTOTYPE_ID, scope, false);

		scope.put(EVENT_EMITTER_TAG, scope, constructor);
	}

	public static EventEmitter getEventEmitterPrototype()
	{
		if (prototype == null) {
			prototype = new EventEmitter();
		}
		return prototype;
	}

// #string_id_map#
	private static final int
		Id_constructor = 1;

	protected static final int MAX_PROTOTYPE_ID = Id_constructor;

	@Override
	protected int findPrototypeId(String s)
	{
		int id = 0;
// #generated# Last update: 2011-10-12 12:41:38 CDT
        L0: { id = 0; String X = null;
            if (s.length()==11) { X="constructor";id=Id_constructor; }
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
				arity = 0;
				name = "constructor";
				break;
			default:
				super.initPrototypeId(id);
				return;
		}
		initPrototypeMethod(EVENT_EMITTER_TAG, id, name, arity);
	}

	@Override
	public Object execIdCall(IdFunctionObject f,
		Context cx, Scriptable scope, Scriptable thisObj, Object[] args)
	{
		if (!f.hasTag(EVENT_EMITTER_TAG)) {
			return super.execIdCall(f, cx, scope, thisObj, args);
		}

		int id = f.methodId();
		switch (id) {
			case Id_constructor:
				return new EventEmitter();
			default:
				throw new IllegalArgumentException(String.valueOf(id));
		}
	}

	protected Object getInstanceIdValue(int id, Scriptable start)
	{
		return NOT_FOUND;
	}

	@Override
	// Modified to pass the "start" object on to getInstanceIdValue
	public Object get(String name, Scriptable start)
	{
		int info = findInstanceIdInfo(name);
		if (info != 0) {
			int id = (info & 0xFFFF);
			Object value = getInstanceIdValue(id, start);
			if (value != NOT_FOUND) return value;
		}
		return super.get(name, start);
	}

	@Override
	public String getClassName()
	{
		return EVENT_EMITTER_TAG;
	}

}
