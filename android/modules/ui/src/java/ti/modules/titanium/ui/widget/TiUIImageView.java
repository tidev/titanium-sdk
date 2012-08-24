/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.AsyncResult;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiMessenger;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.TiLifecycle.OnLifecycleEvent;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiBackgroundImageLoadTask;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiDownloadListener;
import org.appcelerator.titanium.util.TiResponseCache;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.util.TiUrl;
import org.appcelerator.titanium.view.TiDrawableReference;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.filesystem.FileProxy;
import ti.modules.titanium.ui.ImageViewProxy;
import ti.modules.titanium.ui.widget.TiImageView.OnSizeChangeListener;
import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.view.View;
import android.view.ViewParent;
import android.webkit.URLUtil;

public class TiUIImageView extends TiUIView implements OnLifecycleEvent, Handler.Callback
{
	private static final String TAG = "TiUIImageView";
	private static final AtomicInteger imageTokenGenerator = new AtomicInteger(0);
	private static final int FRAME_QUEUE_SIZE = 5;
	public static final int INFINITE = 0;
	public static final int MIN_DURATION = 30;
	public static final int DEFAULT_DURATION = 200;

	// TIMOB-3599: A bug in Gingerbread forces us to retry decoding bitmaps when they initially fail
	private static final String PROPERTY_DECODE_RETRIES = "decodeRetries";
	private static final int DEFAULT_DECODE_RETRIES = 5;

	private Timer timer;
	private Animator animator;
	private Loader loader;
	private Thread loaderThread;
	private AtomicBoolean animating = new AtomicBoolean(false);
	private AtomicBoolean isLoading = new AtomicBoolean(false);
	private AtomicBoolean isStopping = new AtomicBoolean(false);
	private boolean reverse = false;
	private boolean paused = false;
	private int token;
	private boolean firedLoad;
	private ImageViewProxy imageViewProxy;
	private int currentDuration;

	private TiDimension requestedWidth;
	private TiDimension requestedHeight;

	private ArrayList<TiDrawableReference> imageSources;
	private TiDrawableReference defaultImageSource;
	private TiDownloadListener downloadListener;
	private int decodeRetries = 0;
	private Object releasedLock = new Object();

	private class BgImageLoader extends TiBackgroundImageLoadTask
	{
		private int token;

		public BgImageLoader(TiDimension imageWidth, TiDimension imageHeight, int token)
		{
			super(getParentView(), imageWidth, imageHeight);
			this.token = token;
		}

		@Override
		protected void onPostExecute(Drawable d)
		{
			super.onPostExecute(d);
			
			if (d != null) {
				final Drawable fDrawable = d;
				
				// setImageDrawable has to run in the UI thread since it updates the UI
				TiMessenger.getMainMessenger().post(new Runnable()
				{
					@Override
					public void run()
					{
						setImageDrawable(fDrawable, token);
					}
				});
				
			} else {
				if (Log.isDebugModeEnabled()) {
					String traceMsg = "Background image load returned null";
					if (proxy.hasProperty(TiC.PROPERTY_IMAGE)) {
						Object image = proxy.getProperty(TiC.PROPERTY_IMAGE);
						if (image instanceof String) {
							traceMsg += " (" + TiConvert.toString(image) + ")";
						}
					}
					Log.d(TAG, traceMsg);
				}
			}
		}
	}

	public TiUIImageView(TiViewProxy proxy)
	{
		super(proxy);
		imageViewProxy = (ImageViewProxy) proxy;

		Log.d(TAG, "Creating an ImageView", Log.DEBUG_MODE);

		TiImageView view = new TiImageView(proxy.getActivity());
		view.setOnSizeChangeListener(new OnSizeChangeListener()
		{

			@Override
			public void sizeChanged(int w, int h, int oldWidth, int oldHeight)
			{
				// By the time this hits, we've already set the drawable in the view.
				// And this runs even the first time the view is drawn (in which
				// case oldWidth and oldHeight are 0.) This was leading to
				// setImage running twice unnecessarily, so the if block here
				// will avoid a second, unnecessary call to setImage.
				if (oldWidth == 0 && oldHeight == 0) {
					TiImageView view = getView();
					if (view != null) {
						Drawable drawable = view.getImageDrawable();
						if (drawable != null && drawable.getIntrinsicHeight() == h && drawable.getIntrinsicWidth() == w) {
							return;
						}
					}
				}
				setImage(true);
			}
		});

		downloadListener = new TiDownloadListener()
		{
			@Override
			public void downloadFinished(URI uri)
			{
				if (!TiResponseCache.peek(uri)) {
					// The requested image did not make it into our TiResponseCache,
					// possibly because it had a header forbidding that. Now get it
					// via the "old way" (not relying on cache).
					synchronized (imageTokenGenerator) {
						token = imageTokenGenerator.incrementAndGet();
						if (imageSources != null && imageSources.size() > 0) {
							imageSources.get(0).getBitmapAsync(new BgImageLoader(requestedWidth, requestedHeight, token));
						}
					}
				} else {
					firedLoad = false;
					setImage(true);
				}
			}

			@Override
			public void downloadFailed()
			{
				// If the download failed, fire an error event
				fireError();
			}
		};
		setNativeView(view);
		// TODO proxy.getActivity().addOnLifecycleEventListener(this);
	}

	@Override
	public void setProxy(TiViewProxy proxy)
	{
		super.setProxy(proxy);
		imageViewProxy = (ImageViewProxy) proxy;
	}

	private TiImageView getView()
	{
		return (TiImageView) nativeView;
	}

	protected View getParentView()
	{
		if (nativeView == null) {
			return null;
		}

		ViewParent parent = nativeView.getParent();
		if (parent instanceof View) {
			return (View) parent;
		}
		if (parent == null) {
			TiViewProxy parentProxy = proxy.getParent();
			if (parentProxy != null) {
				TiUIView parentTiUi = parentProxy.peekView();
				if (parentTiUi != null) {
					return parentTiUi.getNativeView();
				}
			}
		}
		return null;
	}

	// This method is intended to only be use from the background task, it's basically
	// an optimistic commit.
	private void setImageDrawable(Drawable d, int token)
	{
		TiImageView view = getView();
		if (view != null) {
			synchronized (imageTokenGenerator) {
				if (this.token == token) {
					view.setImageDrawable(d, false);
					this.token = -1;
				}
			}
		}
	}

	private Handler handler = new Handler(Looper.getMainLooper(), this);
	private static final int SET_IMAGE = 10001;
	private static final int START = 10002;
	private static final int STOP = 10003;


	public boolean handleMessage(Message msg)
	{
		switch(msg.what) {
		
		case SET_IMAGE:
			AsyncResult result = (AsyncResult) msg.obj;
			handleSetImage((Bitmap) result.getArg());
			result.setResult(null);
			return true;
		case START:
			handleStart();
			return true;
		case STOP:
			handleStop();
			return true;
			
		default: return false;
		
		}
	}

	private void setImage(final Bitmap bitmap)
	{
		if (!TiApplication.isUIThread()) {
			TiMessenger.sendBlockingMainMessage(handler.obtainMessage(SET_IMAGE), bitmap);
		} else {
			handleSetImage(bitmap);
		}
	}

	private void handleSetImage(final Bitmap bitmap)
	{
		TiImageView view = getView();
		if (view != null) {
			view.setImageBitmap(bitmap);
		}
		// Let this run even if view doesn't exist. It just tells the proxy
		// what the current bitmap should be.
		imageViewProxy.onBitmapChanged(this, bitmap);
	}

	private class BitmapWithIndex
	{
		public BitmapWithIndex(Bitmap b, int i)
		{
			this.bitmap = b;
			this.index = i;
		}

		public Bitmap bitmap;
		public int index;
	}

	private class Loader implements Runnable
	{
		private ArrayBlockingQueue<BitmapWithIndex> bitmapQueue;
		private int waitTime = 0;
		private int sleepTime = 50; //ms
		private int repeatIndex = 0;

		public Loader()
		{
			bitmapQueue = new ArrayBlockingQueue<BitmapWithIndex>(FRAME_QUEUE_SIZE);
		}

		private boolean isRepeating()
		{
			int repeatCount = getRepeatCount();
			if (repeatCount <= INFINITE) {
				return true;
			}
			return repeatIndex < repeatCount;
		}

		private int getStart()
		{
			if (imageSources == null) {
				return 0;
			}
			if (reverse) {
				return imageSources.size() - 1;
			}
			return 0;

		}

		private boolean isNotFinalFrame(int frame)
		{
			synchronized (releasedLock) {
				if (imageSources == null) {
					return false;
				}
				if (reverse) {
					return frame >= 0;
				}
				return frame < imageSources.size();
			}
		}

		private int getCounter()
		{
			if (reverse) {
				return -1;
			}
			return 1;
		}

		public void run()
		{
			if (getProxy() == null) {
				Log.d(TAG, "Multi-image loader exiting early because proxy has been gc'd");
				return;
			}
			repeatIndex = 0;
			isLoading.set(true);
			firedLoad = false;
			topLoop: while (isRepeating()) {

				if (imageSources == null) {
					break;
				}
				long time = System.currentTimeMillis();
				for (int j = getStart(); imageSources != null && isNotFinalFrame(j); j += getCounter()) {
					if (bitmapQueue.size() == FRAME_QUEUE_SIZE && !firedLoad) {
						fireLoad(TiC.PROPERTY_IMAGES);
						firedLoad = true;
					}
					if (paused && !Thread.currentThread().isInterrupted()) {
						try {
							Log.i(TAG, "Pausing", Log.DEBUG_MODE);
							// User backed-out while animation running
							if (loader == null) {
								break;
							}

							synchronized (this) {
								wait();
							}

							Log.i(TAG, "Waking from pause.", Log.DEBUG_MODE);
							// In the meantime, while paused, user could have backed out, which leads
							// to release(), which in turn leads to nullified imageSources.
							if (imageSources == null) {
								break topLoop;
							}
						} catch (InterruptedException e) {
							Log.w(TAG, "Interrupted from paused state.");
						}
					}

					if (!isLoading.get() || isStopping.get()) {
						break topLoop;
					}

					waitTime = 0;
					synchronized (releasedLock) {
						if (imageSources == null || j >= imageSources.size()) {
							break topLoop;
						}
						Bitmap b = imageSources.get(j).getBitmap();
						BitmapWithIndex bIndex = new BitmapWithIndex(b,j);
						while (waitTime < getDuration() * imageSources.size()) {
							try {
								if (!bitmapQueue.offer(bIndex)) {
									if (isStopping.get()) {
										break;
									} 
									Thread.sleep(sleepTime);
									waitTime += sleepTime;

								} else {
									break;
								}

							} catch (InterruptedException e) {
								Log.w(TAG, "Interrupted while adding Bitmap into bitmapQueue");
								break;
							}
						}
					}
					repeatIndex++;
				}

				Log.d(TAG, "TIME TO LOAD FRAMES: " + (System.currentTimeMillis() - time) + "ms", Log.DEBUG_MODE);

			}
			isLoading.set(false);
		}

		public ArrayBlockingQueue<BitmapWithIndex> getBitmapQueue()
		{
			return bitmapQueue;
		}
	}

	private void setImages()
	{
		if (imageSources == null || imageSources.size() == 0) {
			fireError();
			return;
		}

		if (loader == null) {
			paused = false;
			isStopping.set(false);
			firedLoad = false;
			loader = new Loader();
			loaderThread = new Thread(loader);
			Log.d(TAG, "STARTING LOADER THREAD " + loaderThread + " for " + this, Log.DEBUG_MODE);
			loaderThread.start();
		}

	}

	public double getDuration()
	{
		if (proxy.getProperty(TiC.PROPERTY_DURATION) != null) {
			double duration = TiConvert.toDouble(proxy.getProperty(TiC.PROPERTY_DURATION));
			if (duration < MIN_DURATION) {
				return MIN_DURATION;
			} else {
				return duration;
			}
		}
		proxy.setProperty(TiC.PROPERTY_DURATION, DEFAULT_DURATION);
		
		return DEFAULT_DURATION;
	}

	public int getRepeatCount()
	{
		if (proxy.hasProperty(TiC.PROPERTY_REPEAT_COUNT)) {
			return TiConvert.toInt(proxy.getProperty(TiC.PROPERTY_REPEAT_COUNT));
		}
		return INFINITE;
	}

	private void fireLoad(String state)
	{
		KrollDict data = new KrollDict();
		data.put(TiC.EVENT_PROPERTY_STATE, state);
		proxy.fireEvent(TiC.EVENT_LOAD, data);
	}

	private void fireStart()
	{
		KrollDict data = new KrollDict();
		proxy.fireEvent(TiC.EVENT_START, data);
	}

	private void fireChange(int index)
	{
		KrollDict data = new KrollDict();
		data.put(TiC.EVENT_PROPERTY_INDEX, index);
		proxy.fireEvent(TiC.EVENT_CHANGE, data);
	}

	private void fireStop()
	{
		KrollDict data = new KrollDict();
		proxy.fireEvent(TiC.EVENT_STOP, data);
	}

	private void fireError()
	{
		KrollDict data = new KrollDict();
		proxy.fireEvent(TiC.EVENT_ERROR, data);
	}

	private class Animator extends TimerTask
	{
		private Loader loader;

		public Animator(Loader loader)
		{
			this.loader = loader;
		}

		public void run()
		{
			boolean waitOnResume = false;
			try {
				if (paused) {
					synchronized (this) {
						KrollDict data = new KrollDict();
						proxy.fireEvent(TiC.EVENT_PAUSE, data);
						waitOnResume = true;
						wait();
					}
				}

				BitmapWithIndex b = loader.getBitmapQueue().take();
				Log.d(TAG, "set image: " + b.index, Log.DEBUG_MODE);
				setImage(b.bitmap);
				fireChange(b.index);

				// When the animation is paused, the timer will pause in the middle of a period.
				// When the animation resumes, the timer resumes from where it left off. As a result, it will look like
				// one frame is left out when resumed (TIMOB-10207).
				// To avoid this, we force the thread to wait for one period on resume.
				if (waitOnResume) {
					Thread.sleep(currentDuration);
					waitOnResume = false;
				}
			} catch (InterruptedException e) {
				Log.e(TAG, "Loader interrupted");
			}
		}
	}

	public void start()
	{
		if (!TiApplication.isUIThread()) {
			Message message = handler.obtainMessage(START);
			message.sendToTarget();
		} else {
			handleStart();
		}
	}

	public void handleStart()
	{
		if (animator == null) {
			timer = new Timer();

			if (loader == null) {
				loader = new Loader();
				loaderThread = new Thread(loader);
				Log.d(TAG, "STARTING LOADER THREAD " + loaderThread + " for " + this, Log.DEBUG_MODE);
			}

			animator = new Animator(loader);
			if (!animating.get() && !loaderThread.isAlive()) {
				isStopping.set(false);
				loaderThread.start();
			}

			currentDuration = (int) getDuration();

			animating.set(true);
			fireStart();
			timer.schedule(animator, currentDuration, currentDuration);
		} else {
			resume();
		}
	}

	public void pause() 
	{
		paused = true;
	}
	
	public void resume()
	{
		paused = false;
		
		if (animator != null) {
			synchronized (animator) {
				animator.notify();
			}
		}
		
		if (loader != null) {
			synchronized (loader) {
				loader.notify();
			}
		}
	}

	public void stop()
	{
		if (!TiApplication.isUIThread()) {
			Message message = handler.obtainMessage(STOP);
			message.sendToTarget();		
		} else {
			handleStop();
		}
	}
	public void handleStop()
	{
		if (timer != null) {
			timer.cancel();
		}
		animating.set(false);
		isStopping.set(true);

		if (loaderThread != null) {
			try {
				loaderThread.join();
			} catch (InterruptedException e) {
				Log.e(TAG, "LoaderThread termination interrupted");
			}
			loaderThread = null;
		}
		if (loader != null) {
			synchronized (loader) {
				loader.notify();
			}
		}

		loader = null;
		timer = null;
		animator = null;
		paused = false;

		fireStop();
	}

	private void setImageSource(Object object)
	{
		if (imageViewProxy.inTableView()) {
			ArrayList<TiDrawableReference> currentSources = imageViewProxy.getImageSources();
			if (currentSources != null) {
				imageSources = currentSources;
				return;
			}
		}

		imageSources = new ArrayList<TiDrawableReference>();
		if (object instanceof Object[]) {
			for (Object o : (Object[]) object) {
				imageSources.add(makeImageSource(o));
			}
		} else {
			imageSources.add(makeImageSource(object));
		}
		imageViewProxy.onImageSourcesChanged(this, imageSources);

	}

	private void setImageSource(TiDrawableReference source)
	{
		imageSources = new ArrayList<TiDrawableReference>();
		imageSources.add(source);
	}

	private TiDrawableReference makeImageSource(Object object)
	{
		if (object instanceof FileProxy) {
			return TiDrawableReference.fromFile(proxy.getActivity(), ((FileProxy) object).getBaseFile());
		} else if (object instanceof String) {
			return TiDrawableReference.fromUrl(proxy, (String) object);
		} else {
			return TiDrawableReference.fromObject(proxy.getActivity(), object);
		}
	}

	private void setDefaultImageSource(Object object)
	{
		if (object instanceof FileProxy) {
			defaultImageSource = TiDrawableReference.fromFile(proxy.getActivity(), ((FileProxy) object).getBaseFile());
		} else if (object instanceof String) {
			defaultImageSource = TiDrawableReference.fromUrl(proxy, (String) object);
		} else {
			defaultImageSource = TiDrawableReference.fromObject(proxy.getActivity(), object);
		}
	}

	private void setImage(boolean recycle)
	{
		if (imageSources == null || imageSources.size() == 0 || imageSources.get(0) == null || imageSources.get(0).isTypeNull()) {
			if (defaultImageSource != null) {
				setDefaultImage();
			} else {
				setImage(null);
			}
			return;
		}
		if (imageSources.size() == 1) {
			if (imageViewProxy.inTableView()) {
				Bitmap currentBitmap = imageViewProxy.getBitmap();
				if (currentBitmap != null) {
					// If the image proxy has the default image currently cached, we need to
					// load the downloaded URL instead. TIMOB-4814
					ArrayList<TiDrawableReference> proxySources = imageViewProxy.getImageSources();
					if (proxySources != null && !proxySources.contains(defaultImageSource)) {
						setImage(currentBitmap);
						return;
					}
				}
			}
			TiDrawableReference imageref = imageSources.get(0);
			if (imageref.isNetworkUrl()) {
				if (defaultImageSource != null) {
					setDefaultImage();
				} else {
					TiImageView view = getView();
					if (view != null) {
						view.setImageDrawable(null, recycle);
					}
				}
				boolean getAsync = true;
				try {
					String imageUrl = TiUrl.getCleanUri(imageref.getUrl()).toString();
					
					URI uri = new URI(imageUrl);
					getAsync = !TiResponseCache.peek(uri);
				} catch (URISyntaxException e) {
					Log.e(TAG, "URISyntaxException for url " + imageref.getUrl(), e);
					getAsync = false;
				} catch (NullPointerException e) {
					Log.e(TAG, "NullPointerException for url " + imageref.getUrl(), e);
					getAsync = false;
				}
				if (getAsync) {
					imageref.getBitmapAsync(downloadListener);
				} else {
					Bitmap bitmap = imageref.getBitmap(getParentView(), requestedWidth, requestedHeight);
					if (bitmap != null) {
						setImage(bitmap);
						if (!firedLoad) {
							fireLoad(TiC.PROPERTY_IMAGE);
							firedLoad = true;
						}
					} else {
						retryDecode(recycle);
					}
				}
			} else {
				setImage(imageref.getBitmap(getParentView(), requestedWidth, requestedHeight));
				if (!firedLoad) {
					fireLoad(TiC.PROPERTY_IMAGE);
					firedLoad = true;
				}
			}
		} else {
			setImages();
		}
	}

	private void setDefaultImage()
	{
		if (defaultImageSource == null) {
			setImage(null);
			return;
		}
		setImage(defaultImageSource.getBitmap(getParentView(), requestedWidth, requestedHeight));
	}

	private void retryDecode(final boolean recycle)
	{
		// Really odd Android 2.3/Gingerbread behavior -- BitmapFactory.decode* Skia functions
		// fail randomly and seemingly without a cause. Retry 5 times by default w/ 250ms between each try,
		// Usually the 2nd or 3rd try succeeds, but the "decodeRetries" property
		// will allow users to tweak this if needed
		Object retries = proxy.getProperty(PROPERTY_DECODE_RETRIES);
		final int maxRetries = retries == null ? DEFAULT_DECODE_RETRIES : (Integer) retries;
		if (decodeRetries < maxRetries) {
			decodeRetries++;
			proxy.getMainHandler().postDelayed(new Runnable()
			{
				public void run()
				{
					Log.d(TAG, "Retrying bitmap decode: " + decodeRetries + "/" + maxRetries);
					setImage(recycle);
				}
			}, 250);
		} else {
			String url = null;
			if (imageSources != null && imageSources.size() == 1) {
				url = imageSources.get(0).getUrl();
			}
			// Fire an error event when we've reached max retries
			fireError();
			Log.e(TAG, "Max retries reached, giving up decoding image source: " + url);
		}
	}

	@Override
	public void processProperties(KrollDict d)
	{
		TiImageView view = getView();
		View parentView = getParentView();

		if (view == null) {
			return;
		}

		if (d.containsKey(TiC.PROPERTY_WIDTH)) {
			if (TiC.LAYOUT_FILL.equals(d.getString(TiC.PROPERTY_WIDTH)) && parentView != null) {
				// Use the parent's width when it's fill
				requestedWidth = TiConvert.toTiDimension(parentView.getMeasuredWidth(), TiDimension.TYPE_WIDTH);
			} else {
				requestedWidth = TiConvert.toTiDimension(d, TiC.PROPERTY_WIDTH, TiDimension.TYPE_WIDTH);
			}
		}
		if (d.containsKey(TiC.PROPERTY_HEIGHT)) {
			// Use the parent's height when it's fill
			if (TiC.LAYOUT_FILL.equals(d.getString(TiC.PROPERTY_HEIGHT)) && parentView != null) {
				requestedHeight = TiConvert.toTiDimension(parentView.getMeasuredHeight(), TiDimension.TYPE_HEIGHT);
			} else {
				requestedHeight = TiConvert.toTiDimension(d, TiC.PROPERTY_HEIGHT, TiDimension.TYPE_HEIGHT);
			}
		}

		if (d.containsKey(TiC.PROPERTY_IMAGES)) {
			setImageSource(d.get(TiC.PROPERTY_IMAGES));
			setImages();
		} else if (d.containsKey(TiC.PROPERTY_URL)) {
			Log.w(TAG, "The url property of ImageView is deprecated, use image instead.");
			if (!d.containsKey(TiC.PROPERTY_IMAGE)) {
				d.put(TiC.PROPERTY_IMAGE, d.get(TiC.PROPERTY_URL));
			}
		}
		if (d.containsKey(TiC.PROPERTY_CAN_SCALE)) {
			view.setCanScaleImage(TiConvert.toBoolean(d, TiC.PROPERTY_CAN_SCALE));
		}
		if (d.containsKey(TiC.PROPERTY_ENABLE_ZOOM_CONTROLS)) {
			view.setEnableZoomControls(TiConvert.toBoolean(d, TiC.PROPERTY_ENABLE_ZOOM_CONTROLS));
		}
		if (d.containsKey(TiC.PROPERTY_DEFAULT_IMAGE)) {
			Object defaultImage = d.get(TiC.PROPERTY_DEFAULT_IMAGE);
			try {
				Object image = d.get(TiC.PROPERTY_IMAGE);

				if (image instanceof String) {
					String imageUrl = TiUrl.getCleanUri((String)image).toString();
					URI imageUri = new URI(imageUrl);
					if (URLUtil.isNetworkUrl(imageUrl) && !TiResponseCache.peek(imageUri)) {
						setDefaultImageSource(defaultImage);
					}

				} else if (image == null) {
					setDefaultImageSource(defaultImage);
				}

			} catch (URISyntaxException e) {
				setDefaultImageSource(defaultImage);
			} catch (NullPointerException e) {
				setDefaultImageSource(defaultImage);
			}
		}
		if (d.containsKey(TiC.PROPERTY_IMAGE)) {
			// processProperties is also called from TableView, we need check if we changed before re-creating the
			// bitmap
			boolean changeImage = true;
			Object newImage = d.get(TiC.PROPERTY_IMAGE);
			TiDrawableReference source = makeImageSource(newImage);

			// Check for orientation only if they specified an image
			if (d.containsKey(TiC.PROPERTY_AUTOROTATE)) {
				source.setAutoRotate(d.getBoolean(TiC.PROPERTY_AUTOROTATE));
			}

			if (imageSources != null && imageSources.size() == 1) {
				if (imageSources.get(0).equals(source)) {
					changeImage = false;
				}
			}

			if (changeImage) {
				setImageSource(source);
				firedLoad = false;
				setImage(false);
			}

		} else {
			if (!d.containsKey(TiC.PROPERTY_IMAGES)) {
				getProxy().setProperty(TiC.PROPERTY_IMAGE, null);
				if (defaultImageSource != null) {
					setDefaultImage();
				}
			}
		}

		super.processProperties(d);
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		TiImageView view = getView();
		if (view == null) {
			return;
		}
		if (key.equals(TiC.PROPERTY_CAN_SCALE)) {
			view.setCanScaleImage(TiConvert.toBoolean(newValue));
		} else if (key.equals(TiC.PROPERTY_ENABLE_ZOOM_CONTROLS)) {
			view.setEnableZoomControls(TiConvert.toBoolean(newValue));
		} else if (key.equals(TiC.PROPERTY_URL)) {
			Log.w(TAG, "The url property of ImageView is deprecated, use image instead.");
			setImageSource(newValue);
			firedLoad = false;
			setImage(true);
		} else if (key.equals(TiC.PROPERTY_IMAGE)) {
			setImageSource(newValue);
			firedLoad = false;
			setImage(true);
		} else if (key.equals(TiC.PROPERTY_IMAGES)) {
			if (newValue instanceof Object[]) {
				setImageSource(newValue);
				setImages();
			}
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	public void onDestroy(Activity activity)
	{
	}

	public void onPause(Activity activity)
	{
		pause();
	}

	public void onResume(Activity activity)
	{
		resume();
	}

	public void onStart(Activity activity)
	{
	}

	public void onStop(Activity activity)
	{
		stop();
	}

	public boolean isAnimating()
	{
		return animating.get() && !paused;
	}
	
	public boolean isPaused()
	{
		return paused;
	}

	public boolean isReverse()
	{
		return reverse;
	}

	public void setReverse(boolean reverse)
	{
		this.reverse = reverse;
	}

	public TiBlob toBlob()
	{
		TiImageView view = getView();
		if (view != null) {
			Drawable drawable = view.getImageDrawable();
			if (drawable != null && drawable instanceof BitmapDrawable) {
				Bitmap bitmap = ((BitmapDrawable) drawable).getBitmap();
				return bitmap == null ? null : TiBlob.blobFromImage(bitmap);
			}
		}

		return null;
	}

	@Override
	public void setOpacity(float opacity)
	{
		TiImageView view = getView();
		if (view != null) {
			view.setColorFilter(TiUIHelper.createColorFilterForOpacity(opacity));
			super.setOpacity(opacity);
		}
	}

	@Override
	public void clearOpacity(View view)
	{
		super.clearOpacity(view);
		TiImageView iview = getView();
		if (iview != null) {
			iview.setColorFilter(null);
		}
	}

	@Override
	public void release()
	{
		super.release();
		if (loader != null) {
			synchronized (loader) {
				loader.notify();
			}
			loader = null;
		}
		animating.set(false);
		isStopping.set(true);
		synchronized(releasedLock) {
			if (imageSources != null) {
				imageSources.clear();
				imageSources = null;
			}
			
		}
		
		if (timer != null) {
			timer.cancel();
			timer = null;
		}
		defaultImageSource = null;
	}
}
