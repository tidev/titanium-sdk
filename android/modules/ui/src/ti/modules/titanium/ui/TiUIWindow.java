/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.io.IOException;
import java.lang.ref.WeakReference;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiActivity;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiModalActivity;
import org.appcelerator.titanium.proxy.ActivityProxy;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.proxy.TiWindowProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiBindingHelper;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.util.TiPropertyResolver;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.util.TiUrl;
import org.appcelerator.titanium.view.ITiWindowHandler;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;
import org.appcelerator.titanium.view.TiCompositeLayout.LayoutArrangement;

import android.app.Activity;
import android.content.Intent;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.os.Handler;
import android.os.Message;
import android.os.Messenger;
import android.os.RemoteException;
import android.view.View;
import android.view.View.OnFocusChangeListener;
import android.view.ViewGroup.LayoutParams;
import android.view.Window;

public class TiUIWindow extends TiUIView
	implements Handler.Callback
{
	private static final String LCAT = "TiUIWindow";
	private static final boolean DBG = TiConfig.LOGD;

	private static final int WINDOW_ZINDEX = Integer.MAX_VALUE - 2; // Arbitrary number;
	private static final int MSG_ACTIVITY_CREATED = 1000;
	private static final int MSG_POST_OPEN = 1001;
	private static final int MSG_BOOTED = 1002;
	private static final int MSG_ANIMATE = 100;

	// Intent.FLAG_ACTIVITY_NO_ANIMATION not available in API 4
	private static final int INTENT_FLAG_ACTIVITY_NO_ANIMATION = 65536;
	private static final String[] NEW_ACTIVITY_REQUIRED_KEYS = {
		TiC.PROPERTY_FULLSCREEN, TiC.PROPERTY_NAV_BAR_HIDDEN,
		TiC.PROPERTY_MODAL, TiC.PROPERTY_WINDOW_SOFT_INPUT_MODE };
	private static final String WINDOW_ID_PREFIX = "window$";
	
	protected String activityKey;
	protected Activity windowActivity;
	protected TiCompositeLayout liteWindow;

	protected boolean lightWeight;
	protected boolean animate;
	protected Handler handler;

	protected Messenger messenger;
	protected int messageId;

	protected int lastWidth;
	protected int lastHeight;
	private WeakReference<TiContext> createdContext;

	private static AtomicInteger idGenerator;

	public TiUIWindow(TiViewProxy proxy, KrollDict options, Messenger messenger, int messageId) {
		super(proxy);
		animate = true;

		//proxy.setModelListener(this);
		if (idGenerator == null) {
			idGenerator = new AtomicInteger(0);
		}
		this.messenger = messenger;
		this.messageId = messageId;
		this.handler = new Handler(this);

		this.lastWidth = LayoutParams.FILL_PARENT;
		this.lastHeight = LayoutParams.FILL_PARENT;

		KrollDict props = proxy.getProperties();
		TiPropertyResolver resolver = new TiPropertyResolver(options, props);
		boolean newActivity = requiresNewActivity(resolver);
		if (!newActivity && options != null && options.containsKey(TiC.PROPERTY_TAB_OPEN)) {
			newActivity = TiConvert.toBoolean(options, TiC.PROPERTY_TAB_OPEN);
		}

		if (newActivity) {
			lightWeight = false;
			Activity activity = proxy.getTiContext().getActivity();
			Intent intent = createIntent(activity, options);
			KrollDict d = resolver.findProperty(TiC.PROPERTY_ANIMATED);
			if (d != null) {
				if (d.containsKey(TiC.PROPERTY_ANIMATED)) {
					animate = TiConvert.toBoolean(d, TiC.PROPERTY_ANIMATED);
				}
			}
			if (!animate) {
				intent.addFlags(INTENT_FLAG_ACTIVITY_NO_ANIMATION);
				intent.putExtra(TiC.PROPERTY_ANIMATE, false);
				activity.startActivity(intent);
				TiUIHelper.overridePendingTransition(activity);
			} else {
				activity.startActivity(intent);
			}
		} else {
			lightWeight = true;
			liteWindow = new TiCompositeLayout(proxy.getContext(), getLayoutArrangement(resolver));
			layoutParams.autoFillsHeight = true;
			layoutParams.autoFillsWidth = true;

			setNativeView(liteWindow);
			proxy.setModelListener(this);
			handlePostOpen();
		}
		
		resolver.release();
		resolver = null;
	}

	public TiUIWindow(TiViewProxy proxy, Activity activity) {
		super(proxy);
		if (idGenerator == null) {
			idGenerator = new AtomicInteger(0);
		}

		windowActivity = activity;
		lightWeight = false;

		this.handler = new Handler(this);
		handlePostOpen();
	}

	protected void handlePostOpen() {
		//TODO unique key per window, params for intent
		activityKey = WINDOW_ID_PREFIX + idGenerator.incrementAndGet();
		KrollDict props = proxy.getProperties();

		View layout = getLayout();
		layout.setClickable(true);
		registerForTouch(layout);
		layout.setOnFocusChangeListener(new OnFocusChangeListener() {
			public void onFocusChange(View view, boolean hasFocus) {
				proxy.fireEvent(hasFocus ? TiC.EVENT_FOCUS : TiC.EVENT_BLUR, new KrollDict());
			}
		});

		// if url, create a new context.
		if (props.containsKey(TiC.PROPERTY_URL)) {
			String url = props.getString(TiC.PROPERTY_URL);
			String baseUrl = proxy.getTiContext().getBaseUrl();
			TiUrl tiUrl = TiUrl.normalizeWindowUrl(baseUrl, url);
			if (DBG) {
				Log.d(LCAT, "Window has URL: " + tiUrl.url);
			}
			
			Activity activity = lightWeight ? proxy.getTiContext().getActivity() : windowActivity;
			TiContext tiContext = TiContext.createTiContext(activity, tiUrl.baseUrl);
			ActivityProxy activityProxy = bindWindowActivity(tiContext, activity);
			TiBindingHelper.bindCurrentWindowAndActivity(tiContext, proxy, activityProxy);

			final TiContext ftiContext = tiContext;
			final String furl = tiUrl.url;
			new Thread(new Runnable(){
				@Override
				public void run() {
					try {
						createdContext = new WeakReference<TiContext>(proxy.switchContext(ftiContext));
						if (!lightWeight) {
							bindProxies();
						}
						Messenger m = new Messenger(handler);
						ftiContext.evalFile(furl, m, MSG_BOOTED);
					} catch (IOException e) {
						Log.e(LCAT, "Error opening URL: " + furl, e);
					}
				}}).start();
		} else if (!lightWeight) {
			TiContext tiContext = TiContext.createTiContext(windowActivity, proxy.getTiContext().getBaseUrl());
			createdContext = new WeakReference<TiContext>(proxy.switchContext(tiContext));
			
			ActivityProxy activityProxy = bindWindowActivity(tiContext, windowActivity);
			TiBindingHelper.bindCurrentWindowAndActivity(tiContext, proxy, activityProxy);
			bindProxies();
			handleBooted();
		} else {
			bindWindowActivity(proxy.getTiContext(), proxy.getTiContext().getActivity());
			handleBooted();
		}
	}

	protected ActivityProxy bindWindowActivity(TiContext tiContext, Activity activity) {
		ActivityProxy activityProxy = ((TiWindowProxy) proxy).getActivity(tiContext);
		activityProxy.setActivity(tiContext, activity);
		return activityProxy;
	}

	protected void bindProxies() {
		if (windowActivity instanceof TiBaseActivity) {
			TiBaseActivity tiActivity = (TiBaseActivity)windowActivity;
			TiWindowProxy windowProxy = (TiWindowProxy)proxy;
			tiActivity.setActivityProxy(windowProxy.getActivity(proxy.getTiContext()));
			tiActivity.setWindowProxy(windowProxy);
		}
	}

	protected void handleBooted() {
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
		if (lightWeight) {
			ITiWindowHandler windowHandler = proxy.getTiContext().getTiApp().getWindowHandler();
			if (windowHandler != null) {
				TiCompositeLayout.LayoutParams params = getLayoutParams();
				params.optionZIndex = WINDOW_ZINDEX;
				windowHandler.addWindow(liteWindow, params);
			}
			handler.obtainMessage(MSG_ANIMATE).sendToTarget();
		} else if (windowActivity != null && windowActivity instanceof TiActivity) {
			View layout = getLayout();
			if (layout == null) {
				if (DBG) {
					Log.w(LCAT, "Layout for booted window is gone. User maybe backed out quickly.");
				}
				return;
			}
			layout.requestFocus();
			((TiActivity) windowActivity).fireInitialFocus(); 
		}
	}
	public void close(KrollDict options) 
	{
		KrollDict props = proxy.getProperties();
		TiPropertyResolver resolver = new TiPropertyResolver(options, props);
		props = resolver.findProperty(TiC.PROPERTY_ANIMATED);
		boolean animateOnClose = animate;
		if (props != null && props.containsKey(TiC.PROPERTY_ANIMATED)) {
			animateOnClose = props.getBoolean(TiC.PROPERTY_ANIMATED);
		}

		boolean revertToCreatedContext = false;
		if (!lightWeight) {
			if (windowActivity != null) {
				if (!animateOnClose) {
					windowActivity.finish();
					TiUIHelper.overridePendingTransition(windowActivity);
				} else {
					windowActivity.finish();
				}
				windowActivity = null;
			}
		} else {
			if (liteWindow != null) {
				// Only fire close event for lightweights.  For heavyweights, the
				// Activity finish will result in close firing.
				KrollDict data = new KrollDict();
				data.put(TiC.EVENT_PROPERTY_SOURCE, proxy);
				proxy.fireEvent(TiC.EVENT_CLOSE, data);
				ITiWindowHandler windowHandler = proxy.getTiContext().getTiApp().getWindowHandler();
				if (windowHandler != null) {
					windowHandler.removeWindow(liteWindow);
				}
				liteWindow.removeAllViews();
				liteWindow = null;
			}
		}
		if (revertToCreatedContext) {
			if (proxy instanceof TiWindowProxy) {
				((TiWindowProxy)proxy).switchToCreatingContext();
			}
		}
	}
	@Override
	public boolean handleMessage(Message msg) {
		switch (msg.what) {
			case MSG_ACTIVITY_CREATED :
				if (DBG) {
					Log.d(LCAT, "Received Activity creation message");
				}
				windowActivity = (Activity) msg.obj;
				proxy.setModelListener(this);

				handler.sendEmptyMessage(MSG_POST_OPEN);
				return true;
			case MSG_ANIMATE : {
				animate();
				return true;
			}
			case MSG_POST_OPEN : {
				try {
					handlePostOpen();
				} catch(Exception ex) {
					Log.e(LCAT, "Exception in handlePostOpen: "+ex, ex);
				}
				return true;
			}
			case MSG_BOOTED : {
				if (DBG) {
					Log.d(LCAT, "Received booted notification");
				}
				handleBooted();
				return true;
			}
		}
		return false;
	}

	@Override
	public View getNativeView() {
		View v = super.getNativeView();
		if (!lightWeight) {
			v = getLayout();
		}
		return v;
	}

	public View getLayout() {
		View layout = nativeView;
		if (!lightWeight) {
			TiActivity tia = (TiActivity) windowActivity;
			if (tia == null) {
				return null;
			}
			layout = tia.getLayout();
		}
		return layout;
	}

	private void handleBackgroundColor(KrollDict d) {
		if (proxy.getProperty(TiC.PROPERTY_BACKGROUND_COLOR) != null) {
			Integer bgColor = TiConvert.toColor(d, TiC.PROPERTY_BACKGROUND_COLOR);
			Drawable cd = new ColorDrawable(bgColor);
			if (lightWeight) {
				nativeView.setBackgroundDrawable(cd);
			} else {
				Window w = windowActivity.getWindow();
				w.setBackgroundDrawable(cd);
			}
		} else {
			Log.w(LCAT, "Unable to set opacity w/o a backgroundColor");
		}
	}

	@Override
	public void processProperties(KrollDict d) {
		// Prefer image to color.
		if (d.containsKey(TiC.PROPERTY_BACKGROUND_IMAGE)) {
			String path = proxy.getTiContext().resolveUrl(null, TiConvert.toString(d, TiC.PROPERTY_BACKGROUND_IMAGE));
			TiFileHelper tfh = new TiFileHelper(proxy.getContext().getApplicationContext());
			Drawable bd = tfh.loadDrawable(proxy.getTiContext(), path, false);
			if (bd != null) {
				if (!lightWeight) {
					windowActivity.getWindow().setBackgroundDrawable(bd);
				} else {
					nativeView.setBackgroundDrawable(bd);
				}
			}
		} else if (d.containsKey(TiC.PROPERTY_BACKGROUND_COLOR)) {
			ColorDrawable bgColor = TiConvert.toColorDrawable(d, TiC.PROPERTY_BACKGROUND_COLOR);
			if (!lightWeight) {
				windowActivity.getWindow().setBackgroundDrawable(bgColor);
			} else {
				nativeView.setBackgroundDrawable(bgColor);
			}
		}
		if (d.containsKey(TiC.PROPERTY_TITLE)) {
			String title = TiConvert.toString(d, TiC.PROPERTY_TITLE);
			proxy.getTiContext().getActivity().setTitle(title);
		}

		// Don't allow default processing.
		d.remove(TiC.PROPERTY_BACKGROUND_IMAGE);
		d.remove(TiC.PROPERTY_BACKGROUND_COLOR);
		super.processProperties(d);
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy) {
		if (key.equals(TiC.PROPERTY_BACKGROUND_IMAGE)) {
			if (newValue != null) {
				String path = proxy.getTiContext().resolveUrl(null, TiConvert.toString(newValue));
				TiFileHelper tfh = new TiFileHelper(proxy.getTiContext().getTiApp());
				Drawable bd = tfh.loadDrawable(proxy.getTiContext(), path, false);
				if (bd != null) {
					if (!lightWeight) {
						windowActivity.getWindow().setBackgroundDrawable(bd);
					} else {
						nativeView.setBackgroundDrawable(bd);
					}
				}
			} else {
				handleBackgroundColor(proxy.getProperties());
			}
		} else if (key.equals(TiC.PROPERTY_BACKGROUND_COLOR)) {
			KrollDict d = proxy.getProperties();
			handleBackgroundColor(d);
		} else if (key.equals(TiC.PROPERTY_WIDTH) || key.equals(TiC.PROPERTY_HEIGHT)) {
			Window w = proxy.getTiContext().getActivity().getWindow();
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
			proxy.getTiContext().getActivity().setTitle(title);
		} else if (key.equals(TiC.PROPERTY_LAYOUT)) {
			if (!lightWeight) {
				TiCompositeLayout layout = null;
				if (windowActivity instanceof TiActivity) {
					layout = ((TiActivity)windowActivity).getLayout();
				} else if (windowActivity instanceof TiTabActivity) {
					layout = ((TiTabActivity)windowActivity).getLayout();
				}
				if (layout != null) {
					layout.setLayoutArrangement(TiConvert.toString(newValue));
				}
			}
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	protected boolean requiresNewActivity(TiPropertyResolver resolver)
	{
		return resolver.hasAnyOf(NEW_ACTIVITY_REQUIRED_KEYS);
	}

	protected LayoutArrangement getLayoutArrangement(TiPropertyResolver resolver)
	{
		LayoutArrangement arrangement = LayoutArrangement.DEFAULT;
		KrollDict d = resolver.findProperty(TiC.PROPERTY_LAYOUT);
		if (d != null) {
			if (TiConvert.toString(d, TiC.PROPERTY_LAYOUT).equals(TiC.LAYOUT_VERTICAL)) {
				arrangement = LayoutArrangement.VERTICAL;
			} else if (TiConvert.toString(d, TiC.PROPERTY_LAYOUT).equals(TiC.LAYOUT_HORIZONTAL)) {
				arrangement = LayoutArrangement.HORIZONTAL;
			}
		}
		return arrangement;
	}

	protected Intent createIntent(Activity activity, KrollDict options) {
		TiPropertyResolver resolver = new TiPropertyResolver(options, proxy.getProperties());
		Intent intent = new Intent(activity, TiActivity.class);

		KrollDict props = resolver.findProperty(TiC.PROPERTY_FULLSCREEN);
		if (props != null && props.containsKey(TiC.PROPERTY_FULLSCREEN)) {
			intent.putExtra(TiC.PROPERTY_FULLSCREEN, TiConvert.toBoolean(props, TiC.PROPERTY_FULLSCREEN));
		}
		props = resolver.findProperty(TiC.PROPERTY_NAV_BAR_HIDDEN);
		if (props != null && props.containsKey(TiC.PROPERTY_NAV_BAR_HIDDEN)) {
			intent.putExtra(TiC.PROPERTY_NAV_BAR_HIDDEN, TiConvert.toBoolean(props, TiC.PROPERTY_NAV_BAR_HIDDEN));
		}
		props = resolver.findProperty(TiC.PROPERTY_MODAL);
		if (props != null && props.containsKey(TiC.PROPERTY_MODAL)) {
			intent.setClass(activity, TiModalActivity.class);
			intent.putExtra(TiC.PROPERTY_MODAL, TiConvert.toBoolean(props, TiC.PROPERTY_MODAL));
		}
		props = resolver.findProperty(TiC.PROPERTY_URL);
		if (props != null && props.containsKey(TiC.PROPERTY_URL)) {
			intent.putExtra(TiC.PROPERTY_URL, TiConvert.toString(props, TiC.PROPERTY_URL));
		}
		props = resolver.findProperty(TiC.PROPERTY_LAYOUT);
		if (props != null && props.containsKey(TiC.PROPERTY_LAYOUT)) {
			intent.putExtra(TiC.INTENT_PROPERTY_LAYOUT, TiConvert.toString(props, TiC.PROPERTY_LAYOUT));
		}
		props = resolver.findProperty(TiC.PROPERTY_WINDOW_SOFT_INPUT_MODE);
		if (props != null && props.containsKey(TiC.PROPERTY_WINDOW_SOFT_INPUT_MODE)) {
			intent.putExtra(TiC.PROPERTY_WINDOW_SOFT_INPUT_MODE, TiConvert.toInt(props, TiC.PROPERTY_WINDOW_SOFT_INPUT_MODE));
		}

		boolean finishRoot = false;
		props = resolver.findProperty(TiC.PROPERTY_EXIT_ON_CLOSE);
		if (props != null && props.containsKey(TiC.PROPERTY_EXIT_ON_CLOSE)) {
			finishRoot = TiConvert.toBoolean(props, TiC.PROPERTY_EXIT_ON_CLOSE);
		}
		resolver.release();
		resolver = null;

		intent.putExtra(TiC.INTENT_PROPERTY_FINISH_ROOT, finishRoot);
		Messenger messenger = new Messenger(handler);
		intent.putExtra(TiC.INTENT_PROPERTY_MESSENGER, messenger);
		intent.putExtra(TiC.INTENT_PROPERTY_MESSAGE_ID, MSG_ACTIVITY_CREATED);

		return intent;
	}
	
	@Override
	public void setOpacity(float opacity) {
		View view = null;
		if (!lightWeight) {
			view = windowActivity.getWindow().getDecorView();
		} else {
			view = nativeView;
		}
		
		super.setOpacity(view, opacity);
	}

	@Override
	public void release()
	{
		super.release();
		if (liteWindow != null) {
			liteWindow.removeAllViews();
			liteWindow = null;
		}
		messenger = null;
		handler = null;
		windowActivity = null;
	}
	
	public Activity getActivity() {
		return windowActivity;
	}
}
