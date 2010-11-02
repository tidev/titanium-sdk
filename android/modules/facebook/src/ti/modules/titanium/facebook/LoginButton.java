/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.facebook;

import java.io.InputStream;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.kroll.KrollBridge;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.facebook.FBSession.FBSessionDelegate;
import android.R;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.drawable.BitmapDrawable;
import android.util.StateSet;
import android.view.View;
import android.view.Window;
import android.view.View.OnClickListener;
import android.widget.ImageButton;

public class LoginButton extends TiUIView {
	private static final String LCAT = "TiLoginButton";
	private static final boolean DBG = TiConfig.LOGD;

	private FBSession session;
	private FacebookModule facebook;
	private boolean wide;

	public LoginButton(final TiViewProxy proxy) {
		super(proxy);
		ImageButton btn = new ImageButton(proxy.getContext()) {
			@Override
			protected void drawableStateChanged() {
				super.drawableStateChanged();
				int[] states = getDrawableState();
				if (StateSet.stateSetMatches(
						new int[] { R.attr.state_pressed }, states)
						|| StateSet.stateSetMatches(
								new int[] { R.attr.state_focused }, states)) {
					updateButtonImage(facebook.isLoggedIn(), true);
				} else {
					updateButtonImage(facebook.isLoggedIn(), false);
				}
			}
		};
		btn.setBackgroundColor(Color.TRANSPARENT);
		btn.setOnClickListener(new OnClickListener() {
			public void onClick(View arg0) {
				if (facebook.isLoggedIn()) {
					facebook.executeLogout();
				} else {
					facebook.executeLogin();
				}
			}
		});
		setNativeView(btn);
		updateButtonImage(false, false);
	}

	protected void updateButtonImage(boolean loggedIn, boolean pressed) {
		ImageButton btn = (ImageButton) getNativeView();
		String path = "ti/modules/titanium/facebook/resources/log"
				+ (!loggedIn ? "in" : "out") + (wide && !loggedIn ? "2" : "")
				+ (pressed ? "_down" : "") + ".png";
		InputStream is = getClass().getClassLoader().getResourceAsStream(path);
		if (is == null) {
			Log.e(LCAT, "Error loading Facebook image from " + path);
			return;
		}
		Bitmap bitmap = TiUIHelper.createBitmap(is);
		btn.setImageDrawable(new BitmapDrawable(bitmap));
	}

	@Override
	public void processProperties(KrollDict d) {
		super.processProperties(d);

		KrollBridge bridge = (KrollBridge) getProxy().getTiContext().getJSContext();
		try {
			facebook = (FacebookModule) bridge.getRootObject().get(bridge.getScope(), "Facebook");
		} catch (NoSuchFieldException e) {}
		
		//facebook = (FacebookModule) TiModule.getModule("Facebook");
		if (facebook == null) {
			facebook = new FacebookModule(getProxy().getTiContext());
		}

		String apiKey = TiConvert.toString(d, "apikey");
		String secret = TiConvert.toString(d, "secret");
		String sessionProxy = TiConvert.toString(d, "sessionProxy");

		final KrollProxy proxy = getProxy();
		
		session = facebook.getOrCreateSession(apiKey, secret, sessionProxy);
		session.getDelegates().add(new FBSessionDelegate() 
		{
			@Override
		    public void sessionDidLogin(FBSession session, Long uid)
		    {
				Log.d(LCAT,"SESSION DID LOGIN");
				updateButtonImage(true, false);
				KrollDict event = new KrollDict();
				event.put("success", true);
				event.put("state", "login");
				proxy.fireEvent("login",event);
		    }
			@Override
		    public void sessionWillLogout(FBSession session, Long uid)
		    {
				Log.d(LCAT,"SESSION WILL LOGOUT");
				updateButtonImage(false, false);
		    }
			@Override
			public void sessionDidLogout(FBSession session)
			{
				Log.d(LCAT,"SESSION DID LOGOUT");
				KrollDict event = new KrollDict();
				event.put("success", true);
				event.put("state", "logout");
				proxy.fireEvent("logout",event);
			}
		});

		if (d.containsKey("style")) {
			String style = TiConvert.toString(d, "style");
			if (style.equals("wide")) {
				wide = true;
				updateButtonImage(session.isConnected(), false);
			}
		}

		if (!session.isConnected()) {
			session.resume(getWinContext());
		}
	}

	protected Context getWinContext() {
		Window w = getProxy().getTiContext().getRootActivity().getWindow();
		return w.getContext();
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue,
			KrollProxy proxy) {
		if (DBG) {
			Log.d(LCAT, "Property: " + key + " old: " + oldValue + " new: "
					+ newValue);
		}
		
		//FIXME
	}

}
