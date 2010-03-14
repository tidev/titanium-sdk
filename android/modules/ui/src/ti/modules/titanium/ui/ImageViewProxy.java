/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUIImageView;
import android.app.Activity;

public class ImageViewProxy extends ViewProxy {

	public ImageViewProxy(TiContext tiContext, Object[] args) {
		super(tiContext, args);
	}

	@Override
	public TiUIView createView(Activity activity) {
		return new TiUIImageView(this);
	}
	
	private TiUIImageView getImageView() {
		return (TiUIImageView)getView(getTiContext().getActivity());
	}
	
	public void start() {
		getImageView().start();
	}
	
	public void stop() {
		getImageView().stop();
	}
	
	public void pause() {
		getImageView().pause();
	}
	
	public void resume() {
		getImageView().resume();
	}
	
	public boolean getAnimating() {
		return getImageView().isAnimating();
	}
	
	public boolean getReverse() {
		return getImageView().isReverse();
	}
	
	public void setReverse(boolean reverse) {
		getImageView().setReverse(reverse);
	}
	
	public TiBlob toBlob() {
		return getImageView().toBlob();
	}
}
