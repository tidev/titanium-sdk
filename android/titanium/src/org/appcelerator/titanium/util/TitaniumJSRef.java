/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.util;

import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.titanium.api.ITitaniumJSRef;

public class TitaniumJSRef implements ITitaniumJSRef
{
	protected static AtomicInteger idGenerator = new AtomicInteger(0);

	protected int key;
	protected Object ref;

	public TitaniumJSRef(Object ref)
	{
		if (ref == null) {
			throw new IllegalArgumentException("Must have non-null object");
		}
		this.key = idGenerator.getAndIncrement();
		this.ref = ref;
	}

	public int getKey() {
		return key;
	}

	public Object get()
	{
		return ref;
	}
}
