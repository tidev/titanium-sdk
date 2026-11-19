package org.appcelerator.kroll;

/** Harness stand-in. */
public class KrollException
{
	public final String message;
	public final String stack;

	public KrollException(String message, String stack)
	{
		this.message = message;
		this.stack = stack;
	}
}
