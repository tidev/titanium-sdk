/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.rhino;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Scriptable;

/**
 * A general utility class for Rhino
 */
public class RhinoUtil
{
	public static Scriptable newObject()
	{
		Context context = Context.getCurrentContext();
		Scriptable scope = RhinoRuntime.getGlobalScope();

		return context.newObject(scope);
	}
}
