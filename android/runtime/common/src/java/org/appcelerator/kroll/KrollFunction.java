/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.util.HashMap;


public interface KrollFunction
{
	public class FunctionArgs
	{
		public KrollObject krollObject;
		public Object[] args;

		public FunctionArgs(KrollObject krollObject, Object[] args)
		{
			this.krollObject = krollObject;
			this.args = args;
		}
	}


	public Object call(KrollObject krollObject, HashMap args);
	public Object call(KrollObject krollObject, Object[] args);
	public void callAsync(KrollObject krollObject, HashMap args);
	public void callAsync(KrollObject krollObject, Object[] args);
}

