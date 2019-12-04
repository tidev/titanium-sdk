/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUIImageView;
import android.app.Activity;
// clang-format off
@Kroll.proxy(creatableInModule = UIModule.class,
	propertyAccessors = {
		TiC.PROPERTY_DECODE_RETRIES,
		TiC.PROPERTY_AUTOROTATE,
		TiC.PROPERTY_DEFAULT_IMAGE,
		TiC.PROPERTY_DURATION,
		TiC.PROPERTY_ENABLE_ZOOM_CONTROLS,
		TiC.PROPERTY_IMAGE,
		TiC.PROPERTY_IMAGES,
		TiC.PROPERTY_REPEAT_COUNT,
		TiC.PROPERTY_URL
})
// clang-format on
public class ImageViewProxy extends ViewProxy
{
	public ImageViewProxy()
	{
		super();
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUIImageView(this);
	}

	@Override
	protected TiBlob handleToImage()
	{
		return this.toBlob();
	}

	private TiUIImageView getImageView()
	{
		return (TiUIImageView) getOrCreateView();
	}

	@Kroll.method
	public void start()
	{
		getImageView().start();
	}

	@Kroll.method
	public void stop()
	{
		getImageView().stop();
	}

	@Kroll.method
	public void pause()
	{
		getImageView().pause();
	}

	@Kroll.method
	public void resume()
	{
		getImageView().resume();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public boolean getAnimating()
	// clang-format on
	{
		return getImageView().isAnimating();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public boolean getPaused()
	// clang-format on
	{
		return getImageView().isPaused();
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public boolean getReverse()
	// clang-format on
	{
		return getImageView().isReverse();
	}

	// clang-format off
	@Kroll.setProperty(runOnUiThread = true)
	@Kroll.method(runOnUiThread = true)
	public void setReverse(boolean reverse)
	// clang-format on
	{
		getImageView().setReverse(reverse);
	}

	@Kroll.method
	public TiBlob toBlob()
	{
		return getImageView().toBlob();
	}

	// clang-format off
	@Kroll.setProperty(runOnUiThread = true)
	@Kroll.method(runOnUiThread = true)
	public void setTintColor(String color)
	// clang-format on
	{
		getImageView().setTintColor(color);
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public int getTintColor()
	// clang-format on
	{
		return getImageView().getTintColor();
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.ImageView";
	}
}
