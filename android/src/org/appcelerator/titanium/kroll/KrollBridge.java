/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.kroll;

import java.io.IOException;

import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiEvaluator;
import org.mozilla.javascript.Scriptable;

public class KrollBridge
	implements TiEvaluator
{

	private KrollContext kroll;
	private TitaniumObject titanium;

	public KrollBridge(KrollContext kroll, TiDict preload)
	{
		this.kroll = kroll;

		titanium = new TitaniumObject(kroll);
		kroll.put("Titanium", titanium);
		kroll.put("Ti", titanium);

		kroll.put("setTimeout", (Scriptable) titanium.get("setTimeout", titanium));
		kroll.put("clearTimeout", (Scriptable) titanium.get("clearTimeout", titanium));
		kroll.put("setInterval", (Scriptable) titanium.get("setInterval", titanium));
		kroll.put("clearInterval", (Scriptable) titanium.get("clearInterval", titanium));
		kroll.put("alert", (Scriptable) titanium.get("alert", titanium));

		if (preload != null) {
			titanium.loadModule("UI");
			Scriptable root = kroll.getScope();
			Scriptable ti = (Scriptable) root.get("Ti", root);
			KrollObject ui = (KrollObject) ti.get("UI", ti);

			for(String key : preload.keySet()) {
				KrollObject ko = new KrollObject(ui, preload.get(key));
				ui.superPut(key, ui, ko);
			}
		}
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
}
