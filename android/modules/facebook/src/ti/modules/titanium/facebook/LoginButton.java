/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.facebook;

import java.io.InputStream;

import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.TiModule;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.facebook.FBSession;
import ti.modules.titanium.facebook.FBSession.FBSessionDelegate;

import android.R;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.drawable.BitmapDrawable;
import android.view.View;
import android.view.View.OnClickListener;
import android.view.Window;
import android.util.StateSet;
import android.view.KeyEvent;
import android.widget.ImageButton;
import android.content.Context;

public class LoginButton extends TiUIView
{
	private static final String LCAT = "TiLoginButton";
	private static final boolean DBG = TiConfig.LOGD;
	
	private FBSession session;
	private FacebookModule facebook;
	private boolean wide;
	
	public LoginButton(final TiViewProxy proxy) {
		super(proxy);
		ImageButton btn = new ImageButton(proxy.getContext())
		{
			@Override
		    protected void drawableStateChanged() 
			{
		        super.drawableStateChanged();
		        int[] states = getDrawableState();
		        if (StateSet.stateSetMatches(new int[] { R.attr.state_pressed }, states) || StateSet.stateSetMatches(new int[] { R.attr.state_focused }, states)) 
				{
					updateButtonImage(facebook.isLoggedIn(),true);
		        } 
				else 
				{
					updateButtonImage(facebook.isLoggedIn(),false);
		        }
		    }
		};
		btn.setBackgroundColor(Color.TRANSPARENT);
		btn.setOnClickListener(new OnClickListener() 
		{
			public void onClick(View arg0) 
			{
				//TODO: this will override listeners fix
				if (facebook.isLoggedIn()) 
				{
					new Thread() { 
						public void run ()
						{
							facebook.logout(null);
						}
					}.start();
				} 
				else 
				{
					facebook.login(null);
		        }
			}
       	});
		setNativeView(btn);
		updateButtonImage(false,false);
	}
	
	protected void updateButtonImage(boolean loggedIn, boolean pressed)
	{
		ImageButton btn = (ImageButton) getNativeView();
		String path = "ti/modules/titanium/facebook/resources/log" + (!loggedIn ? "in":"out") + (wide && !loggedIn ? "2" : "") + (pressed ? "_down":"") + ".png";
		InputStream is = getClass().getClassLoader().getResourceAsStream(path);
		if (is==null)
		{
			Log.e(LCAT,"Error loading Facebook image from "+path);
			return;
		}
		Bitmap bitmap = TiUIHelper.createBitmap(is);
		btn.setImageDrawable(new BitmapDrawable(bitmap));
	}
	

	@Override
	public void processProperties(TiDict d)
	{
		super.processProperties(d);

		ImageButton btn = (ImageButton) getNativeView();

		/*
		var fbButton = Titanium.Facebook.createLoginButton({
			'style':'wide',
			'apikey':'9494e611f2a93b8d7bfcdfa8cefdaf9f',
			'sessionProxy':'http://api.appcelerator.net/p/fbconnect/',
			bottom:30,
			height:30,
			width:300
		});*/
		
		facebook = (FacebookModule)TiModule.getModule("Facebook");
		if (facebook == null)
		{
			facebook = new FacebookModule(getProxy().getTiContext());
		}

		String apiKey = TiConvert.toString(d,"apikey");
		String secret = TiConvert.toString(d,"secret");
		String sessionProxy = TiConvert.toString(d,"sessionProxy");
		
		session = facebook.getOrCreateSession(apiKey,secret,sessionProxy);
		session.getDelegates().add(new FBSessionDelegate()
		{
	        protected void session_didLogin(FBSession session, Long uid) {
				updateButtonImage(true,false);
			}

	        protected void session_willLogout(FBSession session, Long uid) {
				updateButtonImage(false,false);
			}
		});

		if (d.containsKey("style"))
		{
			String style = TiConvert.toString(d,"style");
			if (style.equals("wide"))
			{
				wide = true;
				updateButtonImage(session.isConnected(),false);
			}
		}
		
		if (!session.isConnected())
		{
			session.resume(getWinContext());
		}
	}
	
	protected Context getWinContext()
	{
		Window w = getProxy().getTiContext().getRootActivity().getWindow();
		return w.getContext();
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, TiProxy proxy)
	{
		if (DBG) {
			Log.d(LCAT, "Property: " + key + " old: " + oldValue + " new: " + newValue);
		}
		
		//super.propertyChanged(key, oldValue, newValue, proxy);
		
		// TextView tv = (TextView) getNativeView();
		// if (key.equals("text")) {
		// 	tv.setText(TiConvert.toString(newValue));
		// 	tv.requestLayout();
		// } else if (key.equals("color")) {
		// 	tv.setTextColor(TiConvert.toColor((String) newValue));
		// } else if (key.equals("highlightedColor")) {
		// 	tv.setHighlightColor(TiConvert.toColor((String) newValue));
		// } else if (key.equals("textAlign")) {
		// 	setAlignment(tv, (String) newValue);
		// 	tv.requestLayout();
		// } else if (key.equals("font")) {
		// 	TiUIHelper.styleText(tv, (TiDict) newValue);
		// 	tv.requestLayout();
		// } else {
		// 	super.propertyChanged(key, oldValue, newValue, proxy);
		// }
	}

}
