package org.appcelerator.kroll;

import java.lang.ref.WeakReference;
import java.util.HashMap;

/** Harness stand-in. */
public abstract class KrollObject
{
	protected WeakReference<Object> proxySupport;
	public final HashMap<String, Boolean> listeners = new HashMap<>();

	public void setProxySupport(Object proxy)
	{
		this.proxySupport = new WeakReference<>(proxy);
	}

	public void setHasListenersForEventType(String event, boolean hasListeners)
	{
		this.listeners.put(event, hasListeners);
	}

	public void onEventFired(String event, Object data)
	{
	}
}
