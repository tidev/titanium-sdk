/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.view;

import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;

import android.view.View;
import android.view.View.MeasureSpec;

/**
 * Holds a view's "minWidth", "maxWidth", "minHeight" and "maxHeight" constraints and applies them while measuring.
 * <p>
 * Shared by {@link TiCompositeLayout} and {@link TiBorderWrapperView} so that a view honors the constraints
 * regardless of whether it is wrapped in a border view. Dimensions are resolved to pixels at measure time,
 * which lets percentage values refer to the space the parent is offering.
 * <p>
 * When a minimum and maximum conflict the minimum wins, matching CSS and the iOS implementation.
 */
public class TiSizeConstraints
{
	private TiDimension minWidth;
	private TiDimension maxWidth;
	private TiDimension minHeight;
	private TiDimension maxHeight;

	/**
	 * Stores the constraint for the given property.
	 * @param key One of {@link TiC#PROPERTY_MIN_WIDTH}, {@link TiC#PROPERTY_MAX_WIDTH},
	 *            {@link TiC#PROPERTY_MIN_HEIGHT} or {@link TiC#PROPERTY_MAX_HEIGHT}.
	 * @param dimension The new dimension, or null to remove the constraint.
	 * @return true if the key was recognized.
	 */
	public boolean set(String key, TiDimension dimension)
	{
		switch (key) {
			case TiC.PROPERTY_MIN_WIDTH:
				this.minWidth = dimension;
				return true;
			case TiC.PROPERTY_MAX_WIDTH:
				this.maxWidth = dimension;
				return true;
			case TiC.PROPERTY_MIN_HEIGHT:
				this.minHeight = dimension;
				return true;
			case TiC.PROPERTY_MAX_HEIGHT:
				this.maxHeight = dimension;
				return true;
			default:
				return false;
		}
	}

	/** @return true if no constraint is set. */
	public boolean isEmpty()
	{
		return (this.minWidth == null) && (this.maxWidth == null) && (this.minHeight == null)
			&& (this.maxHeight == null);
	}

	/**
	 * Clamps the size offered by the parent's width spec so that children are measured against the
	 * constrained bounds and reflow instead of overflowing.
	 * @param view The view being measured. Used to resolve the dimensions to pixels.
	 * @param widthSpec The spec supplied by the parent.
	 * @return The clamped spec, or the given spec if no constraint applies.
	 */
	public int applyToWidthSpec(View view, int widthSpec)
	{
		return applyToSpec(widthSpec, resolve(this.minWidth, view, widthSpec), resolve(this.maxWidth, view, widthSpec));
	}

	/** Height counterpart of {@link #applyToWidthSpec(View, int)}. */
	public int applyToHeightSpec(View view, int heightSpec)
	{
		return applyToSpec(
			heightSpec, resolve(this.minHeight, view, heightSpec), resolve(this.maxHeight, view, heightSpec));
	}

	/**
	 * Clamps a measured width to the constraints.
	 * @param view The view being measured. Used to resolve the dimensions to pixels.
	 * @param widthSpec The spec supplied by the parent, before {@link #applyToWidthSpec(View, int)} was applied.
	 * @param width The measured width in pixels.
	 * @return The clamped width in pixels.
	 */
	public int clampWidth(View view, int widthSpec, int width)
	{
		return clamp(width, resolve(this.minWidth, view, widthSpec), resolve(this.maxWidth, view, widthSpec));
	}

	/** Height counterpart of {@link #clampWidth(View, int, int)}. */
	public int clampHeight(View view, int heightSpec, int height)
	{
		return clamp(height, resolve(this.minHeight, view, heightSpec), resolve(this.maxHeight, view, heightSpec));
	}

	private static int applyToSpec(int spec, int min, int max)
	{
		if ((min < 0) && (max < 0)) {
			return spec;
		}

		int mode = MeasureSpec.getMode(spec);
		if (mode == MeasureSpec.UNSPECIFIED) {
			// Unbounded, such as within a ScrollView. A maximum becomes the upper bound.
			// A minimum is enforced after measuring via clamp().
			return (max >= 0) ? MeasureSpec.makeMeasureSpec(max, MeasureSpec.AT_MOST) : spec;
		}

		int size = MeasureSpec.getSize(spec);
		int clampedSize = clamp(size, min, max);
		return (clampedSize == size) ? spec : MeasureSpec.makeMeasureSpec(clampedSize, mode);
	}

	private static int clamp(int value, int min, int max)
	{
		if ((max >= 0) && (value > max)) {
			value = max;
		}
		if ((min >= 0) && (value < min)) {
			value = min;
		}
		return value;
	}

	/**
	 * Resolves the given dimension to pixels.
	 * @param dimension The dimension to resolve. Can be null.
	 * @param view The view being measured.
	 * @param spec The spec the parent supplied for this axis. Percentages are relative to its size.
	 * @return The size in pixels, or -1 if the dimension is null or cannot be resolved.
	 */
	private static int resolve(TiDimension dimension, View view, int spec)
	{
		if (dimension == null) {
			return -1;
		}
		if (dimension.isUnitPercent()) {
			if (MeasureSpec.getMode(spec) == MeasureSpec.UNSPECIFIED) {
				return -1;
			}
			return (int) Math.round((dimension.getValue() / 100.0) * MeasureSpec.getSize(spec));
		}
		int pixels = dimension.getAsPixels(view);
		return (pixels < 0) ? -1 : pixels;
	}
}
