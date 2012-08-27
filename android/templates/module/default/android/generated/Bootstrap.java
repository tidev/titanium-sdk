/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Warning: This file is GENERATED, and should not be modified
 */
package %(moduleId)s;

import org.appcelerator.kroll.KrollExternalModule;

public class %(className)sBootstrap implements KrollExternalModule
{
	public void bootstrap()
	{
		nativeBootstrap();
	}

	private native void nativeBootstrap();
}
