/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.rhino;

import org.mozilla.javascript.BaseFunction;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

/**
 * A wrapper sandbox that delegates correctly to the global object
 *
 */
public class GlobalSandbox extends ScriptableObject
{
	private static final long serialVersionUID = -6159432408659287514L;

	private boolean putOnGlobalScope = false;

	public GlobalSandbox(Scriptable sandbox)
	{
		Object[] ids = sandbox.getIds();
		if (ids == null) {
			return;
		}

		for (Object id: ids) {
			if (id instanceof String) {
				String idStr = (String) id;
				putProperty(this, idStr, getProperty(sandbox, idStr));

			} else if (id instanceof Number) {
				int idNumber = ((Number) id).intValue();
				putProperty(this, idNumber, getProperty(sandbox, idNumber));
			}
		}

		putOnGlobalScope = true;
	}

	public static void init(Scriptable exports)
	{
		putProperty(exports, "createSandbox", new CreateSandbox());
	}

	private static class CreateSandbox extends BaseFunction
	{
		private static final long serialVersionUID = -906026675666729001L;

		@Override
		public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args)
		{
			return new GlobalSandbox((Scriptable) args[0]);
		}
	}

	@Override
	public void put(String name, Scriptable start, Object value)
	{
		if (putOnGlobalScope) {
			Scriptable global = RhinoRuntime.getGlobalScope();
			putProperty(global, name, value);
			return;
		}

		super.put(name, start, value);
	}

	@Override
	public String getClassName()
	{
		return "GlobalSandbox";
	}

}
