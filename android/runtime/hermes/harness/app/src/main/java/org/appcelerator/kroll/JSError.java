package org.appcelerator.kroll;

import java.util.HashMap;

/** Harness stand-in. */
public class JSError extends Exception
{
	public JSError(String message)
	{
		super(message);
	}

	public HashMap<String, Object> getJSProperties()
	{
		HashMap<String, Object> properties = new HashMap<>();
		properties.put("code", 7);
		return properties;
	}
}
