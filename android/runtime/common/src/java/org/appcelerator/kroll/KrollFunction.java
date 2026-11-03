/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.util.HashMap;

/**
 * An interface that exposes a Javascript function to Java.
 */
public interface KrollFunction {
	class FunctionArgs
	{
		public KrollObject krollObject;
		public Object[] args;

		public FunctionArgs(KrollObject krollObject, Object[] args)
		{
			this.krollObject = krollObject;
			this.args = args;
		}
	}

	/**
	 * Executes a function synchronously. The result of call is the result of the Javascript function.
	 * @param krollObject The object that represents <code>this</code> in Javascript.
	 * @param args A single object argument for the function (for convenience)
	 * @return the result of the executed function.
	 */
	Object call(KrollObject krollObject, HashMap args);

	/**
	 * Executes a function synchronously. The result of call is the result of the Javascript function.
	 * @param krollObject The object that represents <code>this</code> in Javascript.
	 * @param args the function's arguments.
	 * @return the result of the executed function.
	 */
	Object call(KrollObject krollObject, Object[] args);

	/**
	 * Executes a function asynchronously.
	 * @param krollObject The object that represents <code>this</code> in Javascript.
	 * @param args A single object argument for the function (for convenience)
	 */
	void callAsync(KrollObject krollObject, HashMap args);

	/**
	 * Executes a function asynchronously.
	 * @param krollObject The object that represents <code>this</code> in Javascript.
	 * @param args the function's arguments.
	 */
	void callAsync(KrollObject krollObject, Object[] args);
}
