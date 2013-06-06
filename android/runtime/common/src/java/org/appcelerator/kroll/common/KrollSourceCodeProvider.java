package org.appcelerator.kroll.common;

public interface KrollSourceCodeProvider
{
	String getSourceCode();

	/**
	 * Previously we supported only one CommonJS file
	 * packaged in a native module. We then added support
	 * for multiple CommonJS files.  We keep the above no-arg
	 * version for backward compatibility with modules that
	 * were created during the period when we only supported
	 * one file.
	 */
	String getSourceCode(String moduleid);
}