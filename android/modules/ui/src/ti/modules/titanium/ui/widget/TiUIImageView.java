/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import java.io.IOException;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.atomic.AtomicBoolean;

import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.TiContext.OnLifecycleEvent;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiBackgroundImageLoadTask;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.filesystem.FileProxy;
import android.graphics.Bitmap;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.view.View;
import android.view.View.OnClickListener;

public class TiUIImageView extends TiUIView
	implements OnClickListener, OnLifecycleEvent
{
	private static final String LCAT = "TiUIImageView";
	private static final boolean DBG = TiConfig.LOGD;

	private static final String EVENT_CLICK = "click";

	private Timer timer;
	private AnimationTask animationTask;
	private Drawable[] drawables;
	private AtomicBoolean animating = new AtomicBoolean(false);
	private boolean reverse = false;

	private class BgImageLoader extends TiBackgroundImageLoadTask
	{

		public BgImageLoader(TiContext tiContext, Integer imageWidth, Integer imageHeight) {
			super(tiContext, imageWidth, imageHeight);
		}

		@Override
		protected void onPostExecute(Drawable d) {
			super.onPostExecute(d);

			if (d != null) {
				TiImageView view = getView();
				if (view != null) {
					view.setImageDrawable(d);
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
		view.setOnClickListener(this);
	}

	private TiImageView getView() {
		return (TiImageView) nativeView;
	}

	public Drawable createImage(Object image)
	{
		if (image instanceof TiBlob) {
			TiBlob blob = (TiBlob)image;
			return new BitmapDrawable(TiUIHelper.createBitmap(blob.getInputStream()));
		} else if (image instanceof FileProxy) {
			FileProxy file = (FileProxy)image;
			try {
				return new BitmapDrawable(TiUIHelper.createBitmap(file.getBaseFile().getInputStream()));
			} catch (IOException e) {
				Log.e(LCAT, "Error creating drawable from file: " + file.getBaseFile().getNativeFile().getName(), e);
			}
		} else if (image instanceof String) {
			String url = proxy.getTiContext().resolveUrl(null, (String)image);
			TiBaseFile file = TiFileFactory.createTitaniumFile(proxy.getTiContext(), new String[] { url }, false);
			try {
				return new BitmapDrawable(TiUIHelper.createBitmap(file.getInputStream()));
			} catch (IOException e) {
				Log.e(LCAT, "Error creating drawable from path: " + image.toString(), e);
			}
		} else if (image instanceof TiDict) {
			TiBlob blob = TiUIHelper.getImageFromDict((TiDict)image);
			if (blob != null) {
				return new BitmapDrawable(TiUIHelper.createBitmap(blob.getInputStream()));
			} else {
				Log.e(LCAT, "Couldn't find valid image in object: " + image.toString());
			}
		}
		return null;
	}

	public void setImage(final Drawable drawable)
	{
		if (drawable != null) {
			if (!proxy.getTiContext().isUIThread()) {
				proxy.getTiContext().getActivity().runOnUiThread(new Runnable(){
					public void run() {
						getView().setImageDrawable(drawable, false);
					}
				});
			} else {
				getView().setImageDrawable(drawable, false);
			}
		}
	}

	public void setImages(final Object[] images)
	{
		proxy.getTiContext().getActivity().runOnUiThread(new Runnable(){
			public void run() {
				if (images == null) return;

				TiUIImageView.this.drawables = new Drawable[images.length];
				for (int i = 0; i < images.length; i++) {
					Drawable drawable = createImage(images[i]);
					if (drawable != null) {
						TiUIImageView.this.drawables[i] = drawable;
					}
				}

				if (images.length > 0) {
					getView().setImageDrawable(drawables[0], false);
					fireLoad("images");
				}
			}
		});
	}

	public double getDuration()
	{
		if (proxy.getDynamicValue("duration") != null) {
			return TiConvert.toDouble(proxy.getDynamicValue("duration"));
		}

		if (drawables != null) {
			return drawables.length * 33;
		}
		return 100;
	}

	private void fireLoad(String state)
	{
		TiDict data = new TiDict();
		data.put("state", state);
		proxy.fireEvent("load", data);
	}

	private void fireStart()
	{
		TiDict data = new TiDict();
		proxy.fireEvent("start", data);
	}

	private void fireChange(int index)
	{
		TiDict data = new TiDict();
		data.put("index", index);
		proxy.fireEvent("change", data);
	}

	private void fireStop()
	{
		TiDict data = new TiDict();
		proxy.fireEvent("stop", data);
	}

	private class AnimationTask extends TimerTask
	{
		public boolean started = false;
		public boolean paused = false;
		public int index = 0;

		@Override
		public void run()
		{
			synchronized(this) {
				if (!paused) {
					animating.set(true);
					if (!started) {
						fireStart();
						started = true;
					}

					if (index < drawables.length && index >= 0) {
						setImage(drawables[index]);
						fireChange(index);
					} else {
						if (index < 0) {
							index = drawables.length-1;
						} else if (index >= drawables.length) {
							index = 0;
						}
						setImage(drawables[index]);
						fireChange(index);
					}

					if (!reverse) {
						index++;
					} else {
						index--;
					}
				} else {
					animating.set(false);
				}
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
		if (animationTask == null) {

			timer = new Timer();
			animationTask = new AnimationTask();
			int duration = (int) getDuration();
			timer.schedule(animationTask, duration, duration);
		} else {
			resume();
		}
	}

	public void pause()
	{
		if (animationTask != null) {
			synchronized(animationTask) {
				animationTask.paused = true;
			}
		}
	}

	public void resume()
	{
		if (animationTask != null) {
			synchronized(animationTask) {
				animationTask.paused = false;
			}
		}
	}

	public void stop()
	{
		if (timer != null) {
			timer.cancel();
		}
		timer = null;
		animationTask = null;
		animating.set(false);

		fireStop();
	}

	@Override
	public void processProperties(TiDict d)
	{
		TiImageView view = getView();

		if (d.containsKey("url")) {
			new BgImageLoader(getProxy().getTiContext(), null, null).load(TiConvert.toString(d, "url"));
		}
		if (d.containsKey("canScale")) {
			view.setCanScaleImage(TiConvert.toBoolean(d, "canScale"));
		}
		if (d.containsKey("image")) {
			setImage(createImage(d.get("image")));
		} else {
			getProxy().internalSetDynamicValue("image", null, false);
		}
		if (d.containsKey("images")) {
			Object o = d.get("images");
			if (o instanceof Object[]) {
				setImages((Object[])o);
			}
		}

		super.processProperties(d);
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, TiProxy proxy)
	{
		TiImageView view = getView();

		if (key.equals("canScale")) {
			view.setCanScaleImage(TiConvert.toBoolean(newValue));
		} else if (key.equals("url")) {
			new BgImageLoader(getProxy().getTiContext(), null, null).load(TiConvert.toString(newValue));
		} else if (key.equals("image")) {
			setImage(createImage(newValue));
		} else if (key.equals("images")) {
			if (newValue instanceof Object[]) {
				setImages((Object[])newValue);
			}
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}


	public void onDestroy() {
		if (drawables != null) {
			for (int i = 0; i < drawables.length; i++) {
				BitmapDrawable d = (BitmapDrawable) drawables[i];
				d.getBitmap().recycle();
			}
			drawables = new Drawable[0];
		}
	}

	public void onPause() {
		pause();
	}

	public void onResume() {
		resume();
	}

	public void onStart() {
	}

	public void onStop() {
		stop();
	}

	public void onClick(View view) {
		proxy.fireEvent(EVENT_CLICK, null);
	}

	public boolean isAnimating() {
		return animating.get();
	}

	public boolean isReverse() {
		return reverse;
	}

	public void setReverse(boolean reverse) {
		if (animationTask != null) {
			synchronized(animationTask) {
				this.reverse = reverse;
			}
		} else {
			this.reverse = reverse;
		}
	}

	public TiBlob toBlob ()
	{
		Drawable drawable = getView().getImageDrawable();
		if (drawable != null && drawable instanceof BitmapDrawable) {
			Bitmap bitmap = ((BitmapDrawable)drawable).getBitmap();
			return TiBlob.blobFromImage(proxy.getTiContext(), bitmap);
		}

		return null;
	}
}
