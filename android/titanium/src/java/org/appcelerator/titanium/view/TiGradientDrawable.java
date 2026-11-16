/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.view;

import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.TiPoint;
import org.appcelerator.titanium.util.TiConvert;

import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.RadialGradient;
import android.graphics.Shader;
import android.graphics.Shader.TileMode;
import android.graphics.drawable.ShapeDrawable;
import android.graphics.drawable.shapes.RectShape;
import android.view.View;

public class TiGradientDrawable extends ShapeDrawable
{
	public enum GradientType { LINEAR_GRADIENT, RADIAL_GRADIENT }

	private static final TiPoint DEFAULT_START_POINT = new TiPoint(0, 0);
	private static final TiPoint DEFAULT_END_POINT = new TiPoint("0", "100%");
	private static final TiDimension DEFAULT_RADIUS = new TiDimension(0.0, TiDimension.TYPE_UNDEFINED);
	private static final String TAG = "TiGradientDrawable";

	private GradientType gradientType;
	private TiPoint startPoint = DEFAULT_START_POINT;
	private TiPoint endPoint = DEFAULT_END_POINT;
	private TiDimension startRadius = DEFAULT_RADIUS;
	private TiDimension endRadius = DEFAULT_RADIUS;
	private int[] colors;
	private float[] offsets;
	private boolean isBackFillingStart;
	private boolean isBackFillingEnd;
	private View view;

	@SuppressWarnings("rawtypes")
	public TiGradientDrawable(View view, KrollDict properties)
	{
		super(new RectShape());

		// Store a reference to the view that this gradient will be drawn to.
		// It's needed to convert from "dp" to "pixels", if needed.
		this.view = view;

		// Determine which type of gradient is being used.
		{
			final String LINEAR_STRING_ID = "linear";
			final String RADIAL_STRING_ID = "radial";
			String type = properties.optString("type", LINEAR_STRING_ID);
			if (type.equals(LINEAR_STRING_ID)) {
				gradientType = GradientType.LINEAR_GRADIENT;
			} else if (type.equals(RADIAL_STRING_ID)) {
				gradientType = GradientType.RADIAL_GRADIENT;
			} else {
				throw new IllegalArgumentException("Invalid gradient type. Must be '" + LINEAR_STRING_ID + "' or '"
												   + RADIAL_STRING_ID + "'.");
			}
		}

		// Load the 'startPoint' property which defines the start of the gradient.
		Object startPointObject = properties.get("startPoint");
		if (startPointObject instanceof HashMap) {
			startPoint = new TiPoint((HashMap) startPointObject, 0, 0);
		}

		// Load the 'endPoint' property which defines the end of the gradient.
		// Note: this is only used for linear gradient since Android does not
		// support an ending circle for radial gradients.
		Object endPointObject = properties.get("endPoint");
		if (endPointObject instanceof HashMap) {
			endPoint = new TiPoint((HashMap) endPointObject, 0, 1);
		}

		// Fetch the start/end radius values for a "radial" gradient.
		this.startRadius = TiConvert.toTiDimension(properties, "startRadius", TiDimension.TYPE_UNDEFINED);
		if ((this.startRadius == null) || (this.startRadius.getValue() < 0.0)) {
			this.startRadius = DEFAULT_RADIUS;
		}
		this.endRadius = TiConvert.toTiDimension(properties, "endRadius", TiDimension.TYPE_UNDEFINED);
		if ((this.endRadius == null) || (this.endRadius.getValue() < 0.0)) {
			this.endRadius = DEFAULT_RADIUS;
		}

		// Fetch the fill properties for a "radial" gradient.
		this.isBackFillingStart = TiConvert.toBoolean(properties, "backfillStart", false);
		this.isBackFillingEnd = TiConvert.toBoolean(properties, "backfillEnd", false);

		// Load the gradient's colors/offsets.
		Object colors = properties.get("colors");
		if (!(colors instanceof Object[])) {
			Log.w(TAG, "Android does not support gradients without colors.");
			throw new IllegalArgumentException("Must provide an array of colors.");
		}
		loadColors((Object[]) colors);

		// For radial gradients, convert given iOS/HTML5 style radii and offsets to how Android handles them.
		// This must be done after fetching all gradient settings up above.
		if (this.gradientType == GradientType.RADIAL_GRADIENT) {
			// If given radius starts from the outer edge of the circle,
			// then reverse settings so that it starts from the inner part of the circle.
			if (this.startRadius.getValue() > this.endRadius.getValue()) {
				// Reverse radius settings.
				TiDimension radiusValue = this.startRadius;
				this.startRadius = this.endRadius;
				this.endRadius = radiusValue;

				// Reverse fill settings.
				boolean isFilling = this.isBackFillingStart;
				this.isBackFillingStart = this.isBackFillingEnd;
				this.isBackFillingEnd = isFilling;

				// Reverse color array.
				if (this.colors.length > 1) {
					for (int index = (this.colors.length - 1) / 2; index >= 0; index--) {
						int swapIndex = (this.colors.length - 1) - index;
						if (index != swapIndex) {
							int colorValue = this.colors[index];
							this.colors[index] = this.colors[swapIndex];
							this.colors[swapIndex] = colorValue;
						}
					}
				}

				// Reverse offset array and invert offset values. (ex: 1.0 -> 0.0 and 0.0 -> 1.0)
				if ((this.offsets != null) && (this.offsets.length > 0)) {
					for (int index = (this.offsets.length - 1) / 2; index >= 0; index--) {
						int swapIndex = (this.offsets.length - 1) - index;
						if (index != swapIndex) {
							float offsetValue = this.offsets[index];
							this.offsets[index] = 1.0f - this.offsets[swapIndex];
							this.offsets[swapIndex] = 1.0f - offsetValue;
						}
					}
					if ((this.offsets.length % 2) != 0) {
						int middleIndex = this.offsets.length / 2;
						this.offsets[middleIndex] = 1.0f - this.offsets[middleIndex];
					}
				}
			}

			// Calculate the start/end radius positions in fractional pixels.
			double startPixelRadius = this.startRadius.getPixels(view);
			double endPixelRadius = this.endRadius.getPixels(view);

			// If given a "colors" array with only 1 color, change it to 2 colors for each start/end radii.
			// Note: This greatly simplifies the code below.
			if (this.colors.length < 2) {
				int[] newColorArray = new int[] { Color.TRANSPARENT, Color.TRANSPARENT };
				if (this.colors.length == 1) {
					newColorArray[0] = this.colors[0];
					newColorArray[1] = this.colors[0];
				}
				this.colors = newColorArray;
				this.offsets = new float[] { 0.0f, 1.0f };
			}

			// If start radius is zero, then make sure to fill circle's center pixel with the starting color.
			// Note: Avoids an issue where circle's center pixel will be transparent since the below will
			//       insert a transparent color to the front of the array if back-filling is disabled.
			if (startPixelRadius < 1.0) {
				this.isBackFillingStart = true;
			}

			// Add 3 colors to the front and 2 to the back for the fill color handling.
			// - 1st/2nd colors are used to back-fill before start radius. 1st color is set to circle's center.
			// - 3rd color does an inner-fill to circle's edge in case first offset given is set greater than 0.0.
			// - 2nd-to-last color does an inner-fill to circle's edge in case last offset given is less than 1.0.
			// - Last color is used to back-fill after the end radius. (Google auto back-fills with last color.)
			// Note: Android 4.2-4.4 has a bug where it shows scrambled graphics when back-filling with start color.
			//       So, we work-around this by injecting 1st color to center of circle as described above.
			{
				int[] newColorArray = new int[this.colors.length + 5];
				newColorArray[0] = this.isBackFillingStart ? this.colors[0] : Color.TRANSPARENT;
				newColorArray[1] = newColorArray[0];
				newColorArray[2] = this.colors[0];
				System.arraycopy(this.colors, 0, newColorArray, 3, this.colors.length);
				newColorArray[newColorArray.length - 2] = this.colors[this.colors.length - 1];
				int outerFillColor = Color.TRANSPARENT;
				if (this.isBackFillingEnd) {
					outerFillColor = this.colors[this.colors.length - 1];
				}
				newColorArray[newColorArray.length - 1] = outerFillColor;
				this.colors = newColorArray;
			}

			// Update offsets array to match the colors array that was updated above.
			// These offsets are normalized between start radius and end radius.
			if (this.offsets == null) {
				this.offsets = new float[this.colors.length];
				this.offsets[0] = 0.0f;
				this.offsets[1] = 0.0f;
				this.offsets[2] = 0.0f;
				this.offsets[3] = 0.0f;
				if (this.colors.length > 7) {
					double offset = 1.0 / ((double) this.offsets.length - 6.0);
					for (int index = 4; index < (this.offsets.length - 3); index++) {
						this.offsets[index] = this.offsets[index - 1] + (float) offset;
					}
				}
				this.offsets[this.offsets.length - 3] = 1.0f;
				this.offsets[this.offsets.length - 2] = 1.0f;
				this.offsets[this.offsets.length - 1] = 1.0f;
			} else {
				float[] newOffsetArray = new float[this.offsets.length + 5];
				newOffsetArray[0] = 0.0f;
				newOffsetArray[1] = 0.0f;
				newOffsetArray[2] = 0.0f;
				System.arraycopy(this.offsets, 0, newOffsetArray, 3, this.offsets.length);
				newOffsetArray[newOffsetArray.length - 2] = 1.0f;
				newOffsetArray[newOffsetArray.length - 1] = 1.0f;
				this.offsets = newOffsetArray;
			}

			// If given a start radius, convert offsets to be normalized based on center of circle
			// (how Android handles it), instead of basing it from start radius (how iOS handles it).
			// Ex: If given { startRadius: 100, endRadius: 200 }, an offset of 0.0 would be converted to 0.5.
			// Note: Do not convert 1st color offset. It must always be 0.0, which is the circle's center.
			if (startPixelRadius > 0.0) {
				double offset = startPixelRadius / endPixelRadius;
				double scale = (endPixelRadius - startPixelRadius) / endPixelRadius;
				for (int index = 1; index < this.offsets.length; index++) {
					this.offsets[index] = (this.offsets[index] * (float) scale) + (float) offset;
				}
			}

			// Make sure that none of the color offsets land on the same pixels. If they do, shift them up/down.
			// Also, the below prevents any offsets from going backwards compared to previous offset.
			// This works-around the following issues:
			// - Allows back-fill color to work since it may collide with circle's starting/ending color.
			// - Avoids Google bug where a transparent ring will wrongly appear where 2 color offsets collide.
			if ((this.offsets.length >= 2) && (endPixelRadius > 0)) {
				// Calculate the min distance between normalized offsets needed to show all colors.
				// Ideally, this should be a 1 pixel distance, but we may not be able to do this due to precision.
				// Note: Worst case, floating point precision is 1/255, which we should never exceed. Happens when:
				//       - HW acceleration is enabled, but shader on GPU is limited to "lowp" 1 byte floats.
				//       - HW acceleration is disabled. (Google is using 1 byte fixed point integer math.)
				final float MIN_OFFSET_INCREMENT = 1.0f / Math.min((float) endPixelRadius, 255.0f);

				// Shift colliding colors from start to end.
				float previousOffset = this.offsets[0];
				for (int index = 1; index < this.offsets.length; index++) {
					float nextOffset = this.offsets[index];
					if ((nextOffset - previousOffset) < MIN_OFFSET_INCREMENT) {
						nextOffset = Math.min(previousOffset + MIN_OFFSET_INCREMENT, 1.0f);
						this.offsets[index] = nextOffset;
					}
					previousOffset = nextOffset;
				}

				// The above will likely smoosh multiple color offsets to 1.0 (the end), which is a collision.
				// From end to start, shift colliding colors 1 pixel down, stopping at first non-collision found.
				previousOffset = this.offsets[this.offsets.length - 1];
				for (int index = this.offsets.length - 2; index >= 0; index--) {
					float nextOffset = this.offsets[index];
					if ((previousOffset - nextOffset) >= MIN_OFFSET_INCREMENT) {
						break;
					}
					nextOffset = Math.max(previousOffset - MIN_OFFSET_INCREMENT, 0.0f);
					this.offsets[index] = nextOffset;
					previousOffset = nextOffset;
				}
			}
		}

		// Assign this drawable our custom gradient shader factory.
		setShaderFactory(new TiGradientDrawable.GradientShaderFactory());
	}

	public GradientType getGradientType()
	{
		return gradientType;
	}

	private void loadColors(Object[] colors)
	{
		// Use a transparent color if given a null/empty array.
		if ((colors == null) || (colors.length <= 0)) {
			this.colors = new int[] { Color.TRANSPARENT };
			this.offsets = null;
			return;
		}

		// Fetch the color values from the given array.
		this.colors = new int[colors.length];
		int offsetCount = 0;
		for (int i = 0; i < colors.length; i++) {
			Object color = colors[i];
			if (color instanceof HashMap) {
				// We were given a Titanium "GradientColorRef" dictionary. Fetch its color.
				@SuppressWarnings({ "rawtypes", "unchecked" })
				HashMap<String, Object> colorRefObject = (HashMap) color;
				this.colors[i] = TiConvert.toColor(colorRefObject, "color", TiApplication.getAppCurrentActivity());

				// Fetch the offset from the "GradientColorRef" dictionary.
				// Note: Make sure value does not exceed the 0.0 - 1.0 normalized range.
				//       Google's gradient feature mishandles value beyond this range.
				final String OFFSET_KEY = "offset";
				if ((colorRefObject != null) && colorRefObject.containsKey(OFFSET_KEY)) {
					if (this.offsets == null) {
						this.offsets = new float[colors.length];
					}
					float offset = TiConvert.toFloat(colorRefObject, OFFSET_KEY, -1);
					if (offset < 0.0f) {
						offset = 0.0f;
					} else if (offset > 1.0f) {
						offset = 1.0f;
					}
					this.offsets[offsetCount++] = offset;
				}
			} else {
				// Fetch the color value from the array.
				this.colors[i] = TiConvert.toColor(color.toString(), TiApplication.getAppCurrentActivity());
			}
		}

		// If the number of offsets doesn't match the number of colors,
		// just distribute the colors evenly along the gradient line.
		if (offsetCount != this.colors.length) {
			this.offsets = null;
		}
	}

	private class GradientShaderFactory extends ShaderFactory
	{
		@Override
		public Shader resize(int width, int height)
		{
			// Fetch the gradient's start/end points within the view, in pixels.
			float startX = startPoint.getX().getAsPixels(view);
			float startY = startPoint.getY().getAsPixels(view);
			float endX = endPoint.getX().getAsPixels(view);
			float endY = endPoint.getY().getAsPixels(view);

			// Create the shader with the given pixel width/height.
			Shader shader = null;
			switch (gradientType) {
				case LINEAR_GRADIENT: {
					shader = new LinearGradient(startX, startY, endX, endY, colors, offsets, TileMode.CLAMP);
					break;
				}
				case RADIAL_GRADIENT: {
					float endPixelRadius = (float) endRadius.getPixels(view);
					if ((endPixelRadius >= 1.0f) || isBackFillingEnd) {
						// Create a radial/circular gradient shader.
						// Note: RadialGradient will throw an exception if given a radius less than 1 pixel.
						//       In this case, bump it up to 1 pixel and back-fill with last color.
						endPixelRadius = Math.max(endPixelRadius, 1.0f);
						shader = new RadialGradient(startX, startY, endPixelRadius, colors, offsets, TileMode.CLAMP);
					} else {
						// Radius is too small and we're not back-filling. So, create a transparent shader.
						shader = new LinearGradient(0, 0, width, height, Color.TRANSPARENT, Color.TRANSPARENT,
													TileMode.CLAMP);
					}
					break;
				}
				default: {
					throw new AssertionError("No valid gradient type set.");
				}
			}
			return shader;
		}
	}

	public int[] getColors()
	{
		return colors;
	}
}
