package org.appcelerator.kroll;


public interface KrollEvaluator {
	/**
	 * Evaluate the given string's contents in the given context/scope
	 * @return The result of the evaluated string
	 */
	public Object evaluateString(Object scope, String src, String sourceName);
}
