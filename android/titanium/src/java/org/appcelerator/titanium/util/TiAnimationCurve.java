/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import android.view.animation.AccelerateDecelerateInterpolator;
import android.view.animation.AccelerateInterpolator;
import android.view.animation.DecelerateInterpolator;
import android.view.animation.Interpolator;
import android.view.animation.LinearInterpolator;

/**
 * Enum type indicating which animation easing/curve/interpolation type to use.
 * <p>
 * Provides methods to acquire its unique Titanium integer ID used in JavaScript
 * and to acquire the Android interpolator object used to animate with this type.
 */
public enum TiAnimationCurve {
	/** Animation type which starts slowly and then speeds up when reaching the end. */
	EASE_IN(new AccelerateInterpolator()),

	/** Animation type which starts slowly, speeds up in the middle, and then slows down at the end. */
	EASE_IN_OUT(new AccelerateDecelerateInterpolator()),

	/** Animation type which starts quickly and then slows down when reaching the end. */
	EASE_OUT(new DecelerateInterpolator()),

	/** Animation type which transitions at a constant rate. */
	LINEAR(new LinearInterpolator());

	/** JavaScript constant name defined by Titanium's UI module for this curve type. */
	private final String tiConstantName;

	/** The Android animation interpolator this curve type uses. */
	private final Interpolator interpolator;

	/**
	 * Creates a new animation curve type assigned the given Android interpolator.
	 * @param interpolator Object used to perform the easing operation during the animation.
	 */
	private TiAnimationCurve(Interpolator interpolator)
	{
		this.tiConstantName = "Ti.UI.ANIMATION_CURVE_" + this.name();
		this.interpolator = interpolator;
	}

	/**
	 * Gets an Android interpolator matching this object's animation curve/easing type.
	 * The returned interpolator can be applied to an Android "Animation" object.
	 * @return Returns an Android interpolator used to control the rate of the animation.
	 */
	public Interpolator toInterpolator()
	{
		return this.interpolator;
	}

	/**
	 * Gets the unique integer ID that Titanium uses to represent this animation curve type in JavaScript
	 * such as Ti.UI.ANIMATION_CURVE_LINEAR, Ti.UI.ANIMATION_CURVE_EASE_IN, etc.
	 * @return Returns the animation curve type's unique integer identifier.
	 */
	public int toTiIntId()
	{
		return this.ordinal();
	}

	/**
	 * Gets the JavaScript constant name used by Titanium's UI module for this animation curve type.
	 * Intended to be used by Titanium APIs to indicate which constants are valid/invalid.
	 * @return Returns the animation curve type's JavaScript constant name.
	 */
	public String toTiConstantName()
	{
		return this.tiConstantName;
	}

	/**
	 * Gets a human readable name identifying this animation curve type.
	 * @return Returns the animation curve type's name.
	 */
	@Override
	public String toString()
	{
		return this.tiConstantName;
	}

	/**
	 * Fetches an animation curve type matching the given unique Titanium integer ID.
	 * <p>
	 * This ID matches the value returned by TiAnimationCurve.toTiIntId().
	 * It also matches the animation curve IDs Titanium uses in JavaScript such as
	 * Ti.UI.ANIMATION_CURVE_LINEAR, Ti.UI.ANIMATION_CURVE_EASE_IN, etc.
	 * @param value The unique integer ID of the animation curve type to search for.
	 * @return Returns a matching curve type object. Returns null if given an invalid ID.
	 */
	public static TiAnimationCurve fromTiIntId(int value)
	{
		for (TiAnimationCurve nextObject : TiAnimationCurve.values()) {
			if ((nextObject != null) && (nextObject.ordinal() == value)) {
				return nextObject;
			}
		}
		return null;
	}
}
