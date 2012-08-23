/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.network.socket;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;

import ti.modules.titanium.network.NetworkModule;

@Kroll.module(parentModule=NetworkModule.class)
public class SocketModule extends KrollModule
{
	@Kroll.constant public static final int INITIALIZED = 1;
	@Kroll.constant public static final int CONNECTED = 2;
	@Kroll.constant public static final int LISTENING = 3;
	@Kroll.constant public static final int CLOSED = 4;
	@Kroll.constant public static final int ERROR = 5;

	public SocketModule()
	{
		super();
	}

	public SocketModule(TiContext tiContext)
	{
		this();
	}
}
