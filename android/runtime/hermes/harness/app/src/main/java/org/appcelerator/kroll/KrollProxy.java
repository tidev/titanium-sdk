package org.appcelerator.kroll;

import java.util.HashMap;

/** Harness stand-in. Has only the members that the native runtime looks up. */
public class KrollProxy
{
	protected KrollObject krollObject;
	protected KrollProxyListener modelListener;
	public final HashMap<String, Object> changed = new HashMap<>();
	public Object[] creationArgs;
	public String creationUrl;

	public static KrollProxy createProxy(Class<? extends KrollProxy> proxyClass, KrollObject object,
		Object[] creationArguments, String creationUrl) throws Exception
	{
		KrollProxy proxy = proxyClass.getDeclaredConstructor().newInstance();
		proxy.krollObject = object;
		object.setProxySupport(proxy);
		proxy.creationArgs = creationArguments;
		proxy.creationUrl = creationUrl;
		return proxy;
	}

	public KrollObject getKrollObject()
	{
		return this.krollObject;
	}

	public Object getIndexedProperty(int index)
	{
		return index * 2;
	}

	public void setIndexedProperty(int index, Object value)
	{
		this.changed.put("index" + index, value);
	}

	public void onPropertyChanged(String name, Object value)
	{
		this.changed.put(name, value);
	}

	public void onPropertiesChanged(Object[][] changes)
	{
		for (Object[] change : changes) {
			this.changed.put((String) change[0], change[2]);
		}
	}
}
