/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012-2020 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.media;

import java.io.File;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

// import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBaseActivity;
// import org.appcelerator.titanium.TiBlob;
// import org.appcelerator.titanium.io.TiContentFile;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiRHelper;
import org.appcelerator.titanium.util.TiFileHelper;

import android.app.Activity;
// import android.content.ContentResolver;
// import android.content.ContentValues;
// import android.net.Uri;
import android.os.Bundle;
// import android.provider.MediaStore;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.FrameLayout;
import androidx.camera.core.Camera;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ImageCapture;
import androidx.camera.core.ImageCapture.OnImageSavedCallback;
import androidx.camera.core.ImageCapture.OutputFileOptions;
import androidx.camera.core.ImageCaptureException;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.content.ContextCompat;

import com.google.common.util.concurrent.ListenableFuture;

@SuppressWarnings("deprecation")
public class TiCameraXActivity extends TiBaseActivity
{
	private static final String TAG = "TiCameraXActivity";
	PreviewView viewFinder;
	Preview preview;
	int lensFacing = CameraSelector.LENS_FACING_BACK;
	private static ImageCapture imageCapture;
	private static Executor executor = Executors.newSingleThreadExecutor();
	private TiViewProxy localOverlayProxy = null;
	private ProcessCameraProvider cameraProvider;
	public static TiViewProxy overlayProxy = null;
	public static TiCameraXActivity cameraActivity = null;
	public static KrollObject callbackContext;
	public static KrollFunction successCallback, errorCallback, cancelCallback, androidbackCallback;
	FrameLayout layout;

	@Override
	protected void onCreate(Bundle savedInstanceState)
	{
		getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
		super.onCreate(savedInstanceState);

		localOverlayProxy = overlayProxy;

		try {

			int idLayout = TiRHelper.getResource("layout.titanium_ui_camera");
			int idPreview = TiRHelper.getResource("id.view_finder");

			layout =
				(FrameLayout) TiApplication.getAppCurrentActivity().getLayoutInflater().inflate(idLayout, null, false);
			viewFinder = (PreviewView) layout.findViewById(idPreview);

			setContentView(layout);
			startCamera();
		} catch (TiRHelper.ResourceNotFoundException e) {
			//
			Log.i("camera", "error create");
		}
	}

	private void startCamera()
	{
		int rotation = getWindowManager().getDefaultDisplay().getRotation();

		Activity activity = TiApplication.getAppCurrentActivity();
		ListenableFuture cameraProviderFuture = ProcessCameraProvider.getInstance(activity);
		cameraProviderFuture.addListener(() -> {
			try {
				preview = new Preview.Builder().build();
				cameraProvider = (ProcessCameraProvider) cameraProviderFuture.get();
				CameraSelector cameraSelector = new CameraSelector.Builder().requireLensFacing(lensFacing).build();
				imageCapture = new ImageCapture.Builder().setTargetRotation(rotation).build();

				Camera camera = cameraProvider.bindToLifecycle(this, cameraSelector, imageCapture, preview);
				preview.setSurfaceProvider(((PreviewView) viewFinder).createSurfaceProvider());
			} catch (InterruptedException | ExecutionException e) {
				// Currently no exceptions thrown. cameraProviderFuture.get()
				// shouldn't block since the listener is being called, so no need to
				// handle InterruptedException.
			}
		}, ContextCompat.getMainExecutor(activity));
	}

	public static void takePicture()
	{
		Log.i("camx", "take picture");
		// ContentResolver contentResolver = TiApplication.getAppCurrentActivity().getContentResolver();
		// Uri contentUri = MediaModule.createExternalPictureContentUri(false);
		//
		try {
			File file = TiFileHelper.getInstance().getTempFile(".jpg", true);
			OutputFileOptions outputFileOptions = new OutputFileOptions.Builder(file).build();

			imageCapture.takePicture(outputFileOptions, executor, new OnImageSavedCallback() {
				@Override
				public void onImageSaved(ImageCapture.OutputFileResults outputFileResults)
				{
					Log.i("camx", "image saved " + file.getPath());

					// TiBlob blob = TiBlob.blobFromFile(file);
					// KrollDict response = MediaModule.createDictForImage(blob, blob.getMimeType());

					// successCallback.callAsync(callbackContext, response);

					if (cameraActivity != null) {
						cameraActivity.finish();
					}
				}
				@Override
				public void onError(ImageCaptureException error)
				{
					// insert your code here.
					Log.i("camx", "error: " + error.toString());
				}
			});
		} catch (Exception ex) {
			//
		}
	}

	@Override
	protected void onResume()
	{
		super.onResume();
		cameraActivity = this;
		if (localOverlayProxy != null) {
			View overlayView = localOverlayProxy.getOrCreateView().getNativeView();
			ViewGroup parent = (ViewGroup) overlayView.getParent();
			if (parent != null) {
				parent.removeView(overlayView);
			}
			layout.addView(overlayView, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT,
																	 FrameLayout.LayoutParams.MATCH_PARENT));
		}
	}

	@Override
	protected void onDestroy()
	{
		Log.i("camx", "destroy");
		cameraProvider.unbindAll();
		// Release our camera activity reference.
		if (cameraActivity == this) {
			cameraActivity = null;
		}
		// Destroy this activity.
		super.onDestroy();
	}

	@Override
	public void finish()
	{
		Log.i("camx", "finish");
		// cameraProvider.unbindAll();
		overlayProxy = null;
		super.finish();
	}
}
