/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import org.appcelerator.titanium.io.TiBaseFile;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.EcmaError;
import org.mozilla.javascript.EvaluatorException;
import org.mozilla.javascript.Scriptable;

/**
 * A delegate that's responsible for evaluating JS in a Rhino Context
 */
public interface KrollEvaluator
{
	/**
	 * Evaluate the given file's contents in the given context/scope
	 * @return The result of the evaluated file
	 */
	public Object evaluateFile(Context context, Scriptable scope,
		TiBaseFile file, String filename, int lineNo, Object securityDomain);

	/**
	 * Evaluate the given string's contents in the given context/scope
	 * @return The result of the evaluated string
	 */
	public Object evaluateString(Context context, Scriptable scope,
		String src, String sourceName, int lineNo, Object securityDomain);

	/**
	 * Handle an ECMA syntax or reference error when evaluating
	 * @param error The error
	 */
	public void handleEcmaError(EcmaError error);

	/**
	 * Handle an Evaluator exception when evaluating
	 * @param ex The exception
	 */
	public void handleEvaluatorException(EvaluatorException ex);

	/**
	 * Handle a general exception when evaluating
	 * @param ex The exception
	 */
	public void handleException(Exception ex);
}
