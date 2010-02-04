/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.kroll;

import java.io.IOException;

import org.appcelerator.titanium.TiEvaluator;

public class KrollBridge
	implements TiEvaluator
{

	private KrollContext kroll;
	private TitaniumObject titanium;

	public KrollBridge(KrollContext kroll)
	{
		this.kroll = kroll;
		initializeTitanium();
	}

	public Object evalFile(String filename)
		throws IOException
	{
		return kroll.evalFile(filename);
	}

	public Object evalJS(String src) {
		return kroll.eval(src);
	}

	public void fireEvent() {
	}

	private void initializeTitanium()
	{
		titanium = new TitaniumObject(kroll);
		kroll.put("Titanium", titanium);
		kroll.put("Ti", titanium);
	}
}
