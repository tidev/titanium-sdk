/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiDrawableReference;
import org.appcelerator.titanium.view.TiUIView;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapShader;
import android.graphics.Canvas;
import android.graphics.ColorFilter;
import android.graphics.ComposeShader;
import android.graphics.LinearGradient;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.PixelFormat;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.util.DisplayMetrics;
import android.view.Display;
import android.view.View;
import android.view.WindowManager;
import android.widget.ImageView;

import ti.modules.titanium.ui.UIModule;

/** Titanium "MaskedImage" view controller used to blend an image or tint color with a mask. */
public class TiUIMaskedImage extends TiUIView
{
	/** The default Android log tag name to be used by this class. */
	private static final String TAG = "TiUIMaskedImage";

	/**
	 * Custom drawable used to render masking effect in an ImageView.
	 * Set to null when view's release() method has been called.
	 */
	private TiUIMaskedImage.MaskedDrawable maskedDrawable;

	public TiUIMaskedImage(final TiViewProxy proxy)
	{
		super(proxy);

		// Set the default width/height to "Ti.UI.FILL". (Matches iOS' behavior.)
		getLayoutParams().autoFillsWidth = true;
		getLayoutParams().autoFillsHeight = true;

		// Create the masked drawable.
		this.maskedDrawable = new TiUIMaskedImage.MaskedDrawable();

		// Create the image view and assign it the above masked drawable.
		ImageView imageView = new ImageView(proxy.getActivity());
		imageView.setImageDrawable(this.maskedDrawable);
		setNativeView(imageView);
	}

	@Override
	public void release()
	{
		super.release();
		this.maskedDrawable = null;
	}

	/**
	 * Initializes the image view with the given dictionary of property settings.
	 * <p>
	 * Expected to be called on the main UI thread after a call to the
	 * JavaScript Ti.UI.createMaskedImage() function has been invoked.
	 * @param properties Dictionary of property settings.
	 */
	@Override
	public void processProperties(KrollDict properties)
	{
		// Validate.
		if ((this.maskedDrawable == null) || (properties == null)) {
			return;
		}

		// Fetch MaskedImage properties and apply them to the view.
		if (properties.containsKey(TiC.PROPERTY_MASK)) {
			updateMaskDrawableWith(properties.get(TiC.PROPERTY_MASK));
		}
		if (properties.containsKey(TiC.PROPERTY_IMAGE)) {
			updateImageDrawableWith(properties.get(TiC.PROPERTY_IMAGE));
		}
		if (properties.containsKey(TiC.PROPERTY_MODE)) {
			updateBlendModeWith(properties.get(TiC.PROPERTY_MODE));
		}
		if (properties.containsKey(TiC.PROPERTY_TINT)) {
			updateMaskTintWith(properties.get(TiC.PROPERTY_TINT));
		}
		if (properties.containsKey(TiC.PROPERTY_TINT_COLOR)) {
			updateTintColorFilterWith(properties.get(TiC.PROPERTY_TINT_COLOR));
		}

		// Let base class handle all other view property settings.
		super.processProperties(properties);

		// Set ImageView scale type after processing width/height properties above.
		updateImageViewScaleType();

		// Update ImageView layout and size. (Need remove and re-add drawable to force it to resize contents.)
		ImageView imageView = getImageView();
		if (imageView != null) {
			imageView.requestLayout();
			imageView.setImageDrawable(null);
			imageView.setImageDrawable(this.maskedDrawable);
		}
	}

	/**
	 * Called when one of the proxy's properies have changed.
	 * <p>
	 * Expected to be called on the main UI thread.
	 * @param key The unique name of the property.
	 * @param oldValue The property's previous value. Can be null.
	 * @param newValue The property's new value. Can be null.
	 * @param proxy The proxy that own's the property. Expected to be "MaskedImageProxy".
	 */
	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		// Validate.
		if (key == null) {
			return;
		}

		// Handle property change.
		boolean isRelayoutNeeded = false;
		if (key.equals(TiC.PROPERTY_MASK)) {
			updateMaskDrawableWith(newValue);
			isRelayoutNeeded = true;
		} else if (key.equals(TiC.PROPERTY_IMAGE)) {
			updateImageDrawableWith(newValue);
			isRelayoutNeeded = true;
		} else if (key.equals(TiC.PROPERTY_MODE)) {
			updateBlendModeWith(newValue);
		} else if (key.equals(TiC.PROPERTY_TINT)) {
			updateMaskTintWith(newValue);
		} else if (key.equals(TiC.PROPERTY_TINT_COLOR)) {
			updateTintColorFilterWith(newValue);
		} else {
			// Let base class handle property change.
			super.propertyChanged(key, oldValue, newValue, proxy);

			// If width or height property has changed, then check if ImageView scaling needs to change.
			if (key.equals(TiC.PROPERTY_WIDTH) || key.equals(TiC.PROPERTY_HEIGHT)) {
				updateImageViewScaleType();
				isRelayoutNeeded = true;
			}
		}

		// Re-layout ImageView if needed.
		// Note: Older Android OS versions cache drawable size and ignore drawable changes.
		//       Only way to cause ImageView to recognize drawable resizes is to remove and re-add drawable.
		if (isRelayoutNeeded) {
			ImageView imageView = getImageView();
			if (imageView != null) {
				imageView.requestLayout();
				imageView.setImageDrawable(null);
				imageView.setImageDrawable(this.maskedDrawable);
			}
		}
	}

	/**
	 * Updates the ImageView scale according to Titanium view's width and height settings.
	 * <p>
	 * Will preserve aspect ratio if both width and height are set to Ti.UI.SIZE.
	 * Will stretch image for any other width/height setting.
	 * <p>
	 * This method is expected to be called after a "width" or "height" property has been changed.
	 */
	private void updateImageViewScaleType()
	{
		// Fetch the image view.
		ImageView imageView = getImageView();
		if (imageView == null) {
			return;
		}

		// Fetch the Titanium layout parameters assigned to this view.
		TiCompositeLayout.LayoutParams layoutParams = getLayoutParams();
		if (layoutParams == null) {
			return;
		}

		// Set up the image view to stretch the image unless width/height are set to Ti.UI.SIZE.
		ImageView.ScaleType scaleType = ImageView.ScaleType.FIT_XY;
		if ((layoutParams.optionWidth == null) && (layoutParams.optionHeight == null)) {
			if (!layoutParams.autoFillsWidth && !layoutParams.autoFillsHeight) {
				if (layoutParams.sizeOrFillWidthEnabled && layoutParams.sizeOrFillWidthEnabled) {
					scaleType = ImageView.ScaleType.CENTER;
				}
			}
		}

		// Update the image view's scale settings.
		imageView.setScaleType(scaleType);
		imageView.setAdjustViewBounds(false);
	}

	/**
	 * Validates given Titanium "image" property value and then applies it to the view.
	 * @param value References the image via a string path, file, or blob. Can be null to remove image.
	 */
	private void updateImageDrawableWith(Object value)
	{
		if (this.maskedDrawable != null) {
			Drawable drawable = null;
			if (value != null) {
				drawable = loadDrawableFrom(value);
				if (drawable == null) {
					Log.w(TAG, "Failed to load image.");
				}
			}
			this.maskedDrawable.setImageDrawable(drawable);
		}
	}

	/**
	 * Validates given Titanium "mask" property value and then applies it to the view.
	 * @param value References the mask via a string path, file, or blob. Can be null to remove mask.
	 */
	private void updateMaskDrawableWith(Object value)
	{
		if (this.maskedDrawable != null) {
			Drawable drawable = null;
			if (value != null) {
				drawable = loadDrawableFrom(value);
				if (drawable == null) {
					Log.w(TAG, "Failed to load mask.");
				}
			}
			this.maskedDrawable.setMaskDrawable(drawable);
		}
	}

	/**
	 * Loads given given image file reference and returns it as a drawable.
	 * @param value References the image file via a string path, file, or blob. Can be null.
	 * @return Returns the loaded drawable if successful. Returns null if failed to load or given null.
	 */
	private Drawable loadDrawableFrom(Object value)
	{
		Drawable drawable = null;
		ImageView imageView = getImageView();
		if ((imageView != null) && (value != null)) {
			TiDrawableReference drawableReference = TiDrawableReference.fromObject(getProxy(), value);
			drawable = drawableReference.getDrawable();
			if ((drawable instanceof BitmapDrawable) && !drawableReference.isTypeResourceId()) {
				// "TiDrawableReference" has a bug where drawables loaded outside of the APK "res" directory
				// will be wrongly downscaled because density has not been assigned to drawable.
				// Work-Around: Create new drawable assigning density via resources.
				drawable = new BitmapDrawable(imageView.getResources(), ((BitmapDrawable) drawable).getBitmap());
			}
		}
		return drawable;
	}

	/**
	 * Validates given Titanium blend "mode" property value and applies it to the masked image drawable.
	 * @param value
	 * The value assigned to the "mode" property. Expected to be a UIModule BLEND_MODE_* constant.
	 */
	private void updateBlendModeWith(Object value)
	{
		// Do not continue if drawable was released.
		if (this.maskedDrawable == null) {
			return;
		}

		// Attempt to convert given Titanium blend mode value to an Android porter duff enum value.
		PorterDuff.Mode porterDuffMode = null;
		if (value instanceof Number) {
			final String WARNING_MESSAGE = "MaskedImage does not support '%s' on Android.";
			int intValue = TiConvert.toInt(value, UIModule.BLEND_MODE_SOURCE_IN);
			switch (intValue) {
				case UIModule.BLEND_MODE_NORMAL:
					porterDuffMode = PorterDuff.Mode.SRC_OVER;
					break;
				case UIModule.BLEND_MODE_MULTIPLY:
					porterDuffMode = PorterDuff.Mode.MULTIPLY;
					break;
				case UIModule.BLEND_MODE_SCREEN:
					porterDuffMode = PorterDuff.Mode.SCREEN;
					break;
				case UIModule.BLEND_MODE_OVERLAY:
					porterDuffMode = PorterDuff.Mode.OVERLAY;
					break;
				case UIModule.BLEND_MODE_DARKEN:
					porterDuffMode = PorterDuff.Mode.DARKEN;
					break;
				case UIModule.BLEND_MODE_LIGHTEN:
					porterDuffMode = PorterDuff.Mode.LIGHTEN;
					break;
				case UIModule.BLEND_MODE_COLOR_DODGE:
					Log.w(TAG, String.format(WARNING_MESSAGE, "BLEND_MODE_COLOR_DODGE"));
					break;
				case UIModule.BLEND_MODE_COLOR_BURN:
					Log.w(TAG, String.format(WARNING_MESSAGE, "BLEND_MODE_COLOR_BURN"));
					break;
				case UIModule.BLEND_MODE_SOFT_LIGHT:
					Log.w(TAG, String.format(WARNING_MESSAGE, "BLEND_MODE_SOFT_LIGHT"));
					break;
				case UIModule.BLEND_MODE_HARD_LIGHT:
					Log.w(TAG, String.format(WARNING_MESSAGE, "BLEND_MODE_HARD_LIGHT"));
					break;
				case UIModule.BLEND_MODE_DIFFERENCE:
					Log.w(TAG, String.format(WARNING_MESSAGE, "BLEND_MODE_DIFFERENCE"));
					break;
				case UIModule.BLEND_MODE_EXCLUSION:
					Log.w(TAG, String.format(WARNING_MESSAGE, "BLEND_MODE_EXCLUSION"));
					break;
				case UIModule.BLEND_MODE_HUE:
					Log.w(TAG, String.format(WARNING_MESSAGE, "BLEND_MODE_HUE"));
					break;
				case UIModule.BLEND_MODE_SATURATION:
					Log.w(TAG, String.format(WARNING_MESSAGE, "BLEND_MODE_SATURATION"));
					break;
				case UIModule.BLEND_MODE_COLOR:
					Log.w(TAG, String.format(WARNING_MESSAGE, "BLEND_MODE_COLOR"));
					break;
				case UIModule.BLEND_MODE_LUMINOSITY:
					Log.w(TAG, String.format(WARNING_MESSAGE, "BLEND_MODE_LUMINOSITY"));
					break;
				case UIModule.BLEND_MODE_CLEAR:
					porterDuffMode = PorterDuff.Mode.CLEAR;
					break;
				case UIModule.BLEND_MODE_COPY:
					porterDuffMode = PorterDuff.Mode.SRC;
					break;
				case UIModule.BLEND_MODE_SOURCE_IN:
					porterDuffMode = PorterDuff.Mode.SRC_IN;
					break;
				case UIModule.BLEND_MODE_SOURCE_OUT:
					porterDuffMode = PorterDuff.Mode.SRC_OUT;
					break;
				case UIModule.BLEND_MODE_SOURCE_ATOP:
					porterDuffMode = PorterDuff.Mode.SRC_ATOP;
					break;
				case UIModule.BLEND_MODE_DESTINATION_OVER:
					porterDuffMode = PorterDuff.Mode.DST_OVER;
					break;
				case UIModule.BLEND_MODE_DESTINATION_IN:
					porterDuffMode = PorterDuff.Mode.DST_IN;
					break;
				case UIModule.BLEND_MODE_DESTINATION_OUT:
					porterDuffMode = PorterDuff.Mode.DST_OUT;
					break;
				case UIModule.BLEND_MODE_DESTINATION_ATOP:
					porterDuffMode = PorterDuff.Mode.DST_ATOP;
					break;
				case UIModule.BLEND_MODE_XOR:
					porterDuffMode = PorterDuff.Mode.XOR;
					break;
				case UIModule.BLEND_MODE_PLUS_DARKER:
					Log.w(TAG, String.format(WARNING_MESSAGE, "BLEND_MODE_PLUS_DARKER"));
					break;
				case UIModule.BLEND_MODE_PLUS_LIGHTER:
					porterDuffMode = PorterDuff.Mode.ADD;
					break;
				default:
					Log.w(TAG, "MaskedImage 'mode' property given unknown value: " + intValue);
					break;
			}
		} else if (value != null) {
			Log.w(TAG, "MaskedImage 'mode' property must be set to a numeric 'BLEND_MODE_*' constant.");
		} else {
			Log.w(TAG, "MaskedImage 'mode' property cannot be set to null.");
		}

		// Apply blend mode if given a valid value.
		if (porterDuffMode != null) {
			this.maskedDrawable.setBlendMode(porterDuffMode);
		}
	}

	/**
	 * Validates given Titanium "tint" property value and applies it to the view.
	 * @param value Object representing a color value or name. Set to null to disable tinting.
	 */
	private void updateMaskTintWith(Object value)
	{
		if (this.maskedDrawable != null) {
			if (value instanceof String) {
				int color = TiConvert.toColor((String) value);
				this.maskedDrawable.setTintColor(color);
				this.maskedDrawable.setTintingEnabled(true);
			} else if (value != null) {
				Log.w(TAG, "MaskedImage 'tint' property must be set to a string.");
			} else {
				this.maskedDrawable.setTintingEnabled(false);
			}
		}
	}

	/**
	 * Validates given Titanium "tintColor" property value and applies it to the view.
	 * @param value Object representing a color value or name. Set to null to disable tinting.
	 */
	private void updateTintColorFilterWith(Object value)
	{
		if (this.maskedDrawable != null) {
			if (value instanceof String) {
				int color = TiConvert.toColor((String) value);
				this.maskedDrawable.setColorFilter(color, PorterDuff.Mode.MULTIPLY);
			} else if (value != null) {
				Log.w(TAG, "MaskedImage 'tintColor' property must be set to a string.");
			} else {
				this.maskedDrawable.clearColorFilter();
			}
		}
	}

	/**
	 * Gets the ImageView used by this MaskedImage type.
	 * @return Returns the ImageView. Returns null if view has been released.
	 */
	private ImageView getImageView()
	{
		View view = getNativeView();
		return (view instanceof ImageView) ? (ImageView) view : null;
	}

	/**
	 * Custom drawable used to render an image or tint color to a mask.
	 * <p>
	 * Only intended to be used by the "TiUIMaskedImage" class.
	 */
	private static class MaskedDrawable extends Drawable implements Drawable.Callback
	{
		private PorterDuff.Mode porterDuffMode;
		private Drawable maskDrawable;
		private Drawable imageDrawable;
		private boolean isTintingEnabled;
		private int tintColor;
		private int alpha;
		private ColorFilter colorFilter;
		private BaseMaskHandler maskHandler;

		public MaskedDrawable()
		{
			this.alpha = 255;
			setBlendMode(null);
		}

		public void setMaskDrawable(Drawable drawable)
		{
			// Do not continue if setting is not changing.
			if (drawable == this.maskDrawable) {
				return;
			}

			// Stop listening to previously assigned drawable's events.
			if (this.maskDrawable != null) {
				this.maskDrawable.setCallback(null);
			}

			// Store given drawable and listen for its events.
			this.maskDrawable = drawable;
			if (this.maskDrawable != null) {
				this.maskDrawable.setCallback(this);
			}

			// Notify listeners about this setting change.
			if (this.maskHandler != null) {
				this.maskHandler.onMaskDrawableChanged();
			}
			onSettingsChanged();
		}

		public Drawable getMaskDrawable()
		{
			return this.maskDrawable;
		}

		public void setImageDrawable(Drawable drawable)
		{
			// Do not continue if setting is not changing.
			if (drawable == this.imageDrawable) {
				return;
			}
			// Stop listening to previously assigned drawable's events.
			if (this.imageDrawable != null) {
				this.imageDrawable.setCallback(null);
			}

			// Store given drawable and listen for its events.
			this.imageDrawable = drawable;
			if (this.imageDrawable != null) {
				this.imageDrawable.setCallback(this);
			}

			// Notify listeners about this setting change.
			if (this.maskHandler != null) {
				this.maskHandler.onImageDrawableChanged();
			}
			onSettingsChanged();
		}

		public Drawable getImageDrawable()
		{
			return this.imageDrawable;
		}

		public void setTintingEnabled(boolean value)
		{
			// Do not continue if setting is not changing.
			if (value == this.isTintingEnabled) {
				return;
			}

			// Store given setting and notify mask handler.
			this.isTintingEnabled = value;
			if (this.maskHandler != null) {
				this.maskHandler.onTintEnabledChanged();
			}
			onSettingsChanged();
		}

		public boolean isTintingEnabled()
		{
			return this.isTintingEnabled;
		}

		public void setTintColor(int value)
		{
			// Do not continue if setting is not changing.
			if (value == this.tintColor) {
				return;
			}

			// Store given setting and notify mask handler.
			this.tintColor = value;
			if (this.maskHandler != null) {
				this.maskHandler.onTintColorChanged();
			}
			onSettingsChanged();
		}

		public int getTintColor()
		{
			return this.tintColor;
		}

		@Override
		public void setColorFilter(ColorFilter colorFilter)
		{
			// Do not continue if setting is not changing.
			if (colorFilter == this.colorFilter) {
				return;
			}

			// Store given setting and notify mask handler.
			this.colorFilter = colorFilter;
			if (this.maskHandler != null) {
				this.maskHandler.onColorFilterChanged();
			}
			onSettingsChanged();
		}

		@Override
		public ColorFilter getColorFilter()
		{
			return this.colorFilter;
		}

		@Override
		public void setAlpha(int value)
		{
			// Do not allow alpha value to exceed min/max boundaries.
			if (value < 0) {
				value = 0;
			} else if (value > 255) {
				value = 255;
			}

			// Do not continue if setting is not changing.
			if (value == this.alpha) {
				return;
			}

			// Store given setting and notify mask handler.
			this.alpha = value;
			if (this.maskHandler != null) {
				this.maskHandler.onAlphaChanged();
			}
			onSettingsChanged();
		}

		@Override
		public int getAlpha()
		{
			return this.alpha;
		}

		public void setBlendMode(PorterDuff.Mode value)
		{
			// Make sure blend mode is assigned a valid value.
			if (value == null) {
				value = PorterDuff.Mode.SRC_IN;
			}

			// Do not continue if setting is not changing.
			if (value == this.porterDuffMode) {
				return;
			}

			// Store given setting and notify mask handler.
			this.porterDuffMode = value;
			if (this.maskHandler != null) {
				this.maskHandler.onBlendModeChanged();
			}
			onSettingsChanged();
		}

		public PorterDuff.Mode getBlendMode()
		{
			return this.porterDuffMode;
		}

		@Override
		public int getIntrinsicWidth()
		{
			if (this.imageDrawable != null) {
				return this.imageDrawable.getIntrinsicWidth();
			} else if (this.maskDrawable != null) {
				return this.maskDrawable.getIntrinsicWidth();
			}
			return -1;
		}

		@Override
		public int getIntrinsicHeight()
		{
			if (this.imageDrawable != null) {
				return this.imageDrawable.getIntrinsicHeight();
			} else if (this.maskDrawable != null) {
				return this.maskDrawable.getIntrinsicHeight();
			}
			return -1;
		}

		@Override
		public int getOpacity()
		{
			return PixelFormat.TRANSLUCENT;
		}

		@Override
		public void invalidateDrawable(Drawable who)
		{
			// This drawable's owned "maskDrawable" or "imageDrawable" has been invalidated.
			// Invalidate self, which lets this drawable's owner know that a re-draw is needed.
			invalidateSelf();
		}

		@Override
		public void scheduleDrawable(Drawable who, Runnable what, long when)
		{
			// Post the runnable given to us by the child drawable.
			scheduleSelf(what, when);
		}

		@Override
		public void unscheduleDrawable(Drawable who, Runnable what)
		{
			// Remove the given runnable that was last posted to scheduleDrawable().
			unscheduleSelf(what);
		}

		@Override
		public void draw(Canvas canvas)
		{
			// Validate argument.
			if (canvas == null) {
				return;
			}

			// Attempt to draw with the last created mask handler, if assigned.
			boolean wasDrawn = false;
			if (this.maskHandler != null) {
				wasDrawn = this.maskHandler.drawTo(canvas);
			}

			// Create a mask handler if not done yet or if current handler is unable to draw with current settings.
			if (wasDrawn == false) {
				// Create a new handler. Prefer optimized versions if possible.
				// Note: The "FallbackMaskHandler" is the most capable, but is the most expensive.
				if (FastTintMaskHandler.canDraw(this)) {
					this.maskHandler = new FastTintMaskHandler(this);
				} else if (FastImageMaskHandler.canDraw(this)) {
					this.maskHandler = new FastImageMaskHandler(this);
				} else {
					this.maskHandler = new FallbackMaskHandler(this);
				}

				// Draw with the newly created mask handler.
				wasDrawn = this.maskHandler.drawTo(canvas);
			}
		}

		@Override
		public void onBoundsChange(Rect bounds)
		{
			// Validate argument.
			if (bounds == null) {
				return;
			}

			// Update the bounds of the mask and image drawables.
			if (this.maskDrawable != null) {
				this.maskDrawable.setBounds(bounds);
			}
			if (this.imageDrawable != null) {
				this.imageDrawable.setBounds(bounds);
			}

			// Let the base class handle the event.
			super.onBoundsChange(bounds);

			// Notify the mask handle about the size change. (This must be done last.)
			if (this.maskHandler != null) {
				this.maskHandler.onBoundsChanged();
			}
		}

		private void onSettingsChanged()
		{
			// Check if the last created mask handler needs to be replaced.
			if (this.maskHandler != null) {
				if (this.maskHandler.canDraw() == false) {
					// The current mask handler can't draw with the newest settings.
					this.maskHandler = null;
				} else if (this.maskHandler instanceof FallbackMaskHandler) {
					// Fallback mask handler supports all settings.
					// Check if we can switch to a more optimized handler using newest settings.
					if (FastTintMaskHandler.canDraw(this) || FastImageMaskHandler.canDraw(this)) {
						this.maskHandler = null;
					}
				}
			}

			// Notify the owner that this drawable has changed and needs to be redrawn.
			invalidateSelf();
		}
	}

	/** Base class used to handle drawing masks for the "MaskedDrawable" class. */
	private static abstract class BaseMaskHandler
	{
		/** The MaskedDrawable that owns this handler. Needed to access its settings. */
		private MaskedDrawable maskedDrawable;

		/** Paint object used to render the mask. This is an expensive object and needs to be cached. */
		private Paint paint;

		public BaseMaskHandler(MaskedDrawable maskedDrawable)
		{
			// Validate argument.
			if (maskedDrawable == null) {
				throw new NullPointerException();
			}

			// Initialize member variables.
			this.maskedDrawable = maskedDrawable;
			this.paint = new Paint(Paint.ANTI_ALIAS_FLAG);
			this.paint.setAlpha(maskedDrawable.getAlpha());
			this.paint.setColorFilter(maskedDrawable.getColorFilter());
		}

		public MaskedDrawable getMaskedDrawable()
		{
			return this.maskedDrawable;
		}

		public Paint getPaint()
		{
			return this.paint;
		}

		public void onBoundsChanged()
		{
		}

		public void onBlendModeChanged()
		{
		}

		public void onAlphaChanged()
		{
			this.paint.setAlpha(this.maskedDrawable.getAlpha());
		}

		public void onColorFilterChanged()
		{
			this.paint.setColorFilter(this.maskedDrawable.getColorFilter());
		}

		public void onTintEnabledChanged()
		{
		}

		public void onTintColorChanged()
		{
		}

		public void onImageDrawableChanged()
		{
		}

		public void onMaskDrawableChanged()
		{
		}

		public abstract boolean canDraw();
		public abstract boolean drawTo(Canvas canvas);

		protected Bitmap getBitmapFrom(Drawable drawable)
		{
			Bitmap bitmap = null;
			if (drawable instanceof BitmapDrawable) {
				bitmap = ((BitmapDrawable) drawable).getBitmap();
			}
			return bitmap;
		}
	}

	/**
	 * Handler optimized to render a tint color to a mask via GPU shaders. Supports all blend modes.
	 * <p>
	 * This class is only intended to be used by a "MaskedDrawable" type.
	 */
	private static class FastTintMaskHandler extends BaseMaskHandler
	{
		/** Shader used to render the image. */
		private BitmapShader maskShader;

		/** Shader used to render the tint color. */
		private LinearGradient tintShader;

		public FastTintMaskHandler(MaskedDrawable maskedDrawable)
		{
			super(maskedDrawable);
		}

		@Override
		public boolean drawTo(Canvas canvas)
		{
			boolean wasUpdated = false;

			// Validate.
			if (canvas == null) {
				return false;
			}
			if (canDraw() == false) {
				return false;
			}

			// Create mask shader, if not done already.
			if (this.maskShader == null) {
				Bitmap maskBitmap = getBitmapFrom(getMaskedDrawable().getMaskDrawable());
				if (maskBitmap == null) {
					return false;
				}
				this.maskShader = new BitmapShader(maskBitmap, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP);
				wasUpdated = true;
			}

			// Create tint shader, if not done already.
			if (this.tintShader == null) {
				if (getMaskedDrawable().isTintingEnabled() == false) {
					return false;
				}
				int color = getMaskedDrawable().getTintColor();
				this.tintShader = new LinearGradient(0, 0, 0, 0, color, color, Shader.TileMode.CLAMP);
				wasUpdated = true;
			}

			// Update the sizes of the above shaders, if needed.
			if (wasUpdated) {
				onBoundsChanged();
			}

			// Create a new "compose" shader (if needed) which merges the bitmap and tint shaders.
			if (wasUpdated || (getPaint().getShader() == null)) {
				PorterDuff.Mode blendMode = getMaskedDrawable().getBlendMode();
				getPaint().setShader(new ComposeShader(this.maskShader, this.tintShader, blendMode));
			}

			// Draw the tinted mask using the shaders created above.
			// This takes advantage of hardware acceleration via shaders.
			canvas.drawPaint(getPaint());
			return true;
		}

		@Override
		public void onBoundsChanged()
		{
			// Fetch the bounds of the drawable that owns this handler.
			RectF drawableBounds = new RectF(getMaskedDrawable().getBounds());

			// Modify mask shader's matrix to stretch/fill the drawable.
			if (this.maskShader != null) {
				Bitmap bitmap = getBitmapFrom(getMaskedDrawable().getMaskDrawable());
				if (bitmap != null) {
					RectF maskBounds = new RectF();
					maskBounds.right = (float) bitmap.getWidth();
					maskBounds.bottom = (float) bitmap.getHeight();
					Matrix matrix = new Matrix();
					matrix.setRectToRect(maskBounds, drawableBounds, Matrix.ScaleToFit.FILL);
					this.maskShader.setLocalMatrix(matrix);
				}
			}

			// Modify tint shader's matrix to stretch/fill the drawable.
			if (this.tintShader != null) {
				Matrix matrix = new Matrix();
				matrix.setRectToRect(new RectF(), drawableBounds, Matrix.ScaleToFit.FILL);
				this.tintShader.setLocalMatrix(matrix);
			}
		}

		@Override
		public void onBlendModeChanged()
		{
			getPaint().setShader(null);
		}

		@Override
		public void onTintEnabledChanged()
		{
			this.tintShader = null;
		}

		@Override
		public void onTintColorChanged()
		{
			this.tintShader = null;
		}

		@Override
		public void onMaskDrawableChanged()
		{
			this.maskShader = null;
		}

		@Override
		public boolean canDraw()
		{
			return canDraw(getMaskedDrawable());
		}

		public static boolean canDraw(MaskedDrawable maskedDrawable)
		{
			if (maskedDrawable == null) {
				return false;
			}
			if (maskedDrawable.isTintingEnabled() == false) {
				return false;
			}
			if ((maskedDrawable.getMaskDrawable() instanceof BitmapDrawable) == false) {
				return false;
			}
			if (maskedDrawable.getImageDrawable() != null) {
				return false;
			}
			return true;
		}
	}

	/**
	 * Handler optimized in drawing an image to a mask via a GPU shader. Only supports modes SRC_IN and DST_IN.
	 * <p>
	 * This class is only intended to be used by a "MaskedDrawable" type.
	 */
	private static class FastImageMaskHandler extends BaseMaskHandler
	{
		/** Shader used to fill the mask with an image. */
		private BitmapShader bitmapShader;

		/** The mask stored in 8-bit grayscale form. */
		private Bitmap grayscaledBitmap;

		public FastImageMaskHandler(MaskedDrawable maskedDrawable)
		{
			super(maskedDrawable);

			// This flag prevents stretched images from being pixelated when calling Canvas.drawBitmap().
			Paint paint = getPaint();
			paint.setFlags(paint.getFlags() | Paint.FILTER_BITMAP_FLAG);
		}

		@Override
		public boolean drawTo(Canvas canvas)
		{
			// Validate.
			if (canvas == null) {
				return false;
			}
			if (canDraw() == false) {
				return false;
			}

			// Fetch the assigned blend mode.
			PorterDuff.Mode blendMode = getMaskedDrawable().getBlendMode();

			// Fetch/Create the 8-bit grayscaled bitmap mask.
			if (this.grayscaledBitmap == null) {
				Bitmap bitmap = null;
				if (blendMode == PorterDuff.Mode.SRC_IN) {
					bitmap = getBitmapFrom(getMaskedDrawable().getMaskDrawable());
				} else if (blendMode == PorterDuff.Mode.DST_IN) {
					bitmap = getBitmapFrom(getMaskedDrawable().getImageDrawable());
				}
				if ((Build.VERSION.SDK_INT == 19) || (Build.VERSION.SDK_INT == 20)) {
					// Android 4.4 has a bug where if bitmap byte width does not fit a 4 byte packing alignment,
					// then mask will appear skewed. Resizing bitmap doesn't work. So, give up if this happens.
					if ((bitmap != null) && ((bitmap.getWidth() % 4) != 0)) {
						bitmap = null;
					}
				}
				if (bitmap != null) {
					try {
						if (bitmap.getConfig() != Bitmap.Config.ALPHA_8) {
							bitmap = bitmap.extractAlpha();
						}
					} catch (Exception ex) {
						Log.w(TAG, "Failed to convert mask to an 8-bit grayscale bitmap.");
						bitmap = null;
					}
				}
				if (bitmap == null) {
					return false;
				}
				this.grayscaledBitmap = bitmap;
			}

			// Create a bitmap shader used to fill the above grayscaled mask with the image.
			if ((this.bitmapShader == null) || (getPaint().getShader() == null)) {
				Bitmap bitmap = null;
				if (blendMode == PorterDuff.Mode.SRC_IN) {
					bitmap = getBitmapFrom(getMaskedDrawable().getImageDrawable());
				} else if (blendMode == PorterDuff.Mode.DST_IN) {
					bitmap = getBitmapFrom(getMaskedDrawable().getMaskDrawable());
				}
				if (bitmap == null) {
					return false;
				}
				this.bitmapShader = new BitmapShader(bitmap, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP);
				onBoundsChanged();
				getPaint().setShader(this.bitmapShader);
			}

			// Draw the grayscaled mask and fill it with the paint object's assigned image bitmap shader.
			// This does the equivalent of a SRC_IN via a hardware accelerated shader.
			canvas.drawBitmap(this.grayscaledBitmap, null, getMaskedDrawable().getBounds(), getPaint());
			return true;
		}

		@Override
		public void onBoundsChanged()
		{
			// Do not continue if there is no bitmap shader to resize.
			if (this.bitmapShader == null) {
				return;
			}

			// Fetch the shader's bitmap.
			Bitmap bitmap = null;
			switch (getMaskedDrawable().getBlendMode()) {
				case SRC_IN:
					bitmap = getBitmapFrom(getMaskedDrawable().getImageDrawable());
					break;
				case DST_IN:
					bitmap = getBitmapFrom(getMaskedDrawable().getMaskDrawable());
					break;
			}
			if (bitmap == null) {
				return;
			}

			// Get the new bounds we want to translate and scale the bitmap to.
			RectF targetBounds;
			if (Build.VERSION.SDK_INT >= 24) {
				// For Android 7.0 and above, we must scale bitmap to drawable's bounds.
				targetBounds = new RectF(getMaskedDrawable().getBounds());
			} else if (this.grayscaledBitmap != null) {
				// For OS versions older than 7.0, we must scale bitmap to mask's bounds.
				targetBounds = new RectF();
				targetBounds.right = this.grayscaledBitmap.getWidth();
				targetBounds.bottom = this.grayscaledBitmap.getHeight();
			} else {
				// Failed to obtain bounds. Dump shader and try again on next draw.
				this.bitmapShader = null;
				return;
			}

			// Get the bitmap's raw pixel bounds.
			RectF bitmapBounds = new RectF();
			bitmapBounds.right = (float) bitmap.getWidth();
			bitmapBounds.bottom = (float) bitmap.getHeight();

			// Update the shader's transformation matrix from bitmap's bounds to target bounds.
			// The FILL scale setting will stretch the bitmap if needed.
			Matrix matrix = new Matrix();
			matrix.setRectToRect(bitmapBounds, targetBounds, Matrix.ScaleToFit.FILL);
			this.bitmapShader.setLocalMatrix(matrix);
		}

		@Override
		public void onBlendModeChanged()
		{
			this.bitmapShader = null;
			this.grayscaledBitmap = null;
		}

		@Override
		public void onImageDrawableChanged()
		{
			switch (getMaskedDrawable().getBlendMode()) {
				case SRC_IN:
					this.bitmapShader = null;
					break;
				case DST_IN:
					this.grayscaledBitmap = null;
					break;
				default:
					this.bitmapShader = null;
					this.grayscaledBitmap = null;
					break;
			}
		}

		@Override
		public void onMaskDrawableChanged()
		{
			switch (getMaskedDrawable().getBlendMode()) {
				case SRC_IN:
					this.grayscaledBitmap = null;
					break;
				case DST_IN:
					this.bitmapShader = null;
					break;
				default:
					this.bitmapShader = null;
					this.grayscaledBitmap = null;
					break;
			}
		}

		@Override
		public boolean canDraw()
		{
			return canDraw(getMaskedDrawable());
		}

		public static boolean canDraw(MaskedDrawable maskedDrawable)
		{
			if (maskedDrawable == null) {
				return false;
			}
			if (Build.VERSION.SDK_INT < 18) {
				return false; // Versions older than Android 4.3 have a HW acceleration bug with this handler.
			}
			if (maskedDrawable.isTintingEnabled()) {
				return false;
			}
			if ((maskedDrawable.getMaskDrawable() instanceof BitmapDrawable) == false) {
				return false;
			}
			if ((maskedDrawable.getImageDrawable() instanceof BitmapDrawable) == false) {
				return false;
			}
			PorterDuff.Mode mode = maskedDrawable.getBlendMode();
			if ((mode != PorterDuff.Mode.SRC_IN) && (mode != PorterDuff.Mode.DST_IN)) {
				return false;
			}
			return true;
		}
	}

	/**
	 * Handler capable of tinted masks and masking images for all mask modes.
	 * Capable of rendering all drawable types, such as 9-patches.
	 * <p>
	 * This is the least optimized handler and should only be used if the "Fast" handlers can't be used.
	 * <p>
	 * This class is only intended to be used by a "MaskedDrawable" type.
	 */
	private static class FallbackMaskHandler extends BaseMaskHandler
	{
		/** Stores the last blended/masked image to be re-used by future drawTo() calls. */
		private Bitmap blendedBitmap;

		public FallbackMaskHandler(MaskedDrawable maskedDrawable)
		{
			super(maskedDrawable);

			// This flag prevents stretched images from being pixelated when calling Canvas.drawBitmap().
			Paint paint = getPaint();
			paint.setFlags(paint.getFlags() | Paint.FILTER_BITMAP_FLAG);
		}

		@Override
		public boolean drawTo(Canvas canvas)
		{
			// Validate.
			if (canvas == null) {
				return false;
			}

			// Create a blended bitmap with the given mask settings and cache it.
			if (this.blendedBitmap == null) {
				// Determine what size the blended bitmap should be.
				// Note: Prefer intrinsic size if available. Provided by bitmap drawables, but not 9-patches.
				RectF targetBounds = new RectF();
				if (hasFixedSizeBitmap()) {
					targetBounds.right = Math.max((float) getMaskedDrawable().getIntrinsicWidth(), 1.0f);
					targetBounds.bottom = Math.max((float) getMaskedDrawable().getIntrinsicHeight(), 1.0f);
				} else {
					Rect drawableBounds = getMaskedDrawable().getBounds();
					targetBounds.right = (float) drawableBounds.width();
					targetBounds.bottom = (float) drawableBounds.height();
				}

				// Determine the max pixel size the blended bitmap can be.
				// This will avoid exceeding GPU's max texture size and canvas' max bitmap size.
				// TODO: In the future, use GL_MAX_TEXTURE_SIZE instead of window size since it's usually larger.
				int maxPixelSize = Math.min(canvas.getMaximumBitmapWidth(), canvas.getMaximumBitmapHeight());
				{
					int maxWindowSize = getMaxWindowPixelSize();
					if (maxWindowSize > 0) {
						maxPixelSize = Math.min(maxWindowSize, maxPixelSize);
					}
				}

				// Create a bitmap canvas to draw to.
				// Downscale if too big or not enough memory. Will appear pixelated, but will at least show something.
				Bitmap bufferedBitmap = null;
				float scale = 1.0f;
				RectF bufferedBounds = new RectF(0, 0, targetBounds.width(), targetBounds.height());
				if (bufferedBounds.isEmpty()) {
					return false;
				}
				while (bufferedBitmap == null) {
					try {
						int width = (int) bufferedBounds.width();
						int height = (int) bufferedBounds.height();
						if ((width <= maxPixelSize) && (height <= maxPixelSize)) {
							bufferedBitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
						}
					} catch (Exception ex) {
					}
					if (bufferedBitmap == null) {
						scale *= 0.5f;
						bufferedBounds.right = targetBounds.width() * scale;
						bufferedBounds.bottom = targetBounds.height() * scale;
						if (bufferedBounds.isEmpty()) {
							return false;
						}
					}
				}
				Canvas bufferedCanvas = new Canvas(bufferedBitmap);
				bufferedCanvas.scale(scale, scale);
				bufferedCanvas.drawColor(0, PorterDuff.Mode.CLEAR);
				Paint bufferedPaint = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);

				// Draw the mask, if assigned.
				// Attempt to draw bitmap ourselves. Will improve render quality since we use FILTER_BITMAP_FLAG.
				Drawable maskDrawable = getMaskedDrawable().getMaskDrawable();
				if (maskDrawable != null) {
					Bitmap maskBitmap = getBitmapFrom(maskDrawable);
					if (maskBitmap != null) {
						bufferedCanvas.drawBitmap(maskBitmap, null, targetBounds, bufferedPaint);
					} else {
						maskDrawable.draw(bufferedCanvas);
					}
				}

				// Set up the paint object to blend the tint/image with the above mask.
				// Note: If no mask was assigned, then don't blend.
				if (maskDrawable != null) {
					bufferedPaint.setXfermode(new PorterDuffXfermode(getMaskedDrawable().getBlendMode()));
				}

				// Blend the assigned image with the above mask.
				Drawable imageDrawable = getMaskedDrawable().getImageDrawable();
				Bitmap imageBitmap = getBitmapFrom(imageDrawable);
				if (imageBitmap != null) {
					// Draw the image drawable's bitmap ourselves with given blend mode. (Most optmized.)
					bufferedCanvas.drawBitmap(imageBitmap, null, targetBounds, bufferedPaint);
				} else if (imageDrawable != null) {
					// Draw the image via its drawable with given blend mode. (Least optimized.)
					// Note: Blend mode is assigned to canvas saveLayer() and will be applied when canvas is restored.
					try {
						bufferedCanvas.saveLayer(targetBounds, bufferedPaint, Canvas.ALL_SAVE_FLAG);
						bufferedCanvas.drawColor(0, PorterDuff.Mode.CLEAR);
						imageDrawable.draw(bufferedCanvas);
						bufferedCanvas.restore();
					} catch (Exception ex) {
					}
				}

				// Blend the assigned tint color over the last draw mask and/or image. (Must be done last.)
				if (getMaskedDrawable().isTintingEnabled()) {
					bufferedPaint.setColor(getMaskedDrawable().getTintColor());
					bufferedCanvas.drawRect(targetBounds, bufferedPaint);
				}

				// Store the blended bitmap so that we can re-use it for future draws.
				this.blendedBitmap = bufferedBitmap;
			}

			// Draw the cached blended bitmap created above. Stretch it to fill the drawable's bounds.
			canvas.drawBitmap(this.blendedBitmap, null, getMaskedDrawable().getBounds(), getPaint());
			return true;
		}

		@Override
		public void onBoundsChanged()
		{
			// Only re-draw cached blended bitmap if needed.
			// We typically don't need to if using BitmapDrawable types, but with 9-patches we do.
			if (hasFixedSizeBitmap() == false) {
				this.blendedBitmap = null;
			}
		}

		private boolean hasFixedSizeBitmap()
		{
			// If the mask drawable and image drawable have a fixed size (always the case for BitmapDrawable types),
			// then the cached "blendedBitmap" can have a fixed size too and only needs to be generated once.
			Drawable drawable = getMaskedDrawable().getMaskDrawable();
			if ((drawable != null) && (getBitmapFrom(drawable) == null)) {
				return false;
			}
			drawable = getMaskedDrawable().getImageDrawable();
			if ((drawable != null) && (getBitmapFrom(drawable) == null)) {
				return false;
			}
			return true;
		}

		@Override
		public void onBlendModeChanged()
		{
			this.blendedBitmap = null;
		}

		@Override
		public void onTintEnabledChanged()
		{
			this.blendedBitmap = null;
		}

		@Override
		public void onTintColorChanged()
		{
			this.blendedBitmap = null;
		}

		@Override
		public void onMaskDrawableChanged()
		{
			this.blendedBitmap = null;
		}

		@Override
		public void onImageDrawableChanged()
		{
			this.blendedBitmap = null;
		}

		@Override
		public boolean canDraw()
		{
			return true;
		}

		public static boolean canDraw(MaskedDrawable maskedDrawable)
		{
			return (maskedDrawable != null);
		}

		private static int getMaxWindowPixelSize()
		{
			TiApplication application = TiApplication.getInstance();
			if (application != null) {
				Object object = application.getSystemService(Context.WINDOW_SERVICE);
				if (object instanceof WindowManager) {
					WindowManager windowManager = (WindowManager) object;
					Display display = windowManager.getDefaultDisplay();
					if (display != null) {
						DisplayMetrics metrics = new DisplayMetrics();
						if (Build.VERSION.SDK_INT >= 17) {
							display.getRealMetrics(metrics);
						} else {
							display.getMetrics(metrics);
						}
						return Math.max(metrics.widthPixels, metrics.heightPixels);
					}
				}
			}
			return -1;
		}
	}
}
