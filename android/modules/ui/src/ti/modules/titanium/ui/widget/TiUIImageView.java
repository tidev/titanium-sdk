/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import java.util.ArrayList;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiContext.OnLifecycleEvent;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.AsyncResult;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiBackgroundImageLoadTask;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiDrawableReference;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.filesystem.FileProxy;
import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.os.Handler;
import android.os.Message;
import android.view.View;

public class TiUIImageView extends TiUIView
	implements OnLifecycleEvent, Handler.Callback
{
	private static final String LCAT = "TiUIImageView";
	private static final boolean DBG = TiConfig.LOGD;

	private static final AtomicInteger imageTokenGenerator = new AtomicInteger(0);
	private static final int FRAME_QUEUE_SIZE = 5;

	private Timer timer;
	private Animator animator;
	private Object[] images;
	private Loader loader;
	private Thread loaderThread;
	private AtomicBoolean animating = new AtomicBoolean(false);
	private boolean reverse = false;
	private boolean paused = false;
	private int token;
	private boolean firedLoad;
	
	private TiDimension requestedWidth;
	private TiDimension requestedHeight;
	
	private ArrayList<TiDrawableReference> imageSources;
	private TiDrawableReference defaultImageSource;

	private class BgImageLoader extends TiBackgroundImageLoadTask
	{
		private int token;

		public BgImageLoader(TiContext tiContext, TiDimension imageWidth, TiDimension imageHeight, int token) {
			super(tiContext, imageWidth, imageHeight);
			this.token = token;
		}

		@Override
		protected void onPostExecute(Drawable d) {
			super.onPostExecute(d);

			if (d != null) {
				setImageDrawable(d, token);
			} else {
				if (DBG) {
					String traceMsg = "Background image load returned null";
					if (proxy.hasProperty("image")) {
						Object image = proxy.getProperty("image");
						if (image instanceof String) {
							traceMsg += " (" + TiConvert.toString(image) + ")";
						}
					}
					Log.d(LCAT, traceMsg);
				}
			}
		}
	}

	public TiUIImageView(TiViewProxy proxy) {
		super(proxy);

		if (DBG) {
			Log.d(LCAT, "Creating an ImageView");
		}

		TiImageView view = new TiImageView(proxy.getContext());
		setNativeView(view);
		proxy.getTiContext().addOnLifecycleEventListener(this);
	}

	private TiImageView getView() {
		return (TiImageView) nativeView;
	}
	// This method is intented to only be use from the background task, it's basically
	// an optimistic commit.
	private void setImageDrawable(Drawable d, int token) {
		TiImageView view = getView();
		if (view != null) {
			synchronized(imageTokenGenerator) {
				if (this.token == token) {
					view.setImageDrawable(d, false);
					token = -1;
				}
			}
		}
	}

	private Handler handler = new Handler(this);
	private static final int SET_IMAGE = 10001;

	@Override
	public boolean handleMessage(Message msg) {
		if (msg.what == SET_IMAGE) {
			AsyncResult result = (AsyncResult)msg.obj;
			TiImageView view = getView();
			if (view != null) {
				view.setImageBitmap((Bitmap)result.getArg());
				result.setResult(null);
			}
		}
		return false;
	}

	private void setImage(final Bitmap bitmap)
	{
		if (bitmap != null) {
			if (!proxy.getTiContext().isUIThread()) {
				Message msg = Message.obtain(handler, SET_IMAGE);
				AsyncResult result = new AsyncResult(bitmap);
				msg.obj = result;
				msg.sendToTarget();
				result.getResult();
			} else {
				TiImageView view = getView();
				if (view != null) {
					view.setImageBitmap(bitmap);
				}
			}
		}
	}

	private class BitmapWithIndex {
		public BitmapWithIndex(Bitmap b, int i) {
			this.bitmap = b;
			this.index = i;
		}

		public Bitmap bitmap;
		public int index;
	}

	private class Loader implements Runnable
	{
		public static final int INFINITE = 0;

		private ArrayBlockingQueue<BitmapWithIndex> bitmapQueue;
		private int repeatIndex = 0;

		public Loader()
		{
			bitmapQueue = new ArrayBlockingQueue<BitmapWithIndex>(FRAME_QUEUE_SIZE);
		}

		private int getRepeatCount() {
			if (proxy.hasProperty("repeatCount")) {
				return TiConvert.toInt(proxy.getProperty("repeatCount"));
			}
			return INFINITE;
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
			if (reverse) { return imageSources.size()-1; }
			return 0;
		}

		private boolean isNotFinalFrame(int frame)
		{
			if (reverse) { return frame >= 0; }
			return frame < imageSources.size();
		}
		private int getCounter()
		{
			if (reverse) { return -1; }
			return 1;
		}

		public void run()
		{
			if (getProxy() == null) {
				Log.d(LCAT, "Multi-image loader exiting early because proxy has been gc'd");
				return;
			}
			TiContext context = getProxy().getTiContext();
			if (context == null) {
				Log.d(LCAT, "Multi-image loader exiting early because context has been gc'd");
				return;
			}
			repeatIndex = 0;
			animating.set(true);
			firedLoad = false;
			topLoop: while(isRepeating()) {
				long time = System.currentTimeMillis();
				for (int j = getStart(); isNotFinalFrame(j); j+=getCounter()) {
					if (bitmapQueue.size() == FRAME_QUEUE_SIZE && !firedLoad) {
						fireLoad("images");
						firedLoad = true;
					}
					if (paused && !Thread.currentThread().isInterrupted()) {
						try {
							Log.i(LCAT, "Pausing");
							synchronized(loader) {
								loader.wait();
							}
							Log.i(LCAT, "Waking from pause.");
						} catch (InterruptedException e) {
							Log.w(LCAT, "Interrupted from paused state.");
						}
					}
					if (!animating.get()) {
						break topLoop;
					}
					Bitmap b = imageSources.get(j).getBitmap();
					try {
						bitmapQueue.put(new BitmapWithIndex(b, j));
					} catch (InterruptedException e) {
						e.printStackTrace();
					}
					repeatIndex++;
				}
				if (DBG) {
					Log.d(LCAT, "TIME TO LOAD FRAMES: "+(System.currentTimeMillis()-time)+"ms");
				}
			}
			animating.set(false);
		}

		public ArrayBlockingQueue<BitmapWithIndex> getBitmapQueue()
		{
			return bitmapQueue;
		}
	}

	private void setImages()
	{
		if (imageSources == null || imageSources.size() == 0) {
			return;
		}
		if (loader == null) {
			paused = false;
			firedLoad = false;
			loader = new Loader();
			Thread loaderThread = new Thread(loader);
			if (DBG) {
				Log.d(LCAT, "STARTING LOADER THREAD "+loaderThread +" for "+this);
			}
			loaderThread.start();
		}
	}

	public double getDuration()
	{
		if (proxy.getProperty("duration") != null) {
			return TiConvert.toDouble(proxy.getProperty("duration"));
		}

		if (images != null) {
			return images.length * 33;
		}
		return 100;
	}

	private void fireLoad(String state)
	{
		KrollDict data = new KrollDict();
		data.put("state", state);
		proxy.fireEvent("load", data);
	}

	private void fireStart()
	{
		KrollDict data = new KrollDict();
		proxy.fireEvent("start", data);
	}

	private void fireChange(int index)
	{
		KrollDict data = new KrollDict();
		data.put("index", index);
		proxy.fireEvent("change", data);
	}

	private void fireStop()
	{
		KrollDict data = new KrollDict();
		proxy.fireEvent("stop", data);
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
			try {
				BitmapWithIndex b = loader.getBitmapQueue().take();
				if (DBG) {
					Log.d(LCAT, "set image: "+b.index);
				}
				setImage(b.bitmap);
				fireChange(b.index);
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		}
	}

	public void start()
	{
		if (!proxy.getTiContext().isUIThread()) {
			proxy.getTiContext().getActivity().runOnUiThread(new Runnable() {
				public void run() {
					handleStart();
				}
			});
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
				if (DBG) {
					Log.d(LCAT, "STARTING LOADER THREAD "+loaderThread +" for "+this);
				}
			}

			animator = new Animator(loader);
			if (!animating.get()) {
				new Thread(loader).start();
			}

			int duration = (int) getDuration();
			fireStart();
			timer.schedule(animator, duration, duration);
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
		if (loader != null) {
			synchronized(loader) {
				loader.notify();
			}
		}
	}

	public void stop()
	{
		if (timer != null) {
			timer.cancel();
		}
		animating.set(false);

		if (loaderThread != null) {
			loaderThread.interrupt();
			loaderThread = null;
		}
		loader = null;
		timer = null;
		animator = null;
		paused = false;

		fireStop();
	}

	private void setImageSource(Object object)
	{
		imageSources = new ArrayList<TiDrawableReference>();
		if (object instanceof Object[]) {
			for(Object o : (Object[])object) {
				if (o instanceof FileProxy) {
					imageSources.add( TiDrawableReference.fromFile(getProxy().getTiContext(), ((FileProxy)o).getBaseFile()) );
				} else {
					imageSources.add( TiDrawableReference.fromObject(getProxy().getTiContext(), o));
				}
			}
		} else if (object instanceof FileProxy) {
			imageSources.add( TiDrawableReference.fromFile(getProxy().getTiContext(), ((FileProxy)object).getBaseFile()));
		} else {
			imageSources.add( TiDrawableReference.fromObject(getProxy().getTiContext(), object) );
		}
	}
	
	private void setDefaultImageSource(Object object)
	{
		if (object instanceof FileProxy) {
			defaultImageSource = TiDrawableReference.fromFile(getProxy().getTiContext(), ((FileProxy)object).getBaseFile());
		} else {
			defaultImageSource = TiDrawableReference.fromObject(getProxy().getTiContext(), object);
		}
	}
	
	private void setImage()
	{
		if (imageSources == null || imageSources.size() == 0) {
			setImage(null);
			return;
		}
		
		if (imageSources.size() == 1) {
			TiDrawableReference imageref = imageSources.get(0);
			if (imageref.isNetworkUrl()) {
				if (defaultImageSource != null) {
					setDefaultImage();
				}
				synchronized(imageTokenGenerator) {
					token = imageTokenGenerator.incrementAndGet();
					TiImageView view = getView();
					if (view != null) {
						view.setImageDrawable(null);
						imageref.getBitmapAsync(new BgImageLoader(getProxy().getTiContext(), requestedWidth, requestedHeight, token));
					}
				}
			} else {
				setImage(imageref.getBitmap(requestedWidth, requestedHeight));
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
		setImage(defaultImageSource.getBitmap(requestedWidth, requestedHeight));
	}
	
	@Override
	public void processProperties(KrollDict d)
	{
		TiImageView view = getView();
		if (view == null) {
			return;
		}
		
		if (d.containsKey("width")) {
			requestedWidth = TiConvert.toTiDimension(d, "width");
		}
		if (d.containsKey("height")) {
			requestedHeight = TiConvert.toTiDimension(d, "height");
		}

		if (d.containsKey("images")) {
			setImageSource(d.get("images"));
			setImages();
		}
		else if (d.containsKey("url")) {
			Log.w(LCAT, "The url property of ImageView is deprecated, use image instead.");
			if (!d.containsKey("image")) {
				d.put("image", d.get("url"));
			}
		}
		if (d.containsKey("canScale")) {
			view.setCanScaleImage(TiConvert.toBoolean(d, "canScale"));
		}
		if (d.containsKey("enableZoomControls")) {
			view.setEnableZoomControls(TiConvert.toBoolean(d, "enableZoomControls"));
		}
		if (d.containsKey("defaultImage")) {
			setDefaultImageSource(d.get("defaultImage"));
		}
		if (d.containsKey("image")) {
			setImageSource(d.get("image"));
			setImage();
		} else {
			if (!d.containsKey("images")) {
				getProxy().setProperty("image", null);
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
		if (key.equals("canScale")) {
			view.setCanScaleImage(TiConvert.toBoolean(newValue));
		} else if (key.equals("enableZoomControls")) {
			view.setEnableZoomControls(TiConvert.toBoolean(newValue));
		} else if (key.equals("url")) {
			setImageSource(newValue);
			setImage();
		} else if (key.equals("image")) {
			setImageSource(newValue);
			setImage();
		} else if (key.equals("images")) {
			if (newValue instanceof Object[]) {
				setImageSource(newValue);
				setImages();
			}
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}


	public void onDestroy(Activity activity) {
	}

	public void onPause(Activity activity) {
		pause();
	}

	public void onResume(Activity activity) {
		resume();
	}

	public void onStart(Activity activity) {
	}

	public void onStop(Activity activity) {
		stop();
	}

	public boolean isAnimating() {
		return animating.get() && !paused;
	}

	public boolean isReverse() {
		return reverse;
	}

	public void setReverse(boolean reverse) {
		this.reverse = reverse;
	}

	public TiBlob toBlob ()
	{
		TiImageView view = getView();
		if (view != null) {
			Drawable drawable = view.getImageDrawable();
			if (drawable != null && drawable instanceof BitmapDrawable) {
				Bitmap bitmap = ((BitmapDrawable)drawable).getBitmap();
				return TiBlob.blobFromImage(proxy.getTiContext(), bitmap);
			}
		}

		return null;
	}
	
	@Override
	public void setOpacity(float opacity) {
		TiImageView view = getView();
		if (view != null) {
			view.setColorFilter(TiUIHelper.createColorFilterForOpacity(opacity));
			super.setOpacity(opacity);
		}
	}
	
	@Override
	public void clearOpacity(View view) {
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
		if (imageSources != null) {
			imageSources.clear();
		}
		imageSources = null;
		defaultImageSource = null;
	}
}
