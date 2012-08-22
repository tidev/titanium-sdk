/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.util.ArrayList;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiDrawableReference;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUIImageView;
import android.app.Activity;
import android.graphics.Bitmap;

@Kroll.proxy(creatableInModule=UIModule.class, propertyAccessors = {
	"decodeRetries",
	TiC.PROPERTY_AUTOROTATE,
	TiC.PROPERTY_DEFAULT_IMAGE,
	TiC.PROPERTY_DURATION,
	TiC.PROPERTY_ENABLE_ZOOM_CONTROLS,
	TiC.PROPERTY_IMAGE,
	TiC.PROPERTY_IMAGES,
	TiC.PROPERTY_REPEAT_COUNT,
	TiC.PROPERTY_URL
})
public class ImageViewProxy extends ViewProxy
{
	private Bitmap bitmap;
	private ArrayList<TiDrawableReference> imageSources;

	public ImageViewProxy()
	{
		super();
	}

	public ImageViewProxy(TiContext tiContext)
	{
		this();
	}

	@Override
	public TiUIView createView(Activity activity) {
		return new TiUIImageView(this);
	}

	public Bitmap getBitmap()
	{
		if (bitmap != null && bitmap.isRecycled())
		{
			// Cleanup after recycled bitmaps
			bitmap = null;
		}
		return bitmap;
	}

	public ArrayList<TiDrawableReference> getImageSources()
	{
		return imageSources;
	}

	public void onImageSourcesChanged(TiUIImageView imageView, ArrayList<TiDrawableReference> imageSources)
	{
		this.imageSources = imageSources;
		// The current cached bitmap, if any, can't be trusted now
		onBitmapChanged(imageView, null);
	}

	public void onBitmapChanged(TiUIImageView imageView, Bitmap bitmap)
	{
		this.bitmap = bitmap;
	}

	public boolean inTableView()
	{
		TiViewProxy parent = getParent();
		while (parent != null) {
			if (parent instanceof TableViewProxy) {
				return true;
			}
			parent = parent.getParent();
		}
		return false;
	}

	private TiUIImageView getImageView() {
		return (TiUIImageView) getOrCreateView();
	}
	
	@Kroll.method
	public void start() {
		getImageView().start();
	}
	
	@Kroll.method
	public void stop() {
		getImageView().stop();
	}
	
	@Kroll.method
	public void pause() {
		getImageView().pause();
	}
	
	@Kroll.method
	public void resume() {
		getImageView().resume();
	}
	
	@Kroll.getProperty @Kroll.method
	public boolean getAnimating() {
		return getImageView().isAnimating();
	}
	
	@Kroll.getProperty @Kroll.method
	public boolean getPaused() 
	{
		return getImageView().isPaused();
	}
	
	@Kroll.getProperty @Kroll.method
	public boolean getReverse() {
		return getImageView().isReverse();
	}
	
	@Kroll.setProperty(runOnUiThread=true) @Kroll.method(runOnUiThread=true)
	public void setReverse(boolean reverse) {
		getImageView().setReverse(reverse);
	}
	
	@Kroll.method
	public TiBlob toBlob() {
		return getImageView().toBlob();
	}

	@Override
	public void releaseViews()
	{
		bitmap = null;
		imageSources = null;
		super.releaseViews();
	}
}
