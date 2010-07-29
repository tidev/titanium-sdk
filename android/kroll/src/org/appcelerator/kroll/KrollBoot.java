/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import java.io.File;
import java.io.FileReader;

import org.appcelerator.kroll.test.TestModule;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;


public class KrollBoot {
	public static void main (String args[]) throws Exception {
		
		try {
			Context c = Context.enter();
			Scriptable scope = c.initStandardObjects();
			
			File source = new File("js/app.js");
			FileReader reader = new FileReader(source);
			
			KrollProxyBindings.initBindings();
			
			KrollObject ti = new KrollObject(new KrollRootObject());
			TestModule test = new TestModule();
			test.bind(scope, ti.getProxy());
			
			ScriptableObject.putProperty(scope, "Ti", ti);
			
			Object wrappedOut = Context.javaToJS(System.out, scope);
			ScriptableObject.putProperty(scope, "out", wrappedOut);
			
			c.evaluateReader(scope, reader, source.getName(), 1, null);
		} finally {
			Context.exit();
		}
	}
}
