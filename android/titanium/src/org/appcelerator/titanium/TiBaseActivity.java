package org.appcelerator.titanium;

import java.lang.ref.SoftReference;
import java.lang.ref.WeakReference;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.kroll.KrollCallback;
import org.appcelerator.titanium.proxy.ActivityProxy;
import org.appcelerator.titanium.proxy.MenuItemProxy;
import org.appcelerator.titanium.proxy.MenuProxy;
import org.appcelerator.titanium.proxy.TiWindowProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiActivityResultHandler;
import org.appcelerator.titanium.util.TiActivitySupport;
import org.appcelerator.titanium.util.TiActivitySupportHelper;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiPlatformHelper;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.util.TiWeakList;
import org.appcelerator.titanium.view.ITiWindowHandler;
import org.appcelerator.titanium.view.TiCompositeLayout;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.os.Messenger;
import android.os.RemoteException;
import android.view.KeyEvent;
import android.view.Menu;
import android.view.MenuItem;
import android.view.OrientationEventListener;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;

public class TiBaseActivity extends Activity 
	implements TiActivitySupport, ITiWindowHandler
{
	private static final String TAG = "TiBaseActivity";
	private static final boolean DBG = TiConfig.LOGD;

	protected TiCompositeLayout layout;
	protected TiActivitySupportHelper supportHelper;
	protected TiWindowProxy window;
	protected ActivityProxy activityProxy;
	protected SoftReference<ITiMenuDispatcherListener> softMenuDispatcher;
	protected boolean mustFireInitialFocus;
	protected Handler handler;
	protected TiWeakList<ConfigurationChangedListener> configChangedListeners = new TiWeakList<ConfigurationChangedListener>();
	protected OrientationEventListener orientationListener;
	protected int orientationDegrees;
	protected int orientationOverride = -1;
	protected MenuProxy menuProxy;

	public static interface ConfigurationChangedListener {
		public void onConfigurationChanged(TiBaseActivity activity, Configuration newConfig);
	}

	public TiApplication getTiApp() {
		return (TiApplication) getApplication();
	}

	public void setWindowProxy(TiWindowProxy proxy) {
		this.window = proxy;
		updateTitle();
		updateOrientation();
	}

	public void updateOrientation() {
		if (window == null) return;
		// This forces orientation so that it won't change unless it's allowed
		// when using the "orientationModes" property
		if (window.getOrientationModes().length > 0) {
			int orientation = getResources().getConfiguration().orientation;
			if (window.isOrientationMode(orientation)) {
				setRequestedOrientation(orientation);
			} else {
				setRequestedOrientation(TiUIHelper.convertToAndroidOrientation(window.getOrientationModes()[0]));
			}
		}
	}

	public void setActivityProxy(ActivityProxy proxy) {
		this.activityProxy = proxy;
	}

	public TiCompositeLayout getLayout() {
		return layout;
	}

	public void addConfigurationChangedListener(ConfigurationChangedListener listener) {
		configChangedListeners.add(new WeakReference<ConfigurationChangedListener>(listener));
	}

	public void removeConfigurationChangedListener(ConfigurationChangedListener listener) {
		configChangedListeners.remove(listener);
	}

	protected boolean getIntentBoolean(String property, boolean defaultValue) {
		Intent intent = getIntent();
		if (intent != null) {
			if (intent.hasExtra(property)) {
				return intent.getBooleanExtra(property, defaultValue);
			}
		}
		return defaultValue;
	}

	protected int getIntentInt(String property, int defaultValue) {
		Intent intent = getIntent();
		if (intent != null) {
			if (intent.hasExtra(property)) {
				return intent.getIntExtra(property, defaultValue);
			}
		}
		return defaultValue;
	}

	public void fireInitialFocus() {
		if (mustFireInitialFocus && window != null) {
			mustFireInitialFocus = false;
			window.fireEvent(TiC.EVENT_FOCUS, null);
		}
	}

	protected void updateTitle() {
		if (window == null) return;

		if (window.hasProperty(TiC.PROPERTY_TITLE)) {
			String oldTitle = (String) getTitle();
			String newTitle = TiConvert.toString(window.getProperty(TiC.PROPERTY_TITLE));
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

	// Subclasses can override to provide a custom layout
	protected TiCompositeLayout createLayout() {
		boolean vertical = getIntentBoolean(TiC.LAYOUT_VERTICAL, false);
		return new TiCompositeLayout(this, vertical);
	}

	// Subclasses can override to handle post-creation (but pre-message fire) logic
	protected void windowCreated() {
		boolean fullscreen = getIntentBoolean(TiC.PROPERTY_FULLSCREEN, false);
		boolean navbar = !getIntentBoolean(TiC.PROPERTY_NAV_BAR_HIDDEN, false);
		boolean modal = getIntentBoolean(TiC.PROPERTY_MODAL, false);
		int softInputMode = getIntentInt(TiC.PROPERTY_WINDOW_SOFT_INPUT_MODE, -1);
		boolean hasSoftInputMode = softInputMode != -1;

		if (!modal) {
			if (fullscreen) {
				getWindow().setFlags(
					WindowManager.LayoutParams.FLAG_FULLSCREEN,
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
			getWindow().setFlags(flags, flags);
		}

		if (hasSoftInputMode) {
			if (DBG) {
				Log.d(TAG, "windowSoftInputMode: " + softInputMode);
			}
			getWindow().setSoftInputMode(softInputMode);
		}
	}

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		if (DBG) {
			Log.d(TAG, "Activity onCreate");
		}

		// Doing this on every create in case the activity is externally created.
		TiPlatformHelper.intializeDisplayMetrics(this);

		orientationListener = new OrientationEventListener(this) {
			@Override
			public void onOrientationChanged(int orientation) {
				TiBaseActivity.this.onOrientationChanged(orientation);
			}
		};
		orientationListener.enable();

		layout = createLayout();
		super.onCreate(savedInstanceState);
		windowCreated();

		if (activityProxy != null) {
			activityProxy.fireEvent(TiC.EVENT_CREATE, null);
		}
		
		setContentView(layout);
		
		handler = new Handler();

		Messenger messenger = null;
		Integer messageId = null;
		Intent intent = getIntent();
		if (intent != null) {
			if (intent.hasExtra(TiC.INTENT_PROPERTY_MESSENGER)) {
				messenger = (Messenger) intent.getParcelableExtra(TiC.INTENT_PROPERTY_MESSENGER);
				messageId = intent.getIntExtra(TiC.INTENT_PROPERTY_MESSAGE_ID, -1);
			}
		}

		if (messenger != null) {
			final TiBaseActivity me = this;
			final Messenger fMessenger = messenger;
			final int fMessageId = messageId;
			handler.post(new Runnable() {
				@Override
				public void run() {
					if (fMessenger != null) {
						try {
							Message msg = Message.obtain();
							msg.what = fMessageId;
							msg.obj = me;
							fMessenger.send(msg);
							if (DBG) {
								Log.d(TAG, "Notifying Window, activity is created");
							}
						} catch (RemoteException e) {
							Log.e(TAG, "Unable to message creator. finishing.");
							me.finish();
						} catch (RuntimeException e) {
							Log.e(TAG, "Unable to message creator. finishing.");
							me.finish();
						}
					}
				}
			});
		}
	}

	public void setMenuDispatchListener(ITiMenuDispatcherListener dispatcher) {
		softMenuDispatcher = new SoftReference<ITiMenuDispatcherListener>(
			dispatcher);
	}

	protected TiActivitySupportHelper getSupportHelper() {
		if (supportHelper == null) {
			this.supportHelper = new TiActivitySupportHelper(this);
		}
		return supportHelper;
	}

	// Activity Support
	public int getUniqueResultCode() {
		return getSupportHelper().getUniqueResultCode();
	}

	public void launchActivityForResult(Intent intent, int code, TiActivityResultHandler resultHandler)
	{
		getSupportHelper().launchActivityForResult(intent, code, resultHandler);
	}

	@Override
	protected void onActivityResult(int requestCode, int resultCode, Intent data) {
		super.onActivityResult(requestCode, resultCode, data);
		getSupportHelper().onActivityResult(requestCode, resultCode, data);
	}

	@Override
	public void addWindow(View v, TiCompositeLayout.LayoutParams params) {
		layout.addView(v, params);
	}

	@Override
	public void removeWindow(View v) {
		layout.removeView(v);
	}

	@Override
	public boolean dispatchKeyEvent(KeyEvent event) 
	{
		boolean handled = false;
		if (window == null) {
			return super.dispatchKeyEvent(event);
		}
		switch(event.getKeyCode()) {
			case KeyEvent.KEYCODE_BACK : {
				if (window.hasListeners(TiC.EVENT_ANDROID_BACK)) {
					if (event.getAction() == KeyEvent.ACTION_UP) {
						window.fireEvent(TiC.EVENT_ANDROID_BACK, null);
					}
					handled = true;
				}
				break;
			}
			case KeyEvent.KEYCODE_CAMERA : {
				if (window.hasListeners(TiC.EVENT_ANDROID_CAMERA)) {
					if (event.getAction() == KeyEvent.ACTION_UP) {
						window.fireEvent(TiC.EVENT_ANDROID_CAMERA, null);
					}
					handled = true;
				}
				break;
			}
			case KeyEvent.KEYCODE_FOCUS : {
				if (window.hasListeners(TiC.EVENT_ANDROID_FOCUS)) {
					if (event.getAction() == KeyEvent.ACTION_UP) {
						window.fireEvent(TiC.EVENT_ANDROID_FOCUS, null);
					}
					handled = true;
				}
				break;
			}
			case KeyEvent.KEYCODE_SEARCH : {
				if (window.hasListeners(TiC.EVENT_ANDROID_SEARCH)) {
					if (event.getAction() == KeyEvent.ACTION_UP) {
						window.fireEvent(TiC.EVENT_ANDROID_SEARCH, null);
					}
					handled = true;
				}
				break;
			}
			case KeyEvent.KEYCODE_VOLUME_UP : {
				if (window.hasListeners(TiC.EVENT_ANDROID_VOLUP)) {
					if (event.getAction() == KeyEvent.ACTION_UP) {
						window.fireEvent(TiC.EVENT_ANDROID_VOLUP, null);
					}
					handled = true;
				}
				break;
			}
			case KeyEvent.KEYCODE_VOLUME_DOWN : {
				if (window.hasListeners(TiC.EVENT_ANDROID_VOLDOWN)) {
					if (event.getAction() == KeyEvent.ACTION_UP) {
						window.fireEvent(TiC.EVENT_ANDROID_VOLDOWN, null);
					}
					handled = true;
				}
				break;
			}
		}
			
		if (!handled) {
			handled = super.dispatchKeyEvent(event);
		}
		return handled;
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		boolean created = super.onCreateOptionsMenu(menu);
		KrollCallback onCreate = (KrollCallback) activityProxy.getProperty(TiC.PROPERTY_ON_CREATE_OPTIONS_MENU);
		KrollCallback onPrepare = (KrollCallback) activityProxy.getProperty(TiC.PROPERTY_ON_PREPARE_OPTIONS_MENU);
		if (onCreate != null) {
			KrollDict event = new KrollDict();
			if (menuProxy != null) {
				if (!menuProxy.getMenu().equals(menu)) {
					menuProxy.setMenu(menu);
				}
			} else {
				menuProxy = new MenuProxy(activityProxy.getTiContext(), menu);
			}
			event.put(TiC.EVENT_PROPERTY_MENU, menuProxy);
			onCreate.callSync(activityProxy.getTiContext(), new Object[] { event });
		}
		// If a callback exists then return true.
		// There is no need for the Ti Developer to support both methods.
		if (onCreate != null || onPrepare != null) {
			created = true;
		}
		return created;
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item) {
		MenuItemProxy mip = menuProxy.findItem(item);
		if (mip != null) {
			mip.fireEvent(TiC.EVENT_CLICK, null);
			return true;
		}
		return false;
	}

	@Override
	public boolean onPrepareOptionsMenu(Menu menu) {
		boolean prepared = super.onPrepareOptionsMenu(menu);
		KrollCallback onPrepare = (KrollCallback) activityProxy.getProperty(TiC.PROPERTY_ON_PREPARE_OPTIONS_MENU);
		if (onPrepare != null) {
			KrollDict event = new KrollDict();
			if (menuProxy != null) {
				if (!menuProxy.getMenu().equals(menu)) {
					menuProxy.setMenu(menu);
				}
			} else {
				menuProxy = new MenuProxy(activityProxy.getTiContext(), menu);
			}
			event.put(TiC.EVENT_PROPERTY_MENU, menuProxy);
			onPrepare.callSync(activityProxy.getTiContext(), new Object[] { event });
		}
		prepared = true;
		return prepared;
	}

	public int getOrientationDegrees() {
		return orientationDegrees;
	}

	public void overrideOrientation(int orientation) {
		// override the orientation until it's matched, then go back to detecting
		// this matches iPhone's behavior (hoop -> jump)
		orientationOverride = orientation;
		setRequestedOrientation(orientation);
	}

	protected void onOrientationChanged(int degrees) {
		// once setRequestedOrientation is called, onConfigurationChanged is no longer called
		// with new orientation changes from the OS. OrientationEventListener goes through
		// the SensorManager directly, and allows us to reset correctly
		orientationDegrees = degrees;
		if (degrees != OrientationEventListener.ORIENTATION_UNKNOWN) {
			if (window != null) {
				if (window.getOrientationModes().length > 0) {
					int currentOrientation;
					if (degrees >= 225 && degrees < 315) {
						// disable "landscape left", there's no way to forcefully set it
						//|| (degrees >= 45 && degrees < 135)) {
						currentOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE;
					} else {
						currentOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT;
					}
					
					if (orientationOverride != -1) {
						if (orientationOverride != currentOrientation) {
							return;
						} else {
							// the override has been be matched, switch it off to return to normal orientation tracking
							orientationOverride = -1;
						}
					}
					
					if (window.isOrientationMode(currentOrientation)) {
						setRequestedOrientation(currentOrientation);
					} else {
						setRequestedOrientation(TiUIHelper.convertToAndroidOrientation(window.getOrientationModes()[0]));
					}
				}
			}
		}
	}

	@Override
	public void onConfigurationChanged(Configuration newConfig) {
		super.onConfigurationChanged(newConfig);
		for (WeakReference<ConfigurationChangedListener> listener : configChangedListeners) {
			if (listener.get() != null) {
				listener.get().onConfigurationChanged(this, newConfig);
			}
		}
	}

	@Override
	protected void onPause() {
		super.onPause();
		if (DBG) {
			Log.d(TAG, "Activity onPause");
		}
		getTiApp().setWindowHandler(null);
		getTiApp().setCurrentActivity(this, null);
		if (activityProxy != null) {
			activityProxy.fireEvent(TiC.EVENT_PAUSE, null);
		}
	}

	@Override
	protected void onResume() {
		super.onResume();
		if (DBG) {
			Log.d(TAG, "Activity onResume");
		}

		getTiApp().setWindowHandler(this);
		getTiApp().setCurrentActivity(this, this);
		if (activityProxy != null) {
			activityProxy.fireEvent(TiC.EVENT_RESUME, null);
		}
	}

	@Override
	protected void onStart() {
		super.onStart();
		if (DBG) {
			Log.d(TAG, "Activity onStart");
		}
		updateTitle();
		
		if (window != null) {
			window.fireEvent(TiC.EVENT_FOCUS, null);
		} else {
			mustFireInitialFocus = true;
		}
		if (activityProxy != null) {
			activityProxy.fireEvent(TiC.EVENT_START, null);
		}
	}

	@Override
	protected void onStop() {
		super.onStop();
		if (DBG) {
			Log.d(TAG, "Activity onStop");
		}
		if (window != null) {
			window.fireEvent(TiC.EVENT_BLUR, null);
		}
		if (activityProxy != null) {
			activityProxy.fireEvent(TiC.EVENT_STOP, null);
		}
	}

	@Override
	protected void onDestroy() {
		super.onDestroy();
		if (orientationListener != null) {
			orientationListener.disable();
		}
		if (layout != null) {
			Log.e(TAG, "Layout cleanup.");
			layout.removeAllViews();
			layout = null;
		}
		
		if (window != null) {
			window.closeFromActivity();
			window = null;
		}
		if (menuProxy != null) {
			menuProxy.release();
			menuProxy = null;
		}
		if (activityProxy != null) {
			activityProxy.fireEvent(TiC.EVENT_DESTROY, null);
			activityProxy.release();
			activityProxy = null;
		}
		handler = null;
	}

	protected boolean shouldFinishRootActivity() {
		return getIntentBoolean(TiC.INTENT_PROPERTY_FINISH_ROOT, false);
	}
	
	@Override
	public void finish() {
		if (window != null) {
			KrollDict data = new KrollDict();
			window.fireEvent(TiC.EVENT_CLOSE, data);
		}

		boolean animate = getIntentBoolean(TiC.PROPERTY_ANIMATE, true);
		if (shouldFinishRootActivity()) {
			TiApplication app = getTiApp();
			if (app != null) {
				TiRootActivity rootActivity = app.getRootActivity();
				if (rootActivity != null) {
					rootActivity.finish();
				}
			}
		}

		super.finish();
		if (!animate) {
			TiUIHelper.overridePendingTransition(this);
		}
	}
}
