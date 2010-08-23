/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.lang.ref.SoftReference;
import java.lang.ref.WeakReference;
import java.util.ArrayList;

import org.appcelerator.titanium.proxy.TiWindowProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiActivityResultHandler;
import org.appcelerator.titanium.util.TiActivitySupport;
import org.appcelerator.titanium.util.TiActivitySupportHelper;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.ITiWindowHandler;
import org.appcelerator.titanium.view.TiCompositeLayout;

import android.app.Activity;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.os.Messenger;
import android.os.RemoteException;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;

public class TiActivity extends Activity
	implements TiActivitySupport, ITiWindowHandler
{
	private static final String LCAT = "TiActivity";
	private static final boolean DBG = TiConfig.LOGD;

	protected WeakReference<TiContext> createdContext;
	protected TiCompositeLayout layout;
	protected TiActivitySupportHelper supportHelper;
	protected TiWindowProxy proxy;

	protected Handler handler;
	protected ArrayList<WeakReference<TiContext>> contexts;
	protected SoftReference<ITiMenuDispatcherListener> softMenuDispatcher;
	protected boolean mustFireInitialFocus;

	public TiActivity() {
		super();
		contexts = new ArrayList<WeakReference<TiContext>>();
	}

    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState)
    {
//        super.onCreate(savedInstanceState);
    	if (DBG) {
    		Log.d(LCAT, "Activity onCreate");
    	}
        handler = new Handler();

        Intent intent = getIntent();

        boolean fullscreen = false;
        boolean navbar = true;
        boolean modal = false;
        Messenger messenger = null;
        Integer messageId = null;
        boolean vertical = false;
        boolean hasSoftInputMode = false;
        int softInputMode = -1;

        if (intent != null) {
        	if (intent.hasExtra("modal")) {
        		modal = intent.getBooleanExtra("modal", modal);
        	}
        	if (intent.hasExtra("fullscreen")) {
        		fullscreen = intent.getBooleanExtra("fullscreen", fullscreen);
        	}
        	if (intent.hasExtra("navBarHidden")) {
        		navbar = !intent.getBooleanExtra("navBarHidden", navbar);
        	}
        	if (intent.hasExtra("messenger")) {
        		messenger = (Messenger) intent.getParcelableExtra("messenger");
        		messageId = intent.getIntExtra("messageId", -1);
        	}
        	if (intent.hasExtra("vertical")) {
        		vertical = intent.getBooleanExtra("vertical", vertical);
        	}
        	if (intent.hasExtra("windowSoftInputMode")) {
        		hasSoftInputMode = true;
        		softInputMode = intent.getIntExtra("windowSoftInputMode", WindowManager.LayoutParams.SOFT_INPUT_ADJUST_UNSPECIFIED);
        	}
        }

        layout = new TiCompositeLayout(this, vertical);

        super.onCreate(savedInstanceState);
            
        if (!modal) {
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
        } else {
        	int flags = WindowManager.LayoutParams.FLAG_BLUR_BEHIND;
        	getWindow().setFlags(flags,flags);
        }
        
        if (hasSoftInputMode) {
        	if (DBG) {
        		Log.d(LCAT, "windowSoftInputMode: " + softInputMode);
        	}
        	getWindow().setSoftInputMode(softInputMode);
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
			        	} catch (RuntimeException e) {
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

    public TiCompositeLayout getLayout() {
    	return layout;
    }

	public void setMenuDispatchListener(ITiMenuDispatcherListener dispatcher) {
    	softMenuDispatcher = new SoftReference<ITiMenuDispatcherListener>(dispatcher);
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

	@Override
	public void addWindow(View v, TiCompositeLayout.LayoutParams params) {
		layout.addView(v, params);
	}

	@Override
	public void removeWindow(View v) {
		layout.removeView(v);
	}

	public void addTiContext(TiContext context) {
		if (!contexts.contains(context)) {
			contexts.add(new WeakReference<TiContext>(context));
		}
	}

	public void removeTiContext(TiContext context) {
		if (contexts.contains(context)) {
			contexts.remove(context);
		}
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu)
	{
		if (softMenuDispatcher != null) {
			ITiMenuDispatcherListener dispatcher = softMenuDispatcher.get();
			if (dispatcher != null) {
				return dispatcher.dispatchHasMenu();
			}
		}
		return super.onCreateOptionsMenu(menu);
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item) {
		if (softMenuDispatcher != null) {
			ITiMenuDispatcherListener dispatcher = softMenuDispatcher.get();
			if (dispatcher != null) {
				return dispatcher.dispatchMenuItemSelected(item);
			}
		}
		return super.onOptionsItemSelected(item);
	}

	@Override
	public boolean onPrepareOptionsMenu(Menu menu) {
		if (softMenuDispatcher != null) {
			ITiMenuDispatcherListener dispatcher = softMenuDispatcher.get();
			if (dispatcher != null) {
				return dispatcher.dispatchPrepareMenu(menu);
			}
		}
		return super.onPrepareOptionsMenu(menu);
	}


	@Override
	public void onConfigurationChanged(Configuration newConfig)
	{
		super.onConfigurationChanged(newConfig);

		for (WeakReference<TiContext> contextRef : contexts) {
			if (contextRef.get() != null) {
				contextRef.get().dispatchOnConfigurationChanged(newConfig);
			}
		}
	}

	@Override
	protected void onPause() {
		super.onPause();
		if (DBG) {
			Log.d(LCAT, "Activity onPause");
		}
		((TiApplication) getApplication()).setWindowHandler(null);
		((TiApplication) getApplication()).setCurrentActivity(this, null);

		for (WeakReference<TiContext> contextRef : contexts) {
			if (contextRef.get() != null) {
				contextRef.get().dispatchOnPause();
			}
		}
	}

	@Override
	protected void onResume() {
		super.onResume();
		if (DBG) {
			Log.d(LCAT, "Activity onResume");
		}
		((TiApplication) getApplication()).setWindowHandler(this);
		((TiApplication) getApplication()).setCurrentActivity(this, this);
		for (WeakReference<TiContext> contextRef : contexts) {
			if (contextRef.get() != null) {
				contextRef.get().dispatchOnResume();
			}
		}
	}

	@Override
	protected void onStart() {
		super.onStart();
		if (DBG) {
			Log.d(LCAT, "Activity onStart");
		}
		updateTitle();
		
		if (proxy != null) {
			proxy.fireEvent("focus", null);
		} else {
			mustFireInitialFocus = true;
		}

		for (WeakReference<TiContext> contextRef : contexts) {
			if (contextRef.get() != null) {
				contextRef.get().dispatchOnStart();
			}
		}
	}

	@Override
	protected void onStop() {
		super.onStop();
		if (DBG) {
			Log.d(LCAT, "Activity onStop");
		}
		if (proxy != null) {
			proxy.fireEvent("blur", null);
		}

		for (WeakReference<TiContext> contextRef : contexts) {
			if (contextRef.get() != null) {
				contextRef.get().dispatchOnStop();
			}
		}
	}

	@Override
	protected void onDestroy() {
		super.onDestroy();
		for (WeakReference<TiContext> contextRef : contexts) {
			TiContext ctx = contextRef.get();
			if (ctx != null) {
				ctx.dispatchOnDestroy();
				ctx.releaseKroll();
			}
		}
		if (layout != null) {
			Log.e(LCAT, "Layout cleanup.");
			layout.removeAllViews();
		}
		
		if (proxy != null) {
			proxy.closeFromActivity();
		}
	}

	@Override
	public void finish()
	{
		TiDict data = new TiDict();
		for (WeakReference<TiContext> contextRef : contexts) {
			if (contextRef.get() != null) {
				contextRef.get().dispatchEvent("close", data, proxy);
			}
		}

		if (createdContext != null && createdContext.get() != null) {
			createdContext.get().dispatchEvent("close", data, proxy);
		}

		boolean animate = true;
		Intent intent = getIntent();

		if (intent != null) {
			if (intent.getBooleanExtra("finishRoot", false)) {
				if (getApplication() != null) {
					TiApplication tiApp = getTiApp();
					if (tiApp != null) {
						TiRootActivity rootActivity = tiApp.getRootActivity();
						if (rootActivity != null) {
							rootActivity.finish();
						}
					}
				}
			}
			animate = intent.getBooleanExtra("animate", animate);
		}


		super.finish();
		if (!animate) {
			TiUIHelper.overridePendingTransition(this);
		}
	}

	public void setCreatedContext(TiContext context) {
		createdContext = new WeakReference<TiContext>(context);
	}

	public void setWindowProxy(TiWindowProxy proxy) {
		this.proxy = proxy;
		updateTitle();
	}

	public void fireInitialFocus() {
		if (mustFireInitialFocus && proxy != null) {
			mustFireInitialFocus = false;
			proxy.fireEvent("focus", null);
		}
	}
	
	protected void updateTitle() {
		if (proxy != null) {
			if (proxy.hasDynamicValue("title")) {
				String oldTitle = (String) getTitle();
				String newTitle = TiConvert.toString(proxy.getDynamicValue("title"));
				if (oldTitle == null) {
					oldTitle = "";
				}
				if (newTitle == null) {
					newTitle = "";
				}
				if (!newTitle.equals(oldTitle)) {
					final String fnewTitle = newTitle;
					runOnUiThread(new Runnable(){

						@Override
						public void run() {
							setTitle(fnewTitle);							
						}
					});
				}
			}
		}		
	}
}
