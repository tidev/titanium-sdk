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
		kroll.put("JSON", (Scriptable) titanium.get("JSON", titanium));
		kroll.put("require", (Scriptable) titanium.get("require", titanium));
		
		//TODO: userAgent and version

		if (preload != null) {
			Object p = titanium.loadModule("UI");
			Scriptable root = kroll.getScope();
			Scriptable ti = (Scriptable) root.get("Ti", root);
			KrollObject ui = new KrollObject((KrollObject) ti, p);
			ti.put("UI", ti, ui);

			for(String key : preload.keySet()) {
				KrollObject ko = new KrollObject(ui, preload.get(key));
				ui.superPut(key, ui, ko);
			}
		}
	}

	// objectName should be relative to "Titanium"
	public void bindToToplevel(String topLevelName, String[] objectName)
	{
		Scriptable o = titanium;
		for (int i = 0; i < objectName.length; i++) {
			o = (Scriptable) o.get(objectName[i], o);
			if (o == Scriptable.NOT_FOUND) {
				// this object doesn't exist
				return;
			}
		}

		kroll.put(topLevelName, o);
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
