/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

public interface KrollEvaluator {
	/**
	 * Evaluate the given string's contents in the given context/scope
	 * @return The result of the evaluated string
	 */
	Object evaluateString(Object scope, String src, String sourceName);
}
