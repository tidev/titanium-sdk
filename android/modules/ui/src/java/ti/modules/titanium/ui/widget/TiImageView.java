/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2021 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import android.content.Context;
import android.content.res.ColorStateList;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.ColorFilter;
import android.graphics.Matrix;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.RippleDrawable;
import android.os.SystemClock;
import android.view.GestureDetector;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.view.ViewGroup;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.widget.ImageView;
import android.widget.ImageView.ScaleType;
import android.graphics.PorterDuff.Mode;
import com.google.android.material.color.MaterialColors;
import java.lang.ref.WeakReference;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.R;
import org.appcelerator.titanium.util.TiExifOrientation;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.util.TiColorHelper;
import ti.modules.titanium.media.MediaModule;

public class TiImageView extends ViewGroup
{
	private static final String TAG = "TiImageView";

	private boolean enableZoomControls;

	private boolean isImageRippleEnabled;
	private int imageRippleColor;
	private int defaultRippleColor;

	private final AccelerateDecelerateInterpolator interpolator = new AccelerateDecelerateInterpolator();
	private GestureDetector gestureDetector;
	private ScaleGestureDetector scaleGestureDetector;
	private ImageView imageView;

	private int scalingMode = MediaModule.IMAGE_SCALING_AUTO;
	private final Matrix baseMatrix = new Matrix();
	private final Matrix changeMatrix = new Matrix();
	private float lastFocusX;
	private float lastFocusY;

	// Flags to help determine whether width/height is defined, so we can scale appropriately
	private boolean viewWidthDefined;
	private boolean viewHeightDefined;

	private TiExifOrientation exifOrientation = TiExifOrientation.UPRIGHT;
	private int tintColor;
	private WeakReference<TiViewProxy> proxy;

	public TiImageView(Context context)
	{
		super(context);

		final TiImageView me = this;

		this.defaultRippleColor = MaterialColors.getColor(context, R.attr.colorControlHighlight, Color.DKGRAY);
		this.imageRippleColor = defaultRippleColor;

		this.imageView = new ImageView(context);
		this.imageView.setAdjustViewBounds(true);
		this.imageView.setScaleType(ScaleType.MATRIX);
		addView(this.imageView);

		// Detector used to handle double tap zoom-in/out and scrolling.
		this.gestureDetector = new GestureDetector(context, new GestureDetector.SimpleOnGestureListener() {
			@Override
			public boolean onDoubleTap(MotionEvent e)
			{
				// Do not continue if zoom is disable or we're in the middle of a pinch-zoom.
				if (!enableZoomControls || scaleGestureDetector.isInProgress()) {
					return false;
				}

				// Fetch zoom position and translation coordinates.
				float[] matrixValues = new float[9];
				changeMatrix.getValues(matrixValues);
				final boolean isZoomingIn = changeMatrix.isIdentity();
				final float zoomInScaleFactor = isZoomingIn ? 2.5f : matrixValues[Matrix.MSCALE_X];
				final float translateX = matrixValues[Matrix.MTRANS_X];
				final float translateY = matrixValues[Matrix.MTRANS_Y];
				final float zoomInX = e.getX();
				final float zoomInY = e.getY();
				final long startTime = SystemClock.uptimeMillis();

				// Animate the zoom in/out.
				post(new Runnable() {
					@Override
					public void run()
					{
						// Do not continue if zoom feature has been disabled.
						if (!enableZoomControls) {
							return;
						}

						// Get next position in zoom animation.
						long deltaTime = SystemClock.uptimeMillis() - startTime;
						float normalizedValue = Math.min(deltaTime / 250.0f, 1.0f);
						boolean isAnimationDone = (normalizedValue >= 1.0f);
						normalizedValue = interpolator.getInterpolation(normalizedValue);
						if (!isZoomingIn) {
							normalizedValue = 1.0f - normalizedValue;
						}

						// Scale the image.
						changeMatrix.reset();
						if (isZoomingIn) {
							float scaleFactor = (zoomInScaleFactor * normalizedValue) + 1.0f;
							changeMatrix.postScale(scaleFactor, scaleFactor, zoomInX, zoomInY);
						} else {
							float scaleFactor = ((zoomInScaleFactor - 1.0f) * normalizedValue) + 1.0f;
							changeMatrix.postScale(scaleFactor, scaleFactor);
							changeMatrix.postTranslate(translateX * normalizedValue, translateY * normalizedValue);
						}
						requestLayout();

						// Re-run this runnable if the animation isn't done yet.
						if (!isAnimationDone) {
							post(this);
						}
					}
				});
				return true;
			}

			@Override
			public boolean onScroll(MotionEvent e1, MotionEvent e2, float dx, float dy)
			{
				if (enableZoomControls && !scaleGestureDetector.isInProgress() && !changeMatrix.isIdentity()) {
					changeMatrix.postTranslate(-dx, -dy);
					applyLimitsToChangeMatrix();
					requestLayout();
					return true;
				}
				return false;
			}
		});
		this.gestureDetector.setIsLongpressEnabled(false);

		// Detector used to handle pinch zoom.
		var scaleGestureListener = new ScaleGestureDetector.SimpleOnScaleGestureListener() {
			@Override
			public boolean onScaleBegin(ScaleGestureDetector detector)
			{
				lastFocusX = detector.getFocusX();
				lastFocusY = detector.getFocusY();
				return enableZoomControls;
			}

			@Override
			public boolean onScale(ScaleGestureDetector detector)
			{
				changeMatrix.postScale(
					detector.getScaleFactor(), detector.getScaleFactor(),
					detector.getFocusX(), detector.getFocusY());
				changeMatrix.postTranslate(detector.getFocusX() - lastFocusX, detector.getFocusY() - lastFocusY);
				applyLimitsToChangeMatrix();
				lastFocusX = detector.getFocusX();
				lastFocusY = detector.getFocusY();
				requestLayout();
				return true;
			}

			@Override
			public void onScaleEnd(ScaleGestureDetector detector)
			{
				if (applyLimitsToChangeMatrix()) {
					requestLayout();
				}
			}
		};
		this.scaleGestureDetector = new ScaleGestureDetector(context, scaleGestureListener);
	}

	/**
	 * Constructs a new TiImageView object.
	 * @param context the associated context.
	 * @param proxy the associated proxy.
	 */
	public TiImageView(Context context, TiViewProxy proxy)
	{
		this(context);
		this.proxy = new WeakReference<>(proxy);
	}

	public void setEnableZoomControls(boolean value)
	{
		if (value != this.enableZoomControls) {
			this.enableZoomControls = value;
			updateScaleType();
		}
	}

	public void setScalingMode(int mode)
	{
		if (mode != this.scalingMode) {
			this.scalingMode = mode;
			requestLayout();
		}
	}

	public boolean isImageRippleEnabled()
	{
		return this.isImageRippleEnabled;
	}

	public void setIsImageRippleEnabled(boolean value)
	{
		// Do not continue if setting isn't changing.
		if (this.isImageRippleEnabled == value) {
			return;
		}

		// Add or remove RippleDrawable to the image.
		this.isImageRippleEnabled = value;
		Bitmap bitmap = getImageBitmap();
		if (bitmap != null) {
			setImageBitmap(bitmap);
		}
	}

	public int getImageRippleColor()
	{
		return this.imageRippleColor;
	}

	public int getDefaultRippleColor()
	{
		return this.defaultRippleColor;
	}

	public void setImageRippleColor(int value)
	{
		// Do not continue if setting isn't changing.
		if (this.imageRippleColor == value) {
			return;
		}

		// Update image's RippleDrawable with given color.
		this.imageRippleColor = value;
		if (this.isImageRippleEnabled) {
			Bitmap bitmap = getImageBitmap();
			if (bitmap != null) {
				setImageBitmap(bitmap);
			}
		}
	}

	public Drawable getImageDrawable()
	{
		return imageView.getDrawable();
	}

	public Bitmap getImageBitmap()
	{
		Drawable drawable = getImageDrawable();
		if (drawable instanceof RippleDrawable) {
			if (((RippleDrawable) drawable).getNumberOfLayers() > 0) {
				drawable = ((RippleDrawable) drawable).getDrawable(0);
			}
		}
		if (drawable instanceof BitmapDrawable) {
			return ((BitmapDrawable) drawable).getBitmap();
		}
		return null;
	}

	/**
	 * Sets a Bitmap as the content of imageView
	 * @param bitmap The bitmap to set. If it is null, it will clear the previous image.
	 */
	public void setImageBitmap(Bitmap bitmap)
	{
		// Remove image from view if given null.
		if (bitmap == null) {
			this.imageView.setImageDrawable(null);
			return;
		}

		// Apply the image to the view.
		if (this.isImageRippleEnabled) {
			BitmapDrawable bitmapDrawable = new BitmapDrawable(this.imageView.getContext().getResources(), bitmap);
			this.imageView.setImageDrawable(
				new RippleDrawable(ColorStateList.valueOf(this.imageRippleColor), bitmapDrawable, null));
		} else {
			this.imageView.setImageBitmap(bitmap);
		}
	}

	private void computeBaseMatrix()
	{
		// Reset base matrix used to apply "scalingMode" and EXIF orientation to image,
		// but does not have "zoom" scaling/panning applied to it.
		this.baseMatrix.reset();

		// Fetch the image drawable.
		Drawable drawable = imageView.getDrawable();
		if (drawable == null) {
			return;
		}

		// Fetch the image's pixel dimensions.
		boolean isUpright = !this.exifOrientation.isSideways();
		float imageWidth = isUpright ? drawable.getIntrinsicWidth() : drawable.getIntrinsicHeight();
		float imageHeight = isUpright ? drawable.getIntrinsicHeight() : drawable.getIntrinsicWidth();

		// Rotate image to upright position and undo mirroring if needed.
		if (this.exifOrientation != TiExifOrientation.UPRIGHT) {
			this.baseMatrix.postRotate(this.exifOrientation.getDegreesCounterClockwise());
			switch (this.exifOrientation.getDegreesCounterClockwise()) {
				case 90:
					this.baseMatrix.postTranslate(imageWidth, 0);
					break;
				case 180:
					this.baseMatrix.postTranslate(imageWidth, imageHeight);
					break;
				case 270:
					this.baseMatrix.postTranslate(0, imageHeight);
					break;
			}
			if (this.exifOrientation.isMirrored()) {
				this.baseMatrix.postScale(-1.0f, 1.0f, imageWidth * 0.5f, 0.0f);
			}
		}

		// Fetch the pixel width/height of the view hosting the image.
		float viewWidth = getWidth() - getPaddingLeft() - getPaddingRight();
		float viewHeight = getHeight() - getPaddingTop() - getPaddingBottom();

		// Calculate scale factors needed to stretch image to fit width/height of view.
		float scaleX = 0.0f;
		float scaleY = 0.0f;
		if (imageWidth > 0) {
			scaleX = viewWidth / imageWidth;
		}
		if (imageHeight > 0) {
			scaleY = viewHeight / imageHeight;
		}

		// Apply "scalingMode" to image.
		int scalingMode = this.scalingMode;
		if (scalingMode == MediaModule.IMAGE_SCALING_AUTO) {
			if (this.viewWidthDefined && this.viewHeightDefined) {
				scalingMode = MediaModule.IMAGE_SCALING_FILL;
			} else {
				scalingMode = MediaModule.IMAGE_SCALING_ASPECT_FIT;
			}
		}
		switch (scalingMode) {
			case MediaModule.IMAGE_SCALING_ASPECT_FILL:
			case MediaModule.IMAGE_SCALING_ASPECT_FIT: {
				// Crop or letterbox/pillar-box scale the image.
				boolean isCropped = (scalingMode == MediaModule.IMAGE_SCALING_ASPECT_FILL);
				float scale = isCropped ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY);
				this.baseMatrix.postScale(scale, scale);
				this.baseMatrix.postTranslate(
					(viewWidth - (imageWidth * scale)) * 0.5f, (viewHeight - (imageHeight * scale)) * 0.5f);
				break;
			}
			case MediaModule.IMAGE_SCALING_FILL:
				// Stretch the image to fit container.
				this.baseMatrix.postScale(scaleX, scaleY);
				break;
			case MediaModule.IMAGE_SCALING_NONE:
			default:
				// Do not scale the image.
				this.baseMatrix.postTranslate((viewWidth - imageWidth) * 0.5f, (viewHeight - imageHeight) * 0.5f);
				break;
		}
	}

	@Override
	public boolean onTouchEvent(MotionEvent ev)
	{
		boolean handled = false;
		if (this.enableZoomControls) {
			handled = this.gestureDetector.onTouchEvent(ev) || this.scaleGestureDetector.onTouchEvent(ev);
		}
		if (!handled) {
			handled = super.onTouchEvent(ev);
		}
		return handled;
	}

	@Override
	protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec)
	{
		super.onMeasure(widthMeasureSpec, heightMeasureSpec);

		boolean isUpright = !this.exifOrientation.isSideways();
		int maxWidth = 0;
		int maxHeight = 0;

		// If height or width is not defined and we have an image, we need to set the height/width properly
		// so that it doesn't get the content height/width
		if (!viewWidthDefined || !viewHeightDefined) {
			Drawable d = imageView.getDrawable();
			if (d != null) {
				float aspectRatio = 1.0f;
				int w = MeasureSpec.getSize(widthMeasureSpec);
				int h = MeasureSpec.getSize(heightMeasureSpec);

				int ih = isUpright ? d.getIntrinsicHeight() : d.getIntrinsicWidth();
				int iw = isUpright ? d.getIntrinsicWidth() : d.getIntrinsicHeight();
				if (ih != 0 && iw != 0) {
					aspectRatio = (float) ih / (float) iw;
				}

				switch (this.scalingMode) {
					case MediaModule.IMAGE_SCALING_NONE:
					case MediaModule.IMAGE_SCALING_ASPECT_FILL:
						maxWidth = iw;
						maxHeight = ih;
						break;
				}

				if (viewWidthDefined) {
					maxWidth = w;
					if (maxHeight <= 0) {
						maxHeight = Math.round(w * aspectRatio);
					}
				}
				if (viewHeightDefined) {
					maxHeight = h;
					if (maxWidth <= 0) {
						maxWidth = Math.round(h / aspectRatio);
					}
				}
			}
		}

		if (isUpright) {
			measureChild(imageView, widthMeasureSpec, heightMeasureSpec);
		} else {
			measureChild(imageView, heightMeasureSpec, widthMeasureSpec);
		}

		maxWidth = Math.max(maxWidth, isUpright ? imageView.getMeasuredWidth() : imageView.getMeasuredHeight());
		maxHeight = Math.max(maxHeight, isUpright ? imageView.getMeasuredHeight() : imageView.getMeasuredWidth());

		setMeasuredDimension(resolveSize(maxWidth, widthMeasureSpec), resolveSize(maxHeight, heightMeasureSpec));
	}

	@Override
	protected void onLayout(boolean changed, int left, int top, int right, int bottom)
	{
		applyLimitsToChangeMatrix();
		computeBaseMatrix();
		Matrix newMatrix = new Matrix(this.baseMatrix);
		newMatrix.postConcat(this.changeMatrix);
		this.imageView.setImageMatrix(newMatrix);
		this.imageView.layout(0, 0, right - left, bottom - top);

		TiViewProxy viewProxy = (proxy == null ? null : proxy.get());
		TiUIHelper.firePostLayoutEvent(viewProxy);
	}

	public void setColorFilter(ColorFilter filter)
	{
		imageView.setColorFilter(filter);
	}

	private void updateScaleType()
	{
		if (this.enableZoomControls || (this.viewWidthDefined && this.viewHeightDefined)) {
			this.imageView.setAdjustViewBounds(false);
		} else {
			this.imageView.setAdjustViewBounds(true);
		}
		this.imageView.setScaleType(ScaleType.MATRIX);
		requestLayout();
	}

	public void setWidthDefined(boolean defined)
	{
		viewWidthDefined = defined;
		updateScaleType();
	}

	public void setHeightDefined(boolean defined)
	{
		viewHeightDefined = defined;
		updateScaleType();
	}

	public void setOrientation(TiExifOrientation exifOrientation)
	{
		if (exifOrientation == null) {
			exifOrientation = TiExifOrientation.UPRIGHT;
		}
		this.exifOrientation = exifOrientation;
		updateScaleType();
	}

	private boolean applyLimitsToChangeMatrix()
	{
		// Do not continue if matrix has no translations or scales applied to it. (This is an optimization.)
		if (this.changeMatrix.isIdentity()) {
			return false;
		}

		// Fetch matrix values.
		float[] matrixValues = new float[9];
		this.changeMatrix.getValues(matrixValues);

		// Do not allow scale to be less than 1x.
		if ((matrixValues[Matrix.MSCALE_X] < 1.0f) || (matrixValues[Matrix.MSCALE_Y] < 1.0f)) {
			changeMatrix.reset();
			return true;
		}

		// Fetch min/max bounds the image can be scrolled to, preventing image from being scrolled off-screen.
		float translateX = -matrixValues[Matrix.MTRANS_X];
		float translateY = -matrixValues[Matrix.MTRANS_Y];
		float minTranslateX = 0;
		float minTranslateY = 0;
		float maxTranslateX = (getWidth() * matrixValues[Matrix.MSCALE_X]) - getWidth();
		float maxTranslateY = (getHeight() * matrixValues[Matrix.MSCALE_Y]) - getHeight();

		// Apply translation limits.
		boolean wasChanged = false;
		if (translateX < minTranslateX) {
			this.changeMatrix.postTranslate(translateX - minTranslateX, 0);
			wasChanged = true;
		} else if (translateX > maxTranslateX) {
			this.changeMatrix.postTranslate(translateX - maxTranslateX, 0);
			wasChanged = true;
		}
		if (translateY < minTranslateY) {
			this.changeMatrix.postTranslate(0, translateY - minTranslateY);
			wasChanged = true;
		} else if (translateY > maxTranslateY) {
			this.changeMatrix.postTranslate(0, translateY - maxTranslateY);
			wasChanged = true;
		}
		return wasChanged;
	}

	public void setTintColor(String color)
	{
		if (color == null || color.isEmpty()) {
			imageView.clearColorFilter();
			return;
		}

		this.tintColor = TiColorHelper.parseColor(color);
		imageView.setColorFilter(this.tintColor, Mode.SRC_IN);
	}

	public int getTintColor()
	{
		return tintColor;
	}

	public ImageView getImageView()
	{
		return this.imageView;
	}
}
