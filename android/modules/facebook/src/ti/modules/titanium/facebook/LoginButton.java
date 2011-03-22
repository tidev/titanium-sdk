/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.facebook;

import java.io.InputStream;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import android.R;
import android.app.Activity;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.drawable.BitmapDrawable;
import android.util.StateSet;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.ImageButton;

public class LoginButton extends TiUIView implements TiFacebookStateListener
{
	private static final String LCAT = "TiLoginButton";
	private FacebookModule facebook = null;
	private boolean wide;

	public LoginButton(final TiViewProxy proxy) {
		super(proxy);
		initFacebook();
		ImageButton btn = new ImageButton(proxy.getContext()) {
			@Override
			protected void drawableStateChanged() {
				super.drawableStateChanged();
				int[] states = getDrawableState();
				if (StateSet.stateSetMatches(
						new int[] { R.attr.state_pressed }, states)
						|| StateSet.stateSetMatches(
								new int[] { R.attr.state_focused }, states)) {
					updateButtonImage(true);
				} else {
					updateButtonImage(false);
				}
			}
		};
		setNativeView(btn);
		btn.setBackgroundColor(Color.TRANSPARENT);
		updateButtonImage(false);
	}
	
	private void initFacebook()
	{
		this.facebook = ((TiFacebookModuleLoginButtonProxy)this.getProxy()).getFacebookModule();
	}

	protected void updateButtonImage(boolean pressed) {
		if (getProxy().getTiContext().isUIThread()) {
			handleUpdateButtonImage(pressed);
		} else {
			final boolean fPressed = pressed;
			getProxy().getTiContext().getActivity().runOnUiThread(new Runnable()
			{
				@Override
				public void run()
				{
					handleUpdateButtonImage(fPressed);
					
				}
			});
		}
	}

	private void handleUpdateButtonImage(boolean pressed)
	{
		boolean loggedIn = facebook.loggedIn();
		ImageButton btn = (ImageButton) getNativeView();
		if (btn == null) {
			return;
		}
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

		facebook.addListener(this);

		if (d.containsKey("style")) {
			String style = TiConvert.toString(d, "style");
			if (style.equals("wide")) {
				wide = true;
				updateButtonImage(false);
			}
		}
	}

	// TiFacebookStateListener implementation
	@Override
    public void login()
    {
		updateButtonImage(false);
    }
	@Override
    public void logout()
    {
		updateButtonImage(false);
    }

	@Override
	public void release()
	{
		super.release();
		if (facebook != null) {
			facebook.removeListener(this);
		}
	}

	@Override
	protected void setOnClickListener(View view)
	{
		if (view == nativeView) {
			final ImageButton btn = (ImageButton) view;
			btn.setOnClickListener(new OnClickListener() {
				public void onClick(View arg0) {
					Activity activity = null;
					if (btn.getContext() instanceof Activity) {
						activity = (Activity) btn.getContext();
					} else {
						Context context = getProxy().getContext();
						if (context instanceof Activity) {
							activity = (Activity) context;
						}
					}
					if (activity == null) {
						// Fallback on the root activity if possible
						if (getProxy().getTiContext() != null) {
							activity = getProxy().getTiContext().getRootActivity();
						}
					}
					if (facebook.loggedIn()) {
						facebook.executeLogout(activity);
					} else {
						facebook.executeAuthorize(activity);
					}
				}
			});
		}
	}
}
