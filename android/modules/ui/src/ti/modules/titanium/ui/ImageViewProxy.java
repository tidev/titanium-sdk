/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.util.ArrayList;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiDrawableReference;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUIImageView;
import android.app.Activity;
import android.graphics.Bitmap;

@Kroll.proxy(creatableInModule=UIModule.class)
public class ImageViewProxy extends ViewProxy {

	// We use these property to key an existing bitmap / sources when views and proxies are being swapped inside a TableView
	private static final String PROPERTY_INTERNAL_BITMAP = "_internalBitmap";
	private static final String PROPERTY_INTERNAL_SOURCES = "_internalSources";

	public ImageViewProxy(TiContext tiContext) {
		super(tiContext);
	}

	@Override
	public TiUIView createView(Activity activity) {
		return new TiUIImageView(this);
	}

	public Bitmap getBitmap()
	{
		Bitmap bitmap = (Bitmap) getProperty(PROPERTY_INTERNAL_BITMAP);
		if (bitmap != null && bitmap.isRecycled())
		{
			// Cleanup after recycled bitmaps
			properties.remove(PROPERTY_INTERNAL_BITMAP);
			return null;
		}
		return bitmap;
	}

	@SuppressWarnings("unchecked")
	public ArrayList<TiDrawableReference> getImageSources()
	{
		return (ArrayList<TiDrawableReference>) getProperty(PROPERTY_INTERNAL_SOURCES);
	}

	public void onImageSourcesChanged(TiUIImageView imageView, ArrayList<TiDrawableReference> imageSources)
	{
		setProperty(PROPERTY_INTERNAL_SOURCES, imageSources);
		// The current cached bitmap, if any, can't be trusted now
		onBitmapChanged(imageView, null);
	}

	public void onBitmapChanged(TiUIImageView imageView, Bitmap bitmap)
	{
		setProperty(PROPERTY_INTERNAL_BITMAP, bitmap);
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
		return (TiUIImageView)getView(getTiContext().getActivity());
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
		if (hasProperty(PROPERTY_INTERNAL_BITMAP)) {
			properties.remove(PROPERTY_INTERNAL_BITMAP);
		}
		if (hasProperty(PROPERTY_INTERNAL_SOURCES)) {
			properties.remove(PROPERTY_INTERNAL_SOURCES);
		}
		super.releaseViews();
	}
}
