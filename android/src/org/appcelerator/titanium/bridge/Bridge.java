package org.appcelerator.titanium.bridge;

public abstract class Bridge
{
	protected String url;

	public Bridge() {

	}

	public abstract void boot(String Url /*TiProxy window*/);
	public abstract void gc();
	public abstract void shutdown();
}
