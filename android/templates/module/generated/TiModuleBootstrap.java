/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Warning: This file is GENERATED, and should not be modified
 */
package <%- moduleId %>;

import org.appcelerator.kroll.KrollExternalModule;

public class TiModuleBootstrap implements KrollExternalModule
{
	public void bootstrap()
	{
		nativeBootstrap();
	}

	private native void nativeBootstrap();
}
