/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.kroll;

import java.io.IOException;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.KrollRootObject;
import org.appcelerator.titanium.TiEvaluator;
import org.mozilla.javascript.Scriptable;

public class KrollBridge implements TiEvaluator
{
	private KrollContext kroll;
	private KrollObject titanium;
	
	public KrollBridge(KrollContext kroll, KrollDict preload)
	{
		this.kroll = kroll;

		kroll.getTiContext().setJSContext(this);
		titanium = new KrollObject(new KrollRootObject(kroll.getTiContext()));
		kroll.put("Titanium", titanium);
		kroll.put("Ti", titanium);
		kroll.getTiContext().getTiApp().bootModules(kroll.getTiContext());

		/*kroll.put("setTimeout", (Scriptable) titanium.get("setTimeout", titanium));
		kroll.put("clearTimeout", (Scriptable) titanium.get("clearTimeout", titanium));
		kroll.put("setInterval", (Scriptable) titanium.get("setInterval", titanium));
		kroll.put("clearInterval", (Scriptable) titanium.get("clearInterval", titanium));
		kroll.put("alert", (Scriptable) titanium.get("alert", titanium));
		kroll.put("JSON", (Scriptable) titanium.get("JSON", titanium));
		kroll.put("require", (Scriptable) titanium.get("require", titanium));*/
		
		//TODO: userAgent and version

		if (preload != null) {
			KrollProxy uiModule;
			try {
				uiModule = (KrollProxy) titanium.getProxy().get(kroll.getScope(), "UI");
				for(String key : preload.keySet()) {
					/*KrollObject ko = new KrollObject(ui, preload.get(key));
					ui.superPut(key, ui, ko);*/
					uiModule.set(kroll.getScope(), key, preload.get(key));
				}
			} catch (NoSuchFieldException e1) {
				// TODO Auto-generated catch block
				e1.printStackTrace();
			}
			
			/*Object p = titanium.loadModule("UI");
			Scriptable root = kroll.getScope();
			Scriptable ti = (Scriptable) root.get("Ti", root);
			KrollObject ui = new KrollObject((KrollObject) ti, p);
			ti.put("UI", ti, ui);*/
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
	
	public KrollContext getKrollContext() {
		return kroll;
	}
	
	@Override
	public Scriptable getScope() {
		return kroll.getScope();
	}
	
	public KrollProxy getRootObject() {
		return titanium.getProxy();
	}
}
