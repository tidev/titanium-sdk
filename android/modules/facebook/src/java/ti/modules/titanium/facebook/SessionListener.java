/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.facebook;

import org.appcelerator.titanium.util.Log;

import ti.modules.titanium.facebook.SessionEvents.AuthListener;
import ti.modules.titanium.facebook.SessionEvents.LogoutListener;

// Implementation of Facebook SessionEvents.AuthListener and SessionEvents.LogoutListener
public class SessionListener implements AuthListener, LogoutListener {
    private FacebookModule fbmod;
    public SessionListener(FacebookModule fbmod)
    {
    	this.fbmod = fbmod;
    }
    
    public void onAuthSucceed() {
    	fbmod.debug("onAuthSucceed");
    	fbmod.completeLogin();
    }

    public void onAuthFail(String error) {
    	Log.e(FacebookModule.LCAT, "onAuthFail: " + error);
    }
    
    public void onLogoutBegin() {
    	fbmod.debug("onLogoutBegin");
    }
    
    public void onLogoutFinish() {
    	fbmod.debug("onLogoutFinish");
        fbmod.completeLogout();
    }
}

