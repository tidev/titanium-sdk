/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.media;

import java.io.IOException;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;

import android.hardware.Camera;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;
import android.widget.FrameLayout;

public class TiUICameraPreview extends TiUIView implements SurfaceHolder.Callback
{
	private static final String TAG = "TiUICameraPreview";

	private Camera camera;
	private TiCompositeLayout overlayLayout;

	public TiUICameraPreview(TiViewProxy proxy, Camera camera)
	{
		super(proxy);

		this.camera = camera;
		SurfaceView preview = new SurfaceView(proxy.getActivity());

		SurfaceHolder previewHolder = preview.getHolder();
		previewHolder.addCallback(this);

		// this call is deprecated but we still need it for SDK level 7 otherwise kaboom
		previewHolder.setType(SurfaceHolder.SURFACE_TYPE_PUSH_BUFFERS);

		FrameLayout previewLayout = new FrameLayout(proxy.getActivity());
		previewLayout.addView(preview, layoutParams);

		//TextView tv = new TextView(proxy.getTiContext().getActivity());
		//tv.setTextColor(Color.RED);
		//tv.setText("My overlay");
		//previewLayout.addView(tv, new LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT));

		overlayLayout = new TiCompositeLayout(proxy.getActivity(), proxy);
		previewLayout.addView(overlayLayout);

		setNativeView(previewLayout);

		Log.i(TAG, "Camera started", Log.DEBUG_MODE);
	}

	public void surfaceChanged(SurfaceHolder previewHolder, int format, int width, int height) {
		Log.i(TAG, "Staring preview", Log.DEBUG_MODE);
		camera.startPreview();  // make sure setPreviewDisplay is called before this
	}

	public void surfaceCreated(SurfaceHolder previewHolder) {
		Log.i(TAG, "Opening camera", Log.DEBUG_MODE);

		try {
			Log.i(TAG, "Setting preview display", Log.DEBUG_MODE);
			camera.setPreviewDisplay(previewHolder);

			//Parameters cameraParams = camera.getParameters();
			//cameraParams.setPreviewSize(100, 100);
			//camera.setParameters(cameraParams);
		} catch(IOException e) {
			e.printStackTrace();
		}
	}

	// make sure to call release() otherwise you will have to force kill the app before 
	// the built in camera will open
	public void surfaceDestroyed(SurfaceHolder previewHolder) {
		camera.release();
		camera = null;
	}

	@Override
	public void add(TiUIView overlayItem)
	{
		if (overlayItem != null) {
			View overlayItemView = overlayItem.getNativeView();
			if (overlayItemView != null) {
				overlayLayout.addView(overlayItemView, overlayItem.getLayoutParams());
			}
		}
	}
}
