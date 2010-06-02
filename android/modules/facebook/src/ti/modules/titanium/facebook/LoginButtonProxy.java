/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.facebook;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;

public class LoginButtonProxy extends TiViewProxy {
	public LoginButtonProxy(TiContext tiContext, Object[] args) {
		super(tiContext, args);
	}

	@Override
	public TiUIView createView(Activity activity) {
		return new LoginButton(this);
	}
}
