/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import android.app.Activity;
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
import androidx.annotation.NonNull;
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

	private boolean isImageRippleEnabled;
	private int imageRippleColor;
	private int defaultRippleColor;

	private ImageView imageView;

	private int scalingMode = MediaModule.IMAGE_SCALING_AUTO;
	private final Matrix baseMatrix = new Matrix();
	private TiImageView.ZoomHandler zoomHandler;

	// Flags to help determine whether width/height is defined, so we can scale appropriately
	private boolean viewWidthDefined;
	private boolean viewHeightDefined;

	private TiExifOrientation exifOrientation = TiExifOrientation.UPRIGHT;
	private int tintColor;
	private WeakReference<TiViewProxy> proxy;

	public TiImageView(Context context)
	{
		super(context);

		this.defaultRippleColor = MaterialColors.getColor(context, R.attr.colorControlHighlight, Color.DKGRAY);
		this.imageRippleColor = this.defaultRippleColor;

		this.imageView = new ImageView(context);
		this.imageView.setAdjustViewBounds(true);
		this.imageView.setScaleType(ScaleType.MATRIX);
		addView(this.imageView);
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
		if (value && (this.zoomHandler == null)) {
			this.zoomHandler = new TiImageView.ZoomHandler(this);
			updateScaleType();
		} else if (!value && (this.zoomHandler != null)) {
			this.zoomHandler = null;
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
		if (this.zoomHandler != null) {
			handled = this.zoomHandler.onTouchEvent(ev);
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
		computeBaseMatrix();
		Matrix newMatrix = new Matrix(this.baseMatrix);
		if (this.zoomHandler != null) {
			this.zoomHandler.applyLimitsToMatrix();
			newMatrix.postConcat(this.zoomHandler.getMatrix());
		}
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
		if ((this.zoomHandler != null) || (this.viewWidthDefined && this.viewHeightDefined)) {
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

	public void setTintColor(String color)
	{
		if (color == null || color.isEmpty()) {
			imageView.clearColorFilter();
			return;
		}
		Activity activity = null;
		if (proxy != null) {
			TiViewProxy p = proxy.get();
			if (p != null) {
				activity = p.getActivity();
			}
		}

		this.tintColor = TiColorHelper.parseColor(color, activity);
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

	/**
	 * Handles touch events on an ImageView to perform pinch-zoom, double tap zoom, and scrolling.
	 * <p/>
	 * When the view's onTouchEvent() method is called, you should pass the event to this handler's onTouchEvent()
	 * method. The getMatrix() method will return the zoom/transformation that should be applied to the image.
	 */
	private static final class ZoomHandler
		extends GestureDetector.SimpleOnGestureListener
		implements ScaleGestureDetector.OnScaleGestureListener
	{
		/** The TiImageView that owns this handler and whose image will be zoomed on. */
		private final TiImageView tiImageView;

		/** Interpolator applied to double-tap zoom animations. */
		private final AccelerateDecelerateInterpolator interpolator;

		/** Detector handling double-tap zooms and scrolling. */
		private final GestureDetector gestureDetector;

		/** Detector handling pinch-zooms. */
		private final ScaleGestureDetector scaleGestureDetector;

		/** Zoom transformation matrix to be applied to the image. */
		private final Matrix matrix;

		/** Last scale center point used during a pinch-zoom along the x-axis. */
		private float lastFocusX;

		/** Last scale center point used during a pinch-zoom along the y-axis. */
		private float lastFocusY;

		public ZoomHandler(@NonNull TiImageView tiImageView)
		{
			this.tiImageView = tiImageView;
			this.interpolator = new AccelerateDecelerateInterpolator();
			this.gestureDetector = new GestureDetector(tiImageView.getContext(), this);
			this.gestureDetector.setIsLongpressEnabled(false);
			this.scaleGestureDetector = new ScaleGestureDetector(tiImageView.getContext(), this);
			this.matrix = new Matrix();
		}

		public Matrix getMatrix()
		{
			return this.matrix;
		}

		public boolean onTouchEvent(MotionEvent event)
		{
			return this.gestureDetector.onTouchEvent(event) || this.scaleGestureDetector.onTouchEvent(event);
		}

		@Override
		public boolean onDoubleTap(MotionEvent e)
		{
			// Do not continue if we're in the middle of a pinch-zoom.
			if (this.scaleGestureDetector.isInProgress()) {
				return false;
			}

			// Fetch zoom position and translation coordinates.
			float[] matrixValues = new float[9];
			this.matrix.getValues(matrixValues);
			final boolean isZoomingIn = this.matrix.isIdentity();
			final float zoomInScaleFactor = isZoomingIn ? 2.5f : matrixValues[Matrix.MSCALE_X];
			final float translateX = matrixValues[Matrix.MTRANS_X];
			final float translateY = matrixValues[Matrix.MTRANS_Y];
			final float zoomInX = e.getX();
			final float zoomInY = e.getY();
			final long startTime = SystemClock.uptimeMillis();

			// Animate the zoom in/out.
			this.tiImageView.post(new Runnable() {
				@Override
				public void run()
				{
					// Do not continue if zoom feature has been disabled.
					if (tiImageView.zoomHandler != ZoomHandler.this) {
						return;
					}

					// Get next position in zoom animation.
					long deltaTime = SystemClock.uptimeMillis() - startTime;
					float normalizedValue = Math.min(deltaTime / 250.0f, 1.0f);
					boolean isAnimationDone = (normalizedValue >= 1.0f);
					normalizedValue = interpolator.getInterpolation(normalizedValue);

					// Scale the image.
					matrix.reset();
					if (isZoomingIn) {
						float scaleFactor = (zoomInScaleFactor * normalizedValue) + 1.0f;
						matrix.postScale(scaleFactor, scaleFactor, zoomInX, zoomInY);
					} else {
						normalizedValue = 1.0f - normalizedValue;
						float scaleFactor = ((zoomInScaleFactor - 1.0f) * normalizedValue) + 1.0f;
						matrix.postScale(scaleFactor, scaleFactor);
						matrix.postTranslate(translateX * normalizedValue, translateY * normalizedValue);
					}
					tiImageView.requestLayout();

					// Re-run this runnable if the animation isn't done yet.
					if (!isAnimationDone) {
						tiImageView.post(this);
					}
				}
			});
			return true;
		}

		@Override
		public boolean onScroll(MotionEvent e1, MotionEvent e2, float dx, float dy)
		{
			// Only allow scrolls if image is zoomed and we're not in the middle of doing a pinch-zoom.
			if (!this.scaleGestureDetector.isInProgress() && !this.matrix.isIdentity()) {
				this.matrix.postTranslate(-dx, -dy);
				applyLimitsToMatrix();
				this.tiImageView.requestLayout();
				return true;
			}
			return false;
		}

		@Override
		public boolean onScaleBegin(ScaleGestureDetector detector)
		{
			this.lastFocusX = detector.getFocusX();
			this.lastFocusY = detector.getFocusY();
			return true;
		}

		@Override
		public boolean onScale(ScaleGestureDetector detector)
		{
			this.matrix.postScale(
				detector.getScaleFactor(), detector.getScaleFactor(),
				detector.getFocusX(), detector.getFocusY());
			this.matrix.postTranslate(detector.getFocusX() - this.lastFocusX, detector.getFocusY() - this.lastFocusY);
			applyLimitsToMatrix();
			this.lastFocusX = detector.getFocusX();
			this.lastFocusY = detector.getFocusY();
			this.tiImageView.requestLayout();
			return true;
		}

		@Override
		public void onScaleEnd(ScaleGestureDetector detector)
		{
			if (applyLimitsToMatrix()) {
				this.tiImageView.requestLayout();
			}
		}

		public boolean applyLimitsToMatrix()
		{
			// Do not continue if matrix has no translations or scales applied to it. (This is an optimization.)
			if (this.matrix.isIdentity()) {
				return false;
			}

			// Fetch matrix values.
			float[] matrixValues = new float[9];
			this.matrix.getValues(matrixValues);

			// Do not allow scale to be less than 1x.
			if ((matrixValues[Matrix.MSCALE_X] < 1.0f) || (matrixValues[Matrix.MSCALE_Y] < 1.0f)) {
				this.matrix.reset();
				return true;
			}

			// Do not allow scale to be greater than 5x.
			final float MAX_SCALE = 5.0f;
			if ((matrixValues[Matrix.MSCALE_X] > MAX_SCALE) || (matrixValues[Matrix.MSCALE_Y] > MAX_SCALE)) {
				this.matrix.postScale(
					MAX_SCALE / matrixValues[Matrix.MSCALE_X], MAX_SCALE / matrixValues[Matrix.MSCALE_Y],
					this.tiImageView.getWidth() / 2.0f, this.tiImageView.getHeight() / 2.0f);
				this.matrix.getValues(matrixValues);
			}

			// Fetch min/max bounds the image can be scrolled to, preventing image from being scrolled off-screen.
			float translateX = -matrixValues[Matrix.MTRANS_X];
			float translateY = -matrixValues[Matrix.MTRANS_Y];
			float maxTranslateX = (tiImageView.getWidth() * matrixValues[Matrix.MSCALE_X]) - tiImageView.getWidth();
			float maxTranslateY = (tiImageView.getHeight() * matrixValues[Matrix.MSCALE_Y]) - tiImageView.getHeight();

			// Apply translation limits.
			boolean wasChanged = false;
			if (translateX < 0) {
				this.matrix.postTranslate(translateX, 0);
				wasChanged = true;
			} else if (translateX > maxTranslateX) {
				this.matrix.postTranslate(translateX - maxTranslateX, 0);
				wasChanged = true;
			}
			if (translateY < 0) {
				this.matrix.postTranslate(0, translateY);
				wasChanged = true;
			} else if (translateY > maxTranslateY) {
				this.matrix.postTranslate(0, translateY - maxTranslateY);
				wasChanged = true;
			}
			return wasChanged;
		}
	}
}
