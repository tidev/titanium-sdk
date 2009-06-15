package org.appcelerator.titanium.api;

public interface ITitaniumDatabase {
	public ITitaniumDB open(String name);

	// Internal
	public String getLastException();
}
