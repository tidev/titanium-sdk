/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUIImageView;
import android.app.Activity;

@Kroll.proxy(creatableInModule=UIModule.class)
public class ImageViewProxy extends ViewProxy {

	public ImageViewProxy(TiContext tiContext) {
		super(tiContext);
	}

	@Override
	public TiUIView createView(Activity activity) {
		return new TiUIImageView(this);
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
	
	@Kroll.setProperty @Kroll.method
	public void setReverse(boolean reverse) {
		getImageView().setReverse(reverse);
	}
	
	@Kroll.method
	public TiBlob toBlob() {
		return getImageView().toBlob();
	}
}
