/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.media;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.List;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.graphics.Color;
import android.hardware.Camera;
import android.hardware.Camera.Parameters;
import android.hardware.Camera.PictureCallback;
import android.hardware.Camera.Size;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.ViewGroup.LayoutParams;
import android.widget.FrameLayout;

public class TiCameraActivity extends TiBaseActivity implements SurfaceHolder.Callback {
	private static final String TAG = "TiCameraActivity";
	private static Camera camera;

	private TiViewProxy localOverlayProxy = null;
	private SurfaceView preview;
	private PreviewLayout previewLayout;
	private FrameLayout cameraLayout;
	private boolean previewRunning = false;

	public static TiViewProxy overlayProxy = null;
	public static TiCameraActivity cameraActivity = null;

	public static KrollObject callbackContext;
	public static KrollFunction successCallback, errorCallback, cancelCallback;
	public static boolean saveToPhotoGallery = false;

	private static class PreviewLayout extends FrameLayout {
		private double aspectRatio;

		public PreviewLayout(Context context) {
			super(context);
			setAspectRatio(4.0/3.0);
		}

		public void setAspectRatio(double aspectRatio) {
			this.aspectRatio = aspectRatio;
		}

		@Override
		protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
			int previewWidth = MeasureSpec.getSize(widthMeasureSpec);
			int previewHeight = MeasureSpec.getSize(heightMeasureSpec);

			// Resize the preview frame with correct aspect ratio.
			if (previewWidth > previewHeight * aspectRatio) {
				previewWidth = (int) (previewHeight * aspectRatio + .5);

			} else {
				previewHeight = (int) (previewWidth / aspectRatio + .5);
			}

			super.onMeasure(MeasureSpec.makeMeasureSpec(previewWidth, MeasureSpec.EXACTLY),
					MeasureSpec.makeMeasureSpec(previewHeight, MeasureSpec.EXACTLY));
		}
	}

	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

		// create camera preview
		preview = new SurfaceView(this);
		SurfaceHolder previewHolder = preview.getHolder();
		previewHolder.addCallback(this);
		previewHolder.setType(SurfaceHolder.SURFACE_TYPE_PUSH_BUFFERS);

		// set preview overlay
		localOverlayProxy = overlayProxy;
		overlayProxy = null; // clear the static object once we have a local reference

		// set overall layout - will populate in onResume
		previewLayout = new PreviewLayout(this);
		cameraLayout = new FrameLayout(this);
		cameraLayout.setBackgroundColor(Color.BLACK);
		cameraLayout.addView(previewLayout, new FrameLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT, Gravity.CENTER));

		setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
		setContentView(cameraLayout);
	}

	public void surfaceChanged(SurfaceHolder previewHolder, int format, int width, int height) {
		if (!previewRunning) {
			// Set the preview size to the most optimal given the target size and aspect ratio.
			Parameters param = camera.getParameters();
			Size pictureSize = param.getPictureSize();
			double aspectRatio = (double) pictureSize.width / pictureSize.height;
			previewLayout.setAspectRatio(aspectRatio);
			List<Size> supportedPreviewSizes = param.getSupportedPreviewSizes();
			Size previewSize = getOptimalPreviewSize(supportedPreviewSizes, width, height, aspectRatio);
			if (previewSize != null) {
				param.setPreviewSize(previewSize.width, previewSize.height);
				camera.setParameters(param);
			}

			previewRunning = true;
			camera.startPreview();
		}
	}

	public void surfaceCreated(SurfaceHolder previewHolder) {
		camera = Camera.open();

		try {
			camera.setPreviewDisplay(previewHolder);

		} catch(IOException e) {
			onError(MediaModule.UNKNOWN_ERROR, "Unable to setup preview surface: " + e.getMessage());
			cancelCallback = null;
			finish();
			return;
		}
	}

	// make sure to call release() otherwise you will have to force kill the app before 
	// the built in camera will open
	public void surfaceDestroyed(SurfaceHolder previewHolder) {
		stopPreview();
		camera.release();
		camera = null;
	}

	@Override
	protected void onResume() {
		super.onResume();

		cameraActivity = this;
		previewLayout.addView(preview, new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT));
		cameraLayout.addView(localOverlayProxy.getOrCreateView().getNativeView(), new FrameLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT));
	}

	@Override
	protected void onPause() {
		super.onPause();

		stopPreview();
		previewLayout.removeView(preview);
		cameraLayout.removeView(localOverlayProxy.getOrCreateView().getNativeView());

		try {
			camera.release();
			camera = null;
		} catch (Throwable t) {
			Log.d(TAG, "Camera is not open, unable to release", Log.DEBUG_MODE);
		}

		cameraActivity = null;
	}

	private void stopPreview() {
		if (camera == null || !previewRunning) {
			return;
		}

		camera.stopPreview();
		previewRunning = false;
	}

	/**
	 * Computes the optimal preview size given the target display size and aspect ratio.
	 *
	 * @param supportPreviewSizes a list of preview sizes the camera supports
	 * @param targetSize the target display size that will render the preview
	 * @param aspectRatio the aspect ratio to use for previewing the image
	 * @return the optimal size of the preview
	 */
	private static Size getOptimalPreviewSize(List<Size> supportedPreviewSizes, int width, int height, double aspectRatio) {
		final double ASPECT_TOLERANCE = 0.001;
		Size optimalSize = null;
		double minDiff = Double.MAX_VALUE;

        int targetHeight = Math.min(height, width);
        if (targetHeight <= 0) {
            // We don't know the size of SurfaceView, use screen height
            targetHeight = height;
        }

		for (Size size : supportedPreviewSizes) {
			double ratio = (double) size.width / size.height;
			if (Math.abs(ratio - aspectRatio) > ASPECT_TOLERANCE) continue;

            if (Math.abs(size.height - targetHeight) < minDiff) {
                optimalSize = size;
                minDiff = Math.abs(size.height - targetHeight);
            }
		}

		// If a size cannot be found that matches the aspect ratio, try
		// again and just ignore the aspect ratio. We will just try to find
		// the best size that fits best.
		if (optimalSize == null) {
			Log.w(TAG, "No preview size found that matches the aspect ratio.", Log.DEBUG_MODE);
			minDiff = Double.MAX_VALUE;
			for (Size size : supportedPreviewSizes) {
				if (Math.abs(size.height - targetHeight) < minDiff) {
					optimalSize = size;
					minDiff = Math.abs(size.height - targetHeight);
				}
			}
		}

		return optimalSize;
	}

	private static void onError(int code, String message) {
		if (errorCallback == null) {
			Log.e(TAG, message);
			return;
		}

		KrollDict dict = new KrollDict();
		dict.put(TiC.PROPERTY_CODE, code);
		dict.put(TiC.PROPERTY_MESSAGE, message);

		errorCallback.callAsync(callbackContext, dict);
	}

	private static void saveToPhotoGallery(byte[] data) {
		File imageFile = MediaModule.createGalleryImageFile();
		try {
			FileOutputStream imageOut = new FileOutputStream(imageFile);
			imageOut.write(data);
			imageOut.close();

		} catch (FileNotFoundException e) {
			Log.e(TAG, "Failed to open gallery image file: " + e.getMessage());

		} catch (IOException e) {
			Log.e(TAG, "Failed to write image to gallery file: " + e.getMessage());
		}

		// Notify media scanner to add image to gallery.
		Intent mediaScanIntent = new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE);
		Uri contentUri = Uri.fromFile(imageFile);
		mediaScanIntent.setData(contentUri);
		Activity activity = TiApplication.getAppCurrentActivity();
		activity.sendBroadcast(mediaScanIntent);
	}

	static public void takePicture() {
		camera.takePicture(null, null, jpegCallback);
	}

	static PictureCallback jpegCallback = new PictureCallback() {
		public void onPictureTaken(byte[] data, Camera camera) {
			if (saveToPhotoGallery) {
				saveToPhotoGallery(data);
			}

			if (successCallback != null) {
				TiBlob imageData = TiBlob.blobFromData(data);
				KrollDict dict = MediaModule.createDictForImage(imageData, "image/jpeg");
				successCallback.callAsync(callbackContext, dict);
			}

			cancelCallback = null;
			cameraActivity.finish();
		}
	};
}
