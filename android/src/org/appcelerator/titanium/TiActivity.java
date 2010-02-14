/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiActivityResultHandler;
import org.appcelerator.titanium.util.TiActivitySupport;
import org.appcelerator.titanium.util.TiActivitySupportHelper;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.view.TitaniumCompositeLayout;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.os.Messenger;
import android.os.RemoteException;
import android.view.Window;
import android.view.WindowManager;

public class TiActivity extends Activity
	implements TiActivitySupport
{
	private static final String LCAT = "TiActivity";
	private static final boolean DBG = TiConfig.LOGD;

	protected TiContext tiContext;
	protected TitaniumCompositeLayout layout;
	protected TiActivitySupportHelper supportHelper;

	protected Handler handler;

	public TiActivity() {
		super();
	}

    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);
        handler = new Handler();

        layout = new TitaniumCompositeLayout(this);

        Intent intent = getIntent();

        boolean fullscreen = false;
        boolean navbar = true;
        Messenger messenger = null;
        Integer messageId = null;

        if (intent != null) {
        	if (intent.hasExtra("fullscreen")) {
        		fullscreen = intent.getBooleanExtra("fullscreen", fullscreen);
        	}
        	if (intent.hasExtra("navBarHidden")) {
        		navbar = intent.getBooleanExtra("navBarHidden", navbar);
        	}
        	if (intent.hasExtra("messenger")) {
        		messenger = (Messenger) intent.getParcelableExtra("messenger");
        		messageId = intent.getIntExtra("messageId", -1);
        	}
        }

        if (fullscreen) {
        	getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                    WindowManager.LayoutParams.FLAG_FULLSCREEN);
        }

        if (navbar) {
        	this.requestWindowFeature(Window.FEATURE_LEFT_ICON); // TODO Keep?
	        this.requestWindowFeature(Window.FEATURE_RIGHT_ICON);
	        this.requestWindowFeature(Window.FEATURE_PROGRESS);
	        this.requestWindowFeature(Window.FEATURE_INDETERMINATE_PROGRESS);
        } else {
           	this.requestWindowFeature(Window.FEATURE_NO_TITLE);
        }

        setContentView(layout);

        //Notify caller that onCreate is done. Use post
        // to prevent deadlock.
        final TiActivity me = this;
        final Messenger fMessenger = messenger;
        if (messenger != null) {
	        final int fMessageId = messageId;
	        handler.post(new Runnable(){
				@Override
				public void run() {
			        if (fMessenger != null) {
			        	try {
				        	Message msg = Message.obtain();
				        	msg.what = fMessageId;
				        	msg.obj = me;
				        	fMessenger.send(msg);
				        	Log.w(LCAT, "Notifying TiUIWindow, activity is created");
			        	} catch (RemoteException e) {
			        		Log.e(LCAT, "Unable to message creator. finishing.");
			        		me.finish();
			        	}
			        }
				}
			});
        }
    }

    public TiApplication getTiApp() {
    	return (TiApplication) getApplication();
    }

    public TitaniumCompositeLayout getLayout() {
    	return layout;
    }

	// Activity Support
	public int getUniqueResultCode() {
		if (supportHelper == null) {
			this.supportHelper = new TiActivitySupportHelper(this);
		}
		return supportHelper.getUniqueResultCode();
	}

	public void launchActivityForResult(Intent intent, int code, TiActivityResultHandler resultHandler)
	{
		if (supportHelper == null) {
			this.supportHelper = new TiActivitySupportHelper(this);
		}
		supportHelper.launchActivityForResult(intent, code, resultHandler);
	}

	@Override
	protected void onActivityResult(int requestCode, int resultCode, Intent data) {
		super.onActivityResult(requestCode, resultCode, data);

		supportHelper.onActivityResult(requestCode, resultCode, data);
	}

//	@Override
//	public void finish()
//	{
//		Intent intent = getIntent();
//		if (intent != null) {
//			if (intent.getBooleanExtra("finishRoot", false)) {
//				((TiApplication) getApplication()).getRootActivity().finish();
//			}
//		}
//		super.finish();
//	}
}
