/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.view;

import org.appcelerator.titanium.proxy.DecorViewProxy;


public class TiUIDecorView extends TiUIView
{
	public TiUIDecorView(DecorViewProxy decorViewProxy)
	{
		super(decorViewProxy);

		setNativeView(decorViewProxy.getLayout());
	}
}