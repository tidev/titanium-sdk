package com.nolanwright.kitchensink;

import org.appcelerator.titanium.TiApplication;

public class KitchensinkApplication extends TiApplication {

	@Override
	public void onCreate() {
		super.onCreate();
		
		appInfo = new KitchensinkAppInfo(this);
	}
}
