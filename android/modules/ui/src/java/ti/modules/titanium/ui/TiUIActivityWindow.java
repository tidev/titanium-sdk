/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.util.HashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiActivity;
import org.appcelerator.titanium.TiActivityWindow;
import org.appcelerator.titanium.TiActivityWindows;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiMessageQueue;
import org.appcelerator.titanium.TiModalActivity;
import org.appcelerator.titanium.TiTranslucentActivity;
import org.appcelerator.titanium.proxy.ActivityProxy;
import org.appcelerator.titanium.proxy.TiWindowProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiCompositeLayout.LayoutArrangement;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.content.Intent;
import android.graphics.drawable.Drawable;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.os.Messenger;
import android.os.RemoteException;
import android.view.View;
import android.view.View.OnFocusChangeListener;
import android.view.ViewGroup.LayoutParams;
import android.view.Window;

public class TiUIActivityWindow extends TiUIView
	implements Handler.Callback, TiActivityWindow
{
	private static final String LCAT = "TiUIActivityWindow";
	private static final boolean DBG = TiConfig.LOGD;

	private static final int MSG_ACTIVITY_CREATED = 1000;
	private static final int MSG_ANIMATE = 100;

	private static final String WINDOW_ID_PREFIX = "window$";

	protected String activityKey;
	protected Activity windowActivity;
	protected String windowUrl;
	protected int windowId;

	protected boolean animate;
	protected Handler handler;

	protected Messenger messenger;
	protected int messageId;
	protected int lastWidth, lastHeight;

	private static AtomicInteger idGenerator;

	public TiUIActivityWindow(ActivityWindowProxy proxy, KrollDict options, Messenger messenger, int messageId)
	{
		super(proxy);
		animate = true;
		//proxy.setModelListener(this);
		if (idGenerator == null) {
			idGenerator = new AtomicInteger(0);
		}
		this.messenger = messenger;
		this.messageId = messageId;
		this.handler = new Handler(Looper.getMainLooper(), this);

		this.lastWidth = LayoutParams.FILL_PARENT;
		this.lastHeight = LayoutParams.FILL_PARENT;

		createNewActivity(options);
		TiActivityWindows.addWindow(this);
	}

	public TiUIActivityWindow(ActivityWindowProxy proxy, TiBaseActivity activity)
	{
		this(proxy, activity, null, -1);
	}

	public TiUIActivityWindow(ActivityWindowProxy proxy, TiBaseActivity activity, Messenger messenger, int messageId)
	{
		super(proxy);
		windowActivity = activity;

		if (idGenerator == null) {
			idGenerator = new AtomicInteger(0);
		}

		this.messenger = messenger;
		this.messageId = messageId;
		this.handler = new Handler(Looper.getMainLooper(), this);

		this.lastWidth = LayoutParams.FILL_PARENT;
		this.lastHeight = LayoutParams.FILL_PARENT;

		proxy.setActivity(activity);
		proxy.setModelListener(this);
		handleBooted();
	}

	/*protected void initContext()
	{
		TiContext proxyContext = proxy.getTiContext();
		KrollDict urlPropertyHolder = resolver.findProperty(TiC.PROPERTY_URL);
		boolean hasUrl = (urlPropertyHolder != null);
		if (newActivity) {
			windowId = TiActivityWindows.addWindow(this);
		}
		ActivityProxy activityProxy = null;
		// if url, create a new context.
		if (hasUrl) {
			String url = TiConvert.toString(urlPropertyHolder, TiC.PROPERTY_URL);
			String baseUrl = proxyContext.getBaseUrl();
			TiUrl tiUrl = TiUrl.normalizeWindowUrl(baseUrl, url);
			windowUrl = tiUrl.url;
			Activity activity = null;
			if (!newActivity) {
				activity = windowActivity;
				if (activity == null) {
					activity = proxyContext.getActivity();
				}
			}
			windowContext = TiContext.createTiContext(activity, tiUrl.baseUrl, tiUrl.url);
			newContext = true;
			// if LW window, use the existing activityProxy from the activity rather than
			// creating a new one which will cause the listeners on the duplicate activityProxy
			// to not fire
			if (!newActivity) {
				if (activity instanceof TiBaseActivity) {
					activityProxy = ((TiBaseActivity)activity).getActivityProxy();
				}
			}
		} else if (!lightWeight) {
			windowContext = TiContext.createTiContext(windowActivity, proxyContext.getBaseUrl(), proxyContext.getCurrentUrl());
			newContext = true;
		}
		if (windowActivity != null || hasUrl) {
			if (activityProxy == null) {
				activityProxy = ((TiWindowProxy) proxy).getActivity(windowContext);
			}
			TiBindingHelper.bindCurrentWindowAndActivity(windowContext, proxy, activityProxy);
			if (windowActivity != null) {
				bindWindowActivity(windowContext, windowActivity);
				bindProxies();
			}
		} else {
			Activity proxyActivity = proxyContext.getActivity();
			bindWindowActivity(proxyContext, proxyActivity);

			// set this so that if the LW window is created on top of the root activity 
			// it can still be accessed via the activity
			if (lightWeight)
			{
				if (proxyActivity instanceof TiBaseActivity)
				{
					((TiBaseActivity)proxyActivity).lwWindow = (TiWindowProxy)proxy;
				}
			}
		}
		if (!newActivity && !lightWeight) {
			proxy.switchContext(windowContext);
		}
	}*/

	protected void createNewActivity(HashMap options)
	{
		Activity activity = proxy.getActivity();
		Intent intent = createIntent(activity);
		Object animated = options.get(TiC.PROPERTY_ANIMATED);
		if (animated != null) {
			animate = TiConvert.toBoolean(animated);
		}
		if (!animate) {
			intent.addFlags(Intent.FLAG_ACTIVITY_NO_ANIMATION);
			intent.putExtra(TiC.PROPERTY_ANIMATE, false);
			activity.startActivity(intent);
			TiUIHelper.overridePendingTransition(activity);
		} else {
			activity.startActivity(intent);
		}
	}

	public void windowCreated(TiBaseActivity activity)
	{
		windowActivity = activity;
		proxy.setActivity(activity);

		// TODO bindWindowActivity(windowActivity);
		bindProxies();
		TiMessageQueue.getMainMessageQueue().stopBlocking();
	}

	protected ActivityProxy bindWindowActivity(Activity activity)
	{
		ActivityProxy activityProxy = null;
		if (activity instanceof TiBaseActivity) {
			activityProxy = ((TiBaseActivity)activity).getActivityProxy();
		}
		if (activityProxy == null) {
			activityProxy = ((TiWindowProxy) proxy).getActivityProxy();
			activityProxy.setWrappedActivity(activity);
			if (activity instanceof TiBaseActivity) {
				((TiBaseActivity)activity).setActivityProxy(activityProxy);
			}
		}
		return activityProxy;
	}

	protected void bindProxies()
	{
		if (windowActivity instanceof TiBaseActivity) {
			TiBaseActivity tiActivity = (TiBaseActivity)windowActivity;
			TiWindowProxy windowProxy = (TiWindowProxy)proxy;
			tiActivity.setActivityProxy(windowProxy.getActivityProxy());
			tiActivity.setWindowProxy(windowProxy);
		}
	}

	protected void handleBooted()
	{
		//TODO unique key per window, params for intent
		activityKey = WINDOW_ID_PREFIX + idGenerator.incrementAndGet();
		View layout = getLayout();
		layout.setClickable(true);
		registerForTouch(layout);
		layout.setOnFocusChangeListener(new OnFocusChangeListener() {
			public void onFocusChange(View view, boolean hasFocus) {
				proxy.fireEvent(hasFocus ? TiC.EVENT_FOCUS : TiC.EVENT_BLUR, new KrollDict());
			}
		});

		if (messenger != null) {
			Message msg = Message.obtain();
			msg.what = messageId;
			try {
				messenger.send(msg);
			} catch (RemoteException e) {
				Log.e(LCAT, "Unable to send message: " + e.getMessage(), e);
			} finally {
				messenger = null;
			}
		}
		if (windowActivity != null && windowActivity instanceof TiBaseActivity) {
			layout.requestFocus();
			((TiBaseActivity) windowActivity).fireInitialFocus(); 
		}
	}

	public void close(KrollDict options) 
	{
		Object animated = options.get(TiC.PROPERTY_ANIMATED);
		boolean animateOnClose = animate;
		if (animated != null) {
			animateOnClose = TiConvert.toBoolean(animated);
		}

		if (windowActivity != null) {
			if (!animateOnClose) {
				windowActivity.finish();
				TiUIHelper.overridePendingTransition(windowActivity);
			} else {
				windowActivity.finish();
			}
			windowActivity = null;
		}
	}

	@Override
	public boolean handleMessage(Message msg)
	{
		switch (msg.what) {
			case MSG_ACTIVITY_CREATED :
				if (DBG) {
					Log.d(LCAT, "Received Activity creation message");
				}
				if (windowActivity == null) {
					windowActivity = (Activity) msg.obj;
				}
				proxy.setModelListener(this);
				handleBooted();
				return true;
			case MSG_ANIMATE : {
				animate();
				return true;
			}
		}
		return false;
	}

	@Override
	public View getNativeView()
	{
		return getLayout();
	}

	public View getLayout()
	{
		TiBaseActivity tia = (TiBaseActivity) windowActivity;
		if (tia == null) {
			return null;
		}
		return tia.getLayout();
	}

	protected void setActivityBackground(final Drawable drawable, boolean post)
	{
		if (post) {
			proxy.getUIHandler().post(new Runnable() {
				public void run() {
					windowActivity.getWindow().setBackgroundDrawable(drawable);
				}
			});
		} else {
			windowActivity.getWindow().setBackgroundDrawable(drawable);
		}
	}

	private void handleBackground(Drawable drawable, Object opacityValue, boolean post)
	{
		if (drawable != null) {
			if (opacityValue != null) { // lightweight opacity will get handled via super because nativeView won't be null.
				setActivityOpacity(drawable, TiConvert.toFloat(opacityValue), true);
			}
			setActivityBackground(drawable, post);
		}
	}

	private void handleBackgroundColor(Object value, boolean post)
	{
		Object opacity = proxy.getProperty(TiC.PROPERTY_OPACITY);
		handleBackgroundColor(value, opacity, post);
	}

	private void setActivityOpacity(Drawable background, float opacity, boolean firstTime)
	{
		int alpha = Math.round(opacity * 255);
		if (alpha > 254 && firstTime) {
			alpha = 254; // why? seems if there is no transparency when window first displayed, Android won't allow it later either
		} else if (alpha < 0) {
			alpha = 0;
		}
		background.setAlpha(alpha);
	}

	private void handleBackgroundColor(Object value, Object opacityValue, boolean post)
	{
		if (value != null) {
			Drawable cd = TiConvert.toColorDrawable(TiConvert.toString(value));
			handleBackground(cd, opacityValue, post);
		} else {
			Log.w(LCAT, "Unable to set opacity w/o a backgroundColor");
		}
	}

	private void handleBackgroundImage(Object value, boolean post)
	{
		Object opacity = proxy.getProperty(TiC.PROPERTY_OPACITY);
		handleBackgroundImage(value, opacity, post);
	}

	private void handleBackgroundImage(Object value, Object opacityValue, boolean post)
	{
		if (value != null) {
			// proxy.getCreationUrl
			String path = proxy.resolveUrl(null, TiConvert.toString(value));
			TiFileHelper tfh = new TiFileHelper(TiApplication.getInstance());
			Drawable bd = tfh.loadDrawable(path, false);
			handleBackground(bd, opacityValue, post);
		}
	}

	@Override
	public void processProperties(KrollDict d)
	{
		// Prefer image to color.
		if (d.containsKey(TiC.PROPERTY_BACKGROUND_IMAGE)) {
			if (d.containsKey(TiC.PROPERTY_OPACITY)) {
				handleBackgroundImage(d.get(TiC.PROPERTY_BACKGROUND_IMAGE), d.get(TiC.PROPERTY_OPACITY), true);
			} else {
				handleBackgroundImage(d.get(TiC.PROPERTY_BACKGROUND_IMAGE), true);
			}
		} else if (d.containsKey(TiC.PROPERTY_BACKGROUND_COLOR)) {
			if (d.containsKey(TiC.PROPERTY_OPACITY)) {
				handleBackgroundColor(d.get(TiC.PROPERTY_BACKGROUND_COLOR), d.get(TiC.PROPERTY_OPACITY), true);
			} else {
				handleBackgroundColor(d.get(TiC.PROPERTY_BACKGROUND_COLOR), true);
			}
		}
		if (d.containsKey(TiC.PROPERTY_TITLE)) {
			String title = TiConvert.toString(d, TiC.PROPERTY_TITLE);
			if (windowActivity != null) {
				windowActivity.setTitle(title);
			} else {
				proxy.getActivity().setTitle(title);
			}
		}
		if (d.containsKey(TiC.PROPERTY_LAYOUT)) {
			TiCompositeLayout layout = null;
			if (windowActivity instanceof TiActivity) {
				layout = ((TiActivity)windowActivity).getLayout();
			}
			if (layout != null) {
				layout.setLayoutArrangement(TiConvert.toString(d, TiC.PROPERTY_LAYOUT));
			}
		}
		if (d.containsKey(TiC.PROPERTY_KEEP_SCREEN_ON)) {
			if (windowActivity != null) {
				windowActivity.getWindow().getDecorView().setKeepScreenOn(TiConvert.toBoolean(d, TiC.PROPERTY_KEEP_SCREEN_ON));
			}
			// skip default processing
			d.remove(TiC.PROPERTY_KEEP_SCREEN_ON);
		}
		if (d.containsKey(TiC.PROPERTY_WINDOW_PIXEL_FORMAT)) {
			handleWindowPixelFormat(TiConvert.toInt(d, TiC.PROPERTY_WINDOW_PIXEL_FORMAT));
		}

		// Don't allow default processing.
		d.remove(TiC.PROPERTY_BACKGROUND_IMAGE);
		d.remove(TiC.PROPERTY_BACKGROUND_COLOR);
		super.processProperties(d);
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (key.equals(TiC.PROPERTY_BACKGROUND_IMAGE)) {
			if (newValue != null) {
				handleBackgroundImage(newValue, false);
			} else {
				handleBackgroundColor(proxy.getProperty(TiC.PROPERTY_BACKGROUND_COLOR), false);
			}
		} else if (key.equals(TiC.PROPERTY_BACKGROUND_COLOR)) {
			handleBackgroundColor(newValue, false);
		} else if (key.equals(TiC.PROPERTY_WIDTH) || key.equals(TiC.PROPERTY_HEIGHT)) {
			Window w = proxy.getActivity().getWindow();
			int width = lastWidth;
			int height = lastHeight;

			if (key.equals(TiC.PROPERTY_WIDTH)) {
				if (newValue != null) {
					width = TiConvert.toInt(newValue);
				} else {
					width = LayoutParams.FILL_PARENT;
				}
			}
			if (key.equals(TiC.PROPERTY_HEIGHT)) {
				if (newValue != null) {
					height = TiConvert.toInt(newValue);
				} else {
					height = LayoutParams.FILL_PARENT;
				}
			}
			w.setLayout(width, height);

			lastWidth = width;
			lastHeight = height;
		} else if (key.equals(TiC.PROPERTY_TITLE)) {
			String title = TiConvert.toString(newValue);
			if (windowActivity != null) {
				windowActivity.setTitle(title);
			} else {
				proxy.getActivity().setTitle(title);
			}
		} else if (key.equals(TiC.PROPERTY_LAYOUT)) {
			TiCompositeLayout layout = null;
			if (windowActivity instanceof TiActivity) {
				layout = ((TiActivity)windowActivity).getLayout();
			}
			if (layout != null) {
				layout.setLayoutArrangement(TiConvert.toString(newValue));
			}
		} else if (key.equals(TiC.PROPERTY_OPACITY)) {
			setOpacity(TiConvert.toFloat(newValue));
		} else if (key.equals(TiC.PROPERTY_KEEP_SCREEN_ON)) {
			if (windowActivity != null) {
				windowActivity.getWindow().getDecorView().setKeepScreenOn(TiConvert.toBoolean(newValue));
			}
		} else if (key.equals(TiC.PROPERTY_WINDOW_PIXEL_FORMAT)) {
			handleWindowPixelFormat(TiConvert.toInt(newValue));
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	protected void handleWindowPixelFormat(int format)
	{
		if (windowActivity != null) {
			windowActivity.getWindow().setFormat(format);
			windowActivity.getWindow().getDecorView().invalidate();
		} else {
			Log.w(LCAT, "Activity is null. windowPixelFormat not set.");
		}
	}

	protected LayoutArrangement getLayoutArrangement()
	{
		LayoutArrangement arrangement = LayoutArrangement.DEFAULT;
		Object layout = proxy.getProperty(TiC.PROPERTY_LAYOUT);
		if (layout != null) {
			String layoutString = TiConvert.toString(layout);
			if (layoutString.equals(TiC.LAYOUT_VERTICAL)) {
				arrangement = LayoutArrangement.VERTICAL;
			} else if (layoutString.equals(TiC.LAYOUT_HORIZONTAL)) {
				arrangement = LayoutArrangement.HORIZONTAL;
			}
		}
		return arrangement;
	}

	protected Intent createIntent(Activity activity)
	{
		Intent intent = new Intent(activity, TiActivity.class);

		Object fullscreen = proxy.getProperty(TiC.PROPERTY_FULLSCREEN);
		if (fullscreen != null) {
			intent.putExtra(TiC.PROPERTY_FULLSCREEN, TiConvert.toBoolean(fullscreen));
		}

		Object navBarHidden = proxy.getProperty(TiC.PROPERTY_NAV_BAR_HIDDEN);
		if (navBarHidden != null) {
			intent.putExtra(TiC.PROPERTY_NAV_BAR_HIDDEN, TiConvert.toBoolean(navBarHidden));
		}

		Object modalProperty = proxy.getProperty(TiC.PROPERTY_MODAL);
		boolean modal = false;
		if (modalProperty != null) {
			modal = TiConvert.toBoolean(modalProperty);
			intent.putExtra(TiC.PROPERTY_MODAL, modal);
			if (modal) {
				intent.setClass(activity, TiModalActivity.class);
			}
		}

		Object opacity = proxy.getProperty(TiC.PROPERTY_OPACITY);
		if (opacity != null && !modal) { // modal already translucent
			intent.setClass(activity, TiTranslucentActivity.class);
		}

		Object url = proxy.getProperty(TiC.PROPERTY_URL);
		if (url != null) {
			intent.putExtra(TiC.PROPERTY_URL, TiConvert.toString(url));
		}

		Object keepScreenOn = proxy.getProperty(TiC.PROPERTY_KEEP_SCREEN_ON);
		if (keepScreenOn != null) {
			intent.putExtra(TiC.PROPERTY_KEEP_SCREEN_ON, TiConvert.toBoolean(keepScreenOn));
		}

		Object layout = proxy.getProperty(TiC.PROPERTY_LAYOUT);
		if (layout != null) {
			intent.putExtra(TiC.INTENT_PROPERTY_LAYOUT, TiConvert.toString(layout));
		}

		Object windowSoftInputMode = proxy.getProperty(TiC.PROPERTY_WINDOW_SOFT_INPUT_MODE);
		if (windowSoftInputMode != null) {
			intent.putExtra(TiC.PROPERTY_WINDOW_SOFT_INPUT_MODE, TiConvert.toInt(windowSoftInputMode));
		}

		Object pixelFormat = proxy.getProperty(TiC.PROPERTY_WINDOW_PIXEL_FORMAT);
		if (pixelFormat != null) {
			intent.putExtra(TiC.PROPERTY_WINDOW_PIXEL_FORMAT, TiConvert.toInt(pixelFormat));
		}

		boolean finishRoot = false;
		Object exitOnClose = proxy.getProperty(TiC.PROPERTY_EXIT_ON_CLOSE);
		if (exitOnClose != null) {
			finishRoot = TiConvert.toBoolean(exitOnClose);
		}

		intent.putExtra(TiC.INTENT_PROPERTY_FINISH_ROOT, finishRoot);
		Messenger messenger = new Messenger(handler);
		intent.putExtra(TiC.INTENT_PROPERTY_MESSENGER, messenger);
		intent.putExtra(TiC.INTENT_PROPERTY_MSG_ACTIVITY_CREATED_ID, MSG_ACTIVITY_CREATED);
		intent.putExtra(TiC.INTENT_PROPERTY_USE_ACTIVITY_WINDOW, true);
		intent.putExtra(TiC.INTENT_PROPERTY_WINDOW_ID, windowId);
		return intent;
	}

	@Override
	public void setOpacity(float opacity)
	{
		setActivityOpacity(windowActivity.getWindow().getDecorView().getBackground(), opacity, false);
		windowActivity.getWindow().getDecorView().invalidate();
	}

	@Override
	public void release()
	{
		super.release();
		messenger = null;
		handler = null;
		windowActivity = null;
		/* TODO if (windowContext != null) {
			windowContext.release();
			windowContext = null;
		}*/
	}

	public Activity getActivity()
	{
		return windowActivity;
	}
}
