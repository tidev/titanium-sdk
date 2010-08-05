/**
 * 
 */
package ti.modules.titanium.android;

import java.io.IOException;
import java.util.concurrent.CountDownLatch;

import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.kroll.KrollBridge;
import org.appcelerator.titanium.kroll.KrollContext;
import org.appcelerator.titanium.kroll.KrollObject;
import org.appcelerator.titanium.kroll.TitaniumObject;
import org.appcelerator.titanium.proxy.TiActivityWindowProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIActivityWindow;
import org.mozilla.javascript.Scriptable;

import android.app.Activity;
import android.os.Bundle;

public abstract class TiBaseActivity extends Activity 
{
	private static final String LCAT = "TiBaseActivity";
	private static boolean DBG = TiConfig.LOGD;

	protected TiContext tiContext;
	protected String activitySource;
	protected TiCompositeLayout layout;
	protected ActivityProxy currentActivity;
	protected IntentProxy currentIntent;
	protected TiActivityWindowProxy currentWindow;
	
	private CountDownLatch jsLoadedLatch;

	protected TiBaseActivity() {
		
	}
	
	public TiBaseActivity(String activitySource) 
	{
		this.activitySource = activitySource; //Our app.js equivalent
	}

	@Override
	protected void onCreate(Bundle savedInstanceState) 
	{
		super.onCreate(savedInstanceState);
		
		if (activitySource == null) {
			throw new IllegalStateException("activitySource required.");
		}
		
		tiContext = TiContext.createTiContext(this, null, null); // TODO baseurl
		currentActivity = new ActivityProxy(tiContext, new Object[]{ this });
		currentIntent = new IntentProxy(tiContext, new Object[] {getIntent()});
		currentWindow = new TiActivityWindowProxy(tiContext, new Object[]{});
		
		//Bootstrap Android Module
		KrollBridge krollBridge = (KrollBridge) tiContext.getJSContext();
		final KrollContext kroll = krollBridge.getKrollContext();
		Scriptable root = kroll.getScope();
		TitaniumObject titanium = (TitaniumObject) root.get("Titanium", root);
		Object m = titanium.loadModule("Android");
		KrollObject android = new KrollObject((KrollObject) titanium, m);
		titanium.put("Android", titanium, android);
		android.superPut("currentActivity", android, new KrollObject(android, currentActivity));
		android.superPut("currentIntent", android, new KrollObject(android, currentIntent));

		// currentWindow
		m = titanium.loadModule("UI");
		KrollObject ui = new KrollObject((KrollObject) titanium, m);
		titanium.put("UI", titanium, ui);
		ui.superPut("currentWindow", ui, new KrollObject(ui, currentWindow));
		
		//TODO Activity L&F 

		layout = new TiCompositeLayout(this, false);

		setContentView(layout);
			
		TiUIActivityWindow win = new TiUIActivityWindow(currentWindow, this, layout);
		// Load "app.js"
		jsLoadedLatch = new CountDownLatch(1);
		new Thread(new Runnable(){

			@Override
			public void run() {
				try {
					if (DBG) {
						Log.i(LCAT, "eval " + activitySource);
					}
					tiContext.evalFile(activitySource);
				} catch (IOException e) {
					e.printStackTrace();
					finish();
				} finally {
					Log.i(LCAT, "Signal JS loaded");
					jsLoadedLatch.countDown(); //Release UI thread
				}
			}
		}).start();
		
		try {
			Log.i(LCAT, "About to wait for JS to load");
			jsLoadedLatch.await();
		} catch (InterruptedException e) {
			Log.w(LCAT, "Wait for JS Load interrupted.");
		}

		if (currentActivity.hasListeners("create")) {
			currentActivity.fireEvent("create", null);
		}

		win.open();
	}

	
	@Override
	protected void onStart() 
	{
		super.onStart();
		try {
			Log.i(LCAT, "About to wait for JS to load");
			jsLoadedLatch.await();
		} catch (InterruptedException e) {
			Log.w(LCAT, "Wait for JS Load interrupted.");
		}
Log.i(LCAT, "JSLOADED!!!!");
		if (currentActivity.hasListeners("start")) {
			currentActivity.fireEvent("start", null);
		}
	}

	@Override
	protected void onDestroy() 
	{
		super.onDestroy();
		if (currentActivity.hasListeners("destroy")) {
			currentActivity.fireEvent("destroy", null);
		}
		if (currentActivity != null) {
			currentActivity.release();
			currentActivity = null;
		}
	}

	@Override
	protected void onPause() 
	{
		super.onPause();
		if (currentActivity.hasListeners("pause")) {
			currentActivity.fireEvent("pause", null);
		}
		((TiApplication) getApplication()).setCurrentActivity(this, null);
	}

	@Override
	protected void onResume() 
	{
		super.onResume();
		((TiApplication) getApplication()).setCurrentActivity(this, this);

		if (currentActivity.hasListeners("resume")) {
			currentActivity.fireEvent("resume", null);
		}
	}

	@Override
	protected void onStop() {
		super.onStop();
		if (currentActivity.hasListeners("stop")) {
			currentActivity.fireEvent("stop", null);
		}

	}	
}
