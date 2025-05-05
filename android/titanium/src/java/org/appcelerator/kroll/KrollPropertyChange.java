/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

public class KrollPropertyChange
{
	protected String name;
	protected Object oldValue, newValue;

	public KrollPropertyChange(String name, Object oldValue, Object newValue)
	{
		this.name = name;
		this.oldValue = oldValue;
		this.newValue = newValue;
	}

	public void fireEvent(KrollProxy proxy, KrollProxyListener listener)
	{
		if (listener != null) {
			listener.propertyChanged(name, oldValue, newValue, proxy);
		}
	}

	public String getName()
	{
		return name;
	}

	public Object getOldValue()
	{
		return oldValue;
	}

	public Object getNewValue()
	{
		return newValue;
	}
}
