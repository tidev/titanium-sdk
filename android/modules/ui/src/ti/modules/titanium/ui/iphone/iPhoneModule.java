/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.iphone;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.Log;
import org.mozilla.javascript.Scriptable;

import ti.modules.titanium.ui.UIModule;

@Kroll.module(parentModule=UIModule.class)
public class iPhoneModule extends KrollProxy {

	private static final String LCAT = "iPhone";
	
	public iPhoneModule(TiContext tiContext) {
		super(tiContext);
	}
	
	@Override
	public Object get(Scriptable scope, String name)
			throws NoSuchFieldException {
		
		return new AnyProperty(getTiContext(), "UI.iPhone." + name);
	}

	// just stub out a warning for anyone trying to access the iPhone APIs in Android
	protected class AnyProperty extends KrollProxy {
		protected String name;
		public AnyProperty(TiContext context, String name) {
			super(context);
			this.name = name;
		}
		
		@Override
		public Object get(Scriptable scope, String name)
				throws NoSuchFieldException {
			Log.w(LCAT, this.name+"."+name+" property isn't supported on Android");
			return new AnyProperty(getTiContext(), this.name+"."+name);
		}
		
		@Override
		public String toString() {
			return "iphone only";
		}
	}
}
