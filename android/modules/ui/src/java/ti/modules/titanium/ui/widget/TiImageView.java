/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import android.animation.ValueAnimator;
import android.app.Activity;
import android.content.Context;
import android.content.res.ColorStateList;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.ColorFilter;
import android.graphics.Matrix;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.RippleDrawable;
import android.os.Build;
import android.util.Log;
import android.util.Pair;
import android.view.GestureDetector;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.widget.ImageView;
import android.widget.ImageView.ScaleType;
import android.graphics.PorterDuff.Mode;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.google.android.material.color.MaterialColors;
import java.lang.ref.WeakReference;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiExifOrientation;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.util.TiColorHelper;
import ti.modules.titanium.media.MediaModule;
import com.google.android.material.R;

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
	public boolean onInterceptTouchEvent(MotionEvent ev)
	{
		ViewParent viewParent = getParent();
		if (viewParent != null) {
			// Prevents the parent from getting touch events when zoomed in.
			boolean isZoomed = zoomHandler != null && !zoomHandler.getMatrix().isIdentity();
			viewParent.requestDisallowInterceptTouchEvent(isZoomed);
		}

		return super.onInterceptTouchEvent(ev);
	}

	@Override
	public boolean onTouchEvent(MotionEvent ev)
	{
		// If we're zoomed in, ensure parent doesn't intercept touches
		if (zoomHandler != null && !zoomHandler.getMatrix().isIdentity()) {
			// This prevents the parent from getting touch events when zoomed
			if (getParent() != null) {
				getParent().requestDisallowInterceptTouchEvent(true);
			}
		}

		// If zoom is enabled, let the zoom handler process the touch event
		if (zoomHandler != null && zoomHandler.onTouchEvent(ev)) {
			return true;
		}

		return super.onTouchEvent(ev);
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

		/** Store values array for matrix calculations */
		private final float[] matrixValues = new float[9];

		/** Current scale factor of the image */
		private float currentScale = 1.0f;

		/** Minimum allowed scale */
		private static final float MIN_SCALE = 1.0f;

		/** Maximum allowed scale */
		private static final float MAX_SCALE = 5.0f;

		/** Duration for smooth animations in milliseconds */
		private static final long ANIMATION_DURATION = 250;

		/** Value animator for smooth transitions */
		private ValueAnimator scaleAnimator;

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

			// Get the current matrix values
			matrix.getValues(matrixValues);

			// Determine if we're zooming in or resetting
			final boolean isZoomingIn = Math.abs(currentScale - MIN_SCALE) < 0.1f;
			final float targetScale = isZoomingIn ? MAX_SCALE : MIN_SCALE;

			// Calculate the exact point to zoom around
			Pair<Float, Float> touchPoint = getValidTouchPoint(tiImageView.imageView, e.getX(), e.getY());
			final float focusX = touchPoint.first;
			final float focusY = touchPoint.second;

			// Store the current matrix values
			final float startScale = currentScale;
			final float startTransX = matrixValues[Matrix.MTRANS_X];
			final float startTransY = matrixValues[Matrix.MTRANS_Y];

			// Cancel any existing animations
			if (scaleAnimator != null && scaleAnimator.isRunning()) {
				scaleAnimator.cancel();
			}

			// Create a new animator for smooth zooming
			scaleAnimator = ValueAnimator.ofFloat(0f, 1f);
			scaleAnimator.setDuration(ANIMATION_DURATION);
			scaleAnimator.setInterpolator(interpolator);
			scaleAnimator.addUpdateListener(new ValueAnimator.AnimatorUpdateListener() {
				@Override
				public void onAnimationUpdate(ValueAnimator animation)
				{
					float t = (float) animation.getAnimatedValue();

					// Simple linear interpolation between start and target
					float newScale = startScale + t * (targetScale - startScale);
					float newTransX, newTransY;

					if (isZoomingIn) {
						// When zooming in, calculate translation to keep the target point fixed
						float scaleFactor = newScale / startScale;
						newTransX = focusX - scaleFactor * (focusX - startTransX);
						newTransY = focusY - scaleFactor * (focusY - startTransY);
					} else {
						// When zooming out, gradually move to center (proportional to scale change)
						float fraction = (newScale - 1.0f) / (startScale - 1.0f);
						if (fraction < 0.01f) fraction = 0; // Avoid floating point issues
						newTransX = fraction * startTransX;
						newTransY = fraction * startTransY;
					}

					// Apply the new values
					matrix.reset();
					matrix.postScale(newScale, newScale);
					matrix.postTranslate(newTransX, newTransY);

					// Update current scale
					currentScale = newScale;

					tiImageView.requestLayout();
				}
			});
			scaleAnimator.start();
			return true;
		}

		@Override
		public boolean onScroll(MotionEvent e1, MotionEvent e2, float dx, float dy)
		{
			// Only allow scrolls if image is zoomed and we're not pinch-zooming
			if (this.scaleGestureDetector.isInProgress() || currentScale <= 1.0f) {
				return false;
			}

			return applyLimitsToMatrix(dx, dy, null, null);
		}

		@Override
		public boolean onScaleBegin(ScaleGestureDetector detector)
		{
			// Cancel any ongoing animations
			if (scaleAnimator != null && scaleAnimator.isRunning()) {
				scaleAnimator.cancel();
			}
			return true;
		}

		@Override
		public boolean onScale(ScaleGestureDetector detector)
		{
			// Calculate the new scale with limits.
			float scaleFactor = detector.getScaleFactor();

			// Limit the scale factor for smoother zooming.
			scaleFactor = Math.max(0.95f, Math.min(scaleFactor, 1.05f));

			float newScale = currentScale * scaleFactor;

			// Check scale limits.
			if (newScale < MIN_SCALE) {
				scaleFactor = MIN_SCALE / currentScale;
				newScale = MIN_SCALE;
			} else if (newScale > MAX_SCALE) {
				scaleFactor = MAX_SCALE / currentScale;
				newScale = MAX_SCALE;
			}

			// Get the focus point
			float focusX = detector.getFocusX();
			float focusY = detector.getFocusY();

			return applyLimitsToMatrix(focusX, focusY, scaleFactor, newScale);
		}

		@Override
		public void onScaleEnd(ScaleGestureDetector detector)
		{
			// Nothing to handle here.
		}

		public Pair<Float, Float> getValidTouchPoint(ImageView imageView, float touchX, float touchY)
		{
			float finalTouchX = touchX;
			float finalTouchY = touchY;

			Drawable drawable = imageView.getDrawable();
			// Invalid bitmap dimensions.
			if (drawable == null) {
				return new Pair<>(finalTouchX, finalTouchY);
			}

			// Get the intrinsic dimensions of the bitmap.
			int intrinsicWidth = drawable.getIntrinsicWidth();
			int intrinsicHeight = drawable.getIntrinsicHeight();

			// Invalid bitmap dimensions.
			if (intrinsicWidth <= 0 || intrinsicHeight <= 0) {
				return new Pair<>(finalTouchX, finalTouchY);
			}

			// Get the matrix that ImageView uses to draw the bitmap.
			Matrix imageMatrix = imageView.getImageMatrix();

			// Create a RectF representing the original bitmap's bounds.
			// ... from (0,0) to (intrinsicWidth, intrinsicHeight)
			RectF bitmapRect = new RectF(0f, 0f, intrinsicWidth, intrinsicHeight);

			// Apply the ImageView's matrix to the bitmap's bounds.
			// This will transform bitmapRect to reflect its position and scale within the ImageView.
			imageMatrix.mapRect(bitmapRect);

			// Now, bitmapRect contains the coordinates of the displayed bitmap
			// relative to the ImageView's top-left corner.
			// Check if the touch coordinates are within this transformed rectangle.
			if (bitmapRect.contains(touchX, touchY)) {
				return new Pair<>(finalTouchX, finalTouchY);
			} else {
				// Returns the center of the image.
				return new Pair<>(bitmapRect.centerX(), bitmapRect.centerY());
			}
		}

		private boolean applyLimitsToMatrix(Float dx, Float dy, @Nullable Float scaleFactor, @Nullable Float scale) {
			matrix.getValues(matrixValues);
			float currentTransX = matrixValues[Matrix.MTRANS_X];
			float currentTransY = matrixValues[Matrix.MTRANS_Y];

			// Calculate the new translations with limit checks
			float newTransX = currentTransX - dx;
			float newTransY = currentTransY - dy;

			if (scaleFactor != null) {
				newTransX = dx - scaleFactor * (dx - currentTransX);
				newTransY = dy - scaleFactor * (dy - currentTransY);
			} else {
				scale = currentScale;
			}

			// Calculate bounds
			float viewWidth = tiImageView.getWidth();
			float viewHeight = tiImageView.getHeight();
			float contentWidth = viewWidth * scale;
			float contentHeight = viewHeight * scale;

			// Horizontal bounds
			float minTransX = viewWidth - contentWidth;
			float maxTransX = 0;

			// Vertical bounds
			float minTransY = viewHeight - contentHeight;
			float maxTransY = 0;

			// Apply bounds to translations
			if (newTransX < minTransX) newTransX = minTransX;
			if (newTransX > maxTransX) newTransX = maxTransX;
			if (newTransY < minTransY) newTransY = minTransY;
			if (newTransY > maxTransY) newTransY = maxTransY;

			if (scaleFactor != null) {
				// Update the matrix
				matrix.reset();
				matrix.postScale(scale, scale);
				matrix.postTranslate(newTransX, newTransY);

				// Update the current scale
				currentScale = scale;
				tiImageView.requestLayout();
				return true;
			} else {
				// Update the matrix if there's actual movement
				if (newTransX != currentTransX || newTransY != currentTransY) {
					matrix.postTranslate(newTransX - currentTransX, newTransY - currentTransY);
					tiImageView.requestLayout();
					return true;
				}
			}

			return false;
		}
	}
}
