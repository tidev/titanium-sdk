/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.view;

import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.TiPoint;
import org.appcelerator.titanium.util.TiConvert;

import android.graphics.LinearGradient;
import android.graphics.Shader;
import android.graphics.Shader.TileMode;
import android.graphics.drawable.ShapeDrawable;
import android.graphics.drawable.shapes.RectShape;
import android.view.View;

public class TiGradientDrawable extends ShapeDrawable {
	public enum GradientType {
		LINEAR_GRADIENT, RADIAL_GRADIENT
	}

	private static final TiPoint DEFAULT_START_POINT = new TiPoint(0, 0);
	private static final TiPoint DEFAULT_END_POINT = new TiPoint(0, 1);
	private static final TiDimension DEFAULT_RADIUS = new TiDimension(1.0, TiDimension.TYPE_UNDEFINED);
	private static final String LCAT = "TiGradientDrawable";

	private GradientType gradientType;
	private TiPoint startPoint = DEFAULT_START_POINT, endPoint = DEFAULT_END_POINT;
	private TiDimension startRadius;
	private int[] colors;
	private float[] offsets;
	private View view;

	public TiGradientDrawable(View view, KrollDict properties) {
		super(new RectShape());

		// Determine which type of gradient is being used.
		// Supported types are 'linear' and 'radial'.
		String type = properties.optString("type", "linear");
		if (type.equals("linear")) {
			gradientType = GradientType.LINEAR_GRADIENT;
		} else if (type.equals("radial")) {
			gradientType = GradientType.RADIAL_GRADIENT;

			// TODO: Add support for radial gradients.
			// Android's RadialGradient only supports a single circle.
			// We need to figure out how to support two circle gradients
			// as specified by the HTML Canvas specification.
			return;

		} else {
			throw new IllegalArgumentException("Invalid gradient type. Must be linear or radial.");
		}

		// Load the 'startPoint' property which defines the start of the gradient.
		Object startPointObject = properties.get("startPoint");
		if (startPointObject instanceof HashMap) {
			startPoint = new TiPoint((HashMap)startPointObject, 0, 0);
		}

		// Load the 'endPoint' property which defines the end of the gradient.
		// Note: this is only used for linear gradient since Android does not
		// support an ending circle for radial gradients.
		Object endPointObject = properties.get("endPoint");
		if (endPointObject instanceof HashMap) {
			endPoint = new TiPoint((HashMap)endPointObject, 0, 1);
		}

		startRadius = TiConvert.toTiDimension(properties, "startRadius", TiDimension.TYPE_UNDEFINED);
		if (startRadius == null) {
			startRadius = DEFAULT_RADIUS;
		}

		Object colors = properties.get("colors");
		if (!(colors instanceof Object[])) {
			Log.w(LCAT, "Android does not support gradients without colors.");
			throw new IllegalArgumentException("Must provide an array of colors.");
		}
		loadColors((Object[])colors);

		this.view = view;

		setShaderFactory(new GradientShaderFactory());
	}

	public GradientType getGradientType() {
		return gradientType;
	}

	private void loadColors(Object[] colors) {
		this.colors = new int[colors.length];
		int offsetCount = 0;
		for (int i = 0; i < colors.length; i++) {
			Object color = colors[i];
			if (color instanceof HashMap) {
				HashMap<String, Object> colorRefObject = (HashMap)color;
				this.colors[i] = TiConvert.toColor(colorRefObject, "color");

				if (offsets == null) {
					offsets = new float[colors.length];
				}

				float offset = TiConvert.toFloat(colorRefObject, "offset", -1);
				if (offset >= 0.0f && offset <= 1.0f) {
					offsets[offsetCount++] = offset;
				}

			} else {
				this.colors[i] = TiConvert.toColor(color.toString());
			}
		}

		// If the number of offsets doesn't match the number of colors,
		// just distribute the colors evenly along the gradient line.
		if (offsetCount != this.colors.length) {
			offsets = null;
		}
	}

	private class GradientShaderFactory extends ShaderFactory {
		@Override
		public Shader resize(int width, int height) {
			float x0 = startPoint.getX().getAsPixels(view);
			float y0 = startPoint.getY().getAsPixels(view);
			float x1 = endPoint.getX().getAsPixels(view);
			float y1 = endPoint.getY().getAsPixels(view);

			switch (gradientType) {
			case LINEAR_GRADIENT:
				return new LinearGradient(x0, y0, x1, y1, colors, offsets, TileMode.CLAMP);
			case RADIAL_GRADIENT:
				// TODO: implement radial gradient
				return null;
			default:
				throw new AssertionError("No valid gradient type set.");
			}
		}
	}
}
