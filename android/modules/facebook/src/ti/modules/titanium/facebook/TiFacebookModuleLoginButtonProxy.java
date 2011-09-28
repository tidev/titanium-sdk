/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.facebook;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;

@Kroll.proxy
public class TiFacebookModuleLoginButtonProxy extends TiViewProxy {
	private FacebookModule facebookModule = null;
	public TiFacebookModuleLoginButtonProxy() {
		super();
	}
	
	public TiFacebookModuleLoginButtonProxy(FacebookModule facebookModule)
	{
		this();
		Log.d("LoginButtonProxy", "Second constructor called");
		this.facebookModule = facebookModule;
	}

	@Override
	public TiUIView createView(Activity activity) {
		return new LoginButton(this);
	}
	
	public FacebookModule getFacebookModule() {
		return this.facebookModule;
	}
}
