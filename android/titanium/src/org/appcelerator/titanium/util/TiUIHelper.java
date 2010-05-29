/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.util;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.DialogInterface.OnClickListener;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Rect;
import android.graphics.Typeface;
import android.graphics.Bitmap.CompressFormat;
import android.graphics.Bitmap.Config;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.StateListDrawable;
import android.os.Process;
import android.util.DisplayMetrics;
import android.util.TypedValue;
import android.view.View;
import android.view.Window;
import android.widget.TextView;

public class TiUIHelper
{
	private static final String LCAT = "TitaniumUIHelper";
	private static final boolean DBG = TiConfig.LOGD;

	public static final Pattern SIZED_VALUE = Pattern.compile("([0-9]*\\.?[0-9]+)\\W*(px|dp|dip|sp|sip|mm|pt|in)?");

	public static OnClickListener createDoNothingListener() {
		return new OnClickListener() {
			public void onClick(DialogInterface dialog, int which) {
				// Do nothing
			}
		};
	}

	public static OnClickListener createKillListener() {
		return new OnClickListener() {
			public void onClick(DialogInterface dialog, int which) {
				Process.killProcess(Process.myPid());
			}
		};
	}

	public static OnClickListener createFinishListener(final Activity me) {
		return new OnClickListener(){
			public void onClick(DialogInterface dialog, int which) {
				me.finish();
			}
		};
	}

	public static void doKillOrContinueDialog(Context context, String title, String message, OnClickListener positiveListener, OnClickListener negativeListener) {
		if (positiveListener == null) {
			positiveListener = createDoNothingListener();
		}
		if (negativeListener == null) {
			negativeListener = createKillListener();
		}
        new AlertDialog.Builder(context)
        .setTitle(title)
        .setMessage(message)
        .setPositiveButton("Continue",positiveListener)
        .setNegativeButton("Kill", negativeListener)
        .setCancelable(false)
        .create()
        .show();
	}

	public static void doOkDialog(Context context, String title, String message, OnClickListener listener) {
		if (listener == null) {
			listener = new OnClickListener() {

				public void onClick(DialogInterface dialog, int which) {
					// Do nothing.
				}};
		}
        new AlertDialog.Builder(context)
        .setTitle(title)
        .setMessage(message)
        .setPositiveButton(android.R.string.ok,listener)
        .setCancelable(false)
        .create()
        .show();
	}

	public static int toTypefaceStyle(String fontWeight) {
		int style = Typeface.NORMAL;
		if (fontWeight != null) {
			if(fontWeight.equals("bold")) {
				style = Typeface.BOLD;
			}
		}
		return style;
	}

	public static int getSizeUnits(String size) {
		//int units = TypedValue.COMPLEX_UNIT_SP;
		int units = TypedValue.COMPLEX_UNIT_PX;

		if (size != null) {
			Matcher m = SIZED_VALUE.matcher(size.trim());
			if (m.matches()) {
				if (m.groupCount() == 2) {
					String unit = m.group(2);
					if ("px".equals(unit)) {
						units = TypedValue.COMPLEX_UNIT_PX;
					} else if ("pt".equals(unit)) {
						units = TypedValue.COMPLEX_UNIT_PT;
					} else if ("dp".equals(unit) || "dip".equals(unit)) {
						units = TypedValue.COMPLEX_UNIT_DIP;
					} else if ("sp".equals(unit) || "sip".equals(unit)) {
						units = TypedValue.COMPLEX_UNIT_SP;
					} else if ("pt".equals(unit)) {
						units = TypedValue.COMPLEX_UNIT_PT;
					} else if ("mm".equals(unit)) {
						units = TypedValue.COMPLEX_UNIT_MM;
					} else if ("in".equals(unit)) {
						units = TypedValue.COMPLEX_UNIT_IN;
					} else {
						if (DBG) {
							if (unit != null) {
								Log.w(LCAT, "Unknown unit: " + unit);
							}
						}
						//units = TypedValue.COMPLEX_UNIT_PX;
					}
				}
			}
		}

		return units;
	}

	public static float getSize(String size) {
		float value = 15.0f;
		if (size != null) {
			Matcher m = SIZED_VALUE.matcher(size.trim());
			if (m.matches()) {
				value = Float.parseFloat(m.group(1));
			}
		}

		return value;
	}

	public static void styleText(TextView tv, TiDict d) {
		String fontSize = null;
		String fontWeight = null;
		String fontFamily = null;

		if (d.containsKey("fontSize")) {
			fontSize = TiConvert.toString(d, "fontSize");
		}
		if (d.containsKey("fontWeight")) {
			fontWeight = TiConvert.toString(d, "fontWeight");
		}
		if (d.containsKey("fontFamily")) {
			fontFamily = TiConvert.toString(d, "fontFamily");
		}
		TiUIHelper.styleText(tv, fontFamily, fontSize, fontWeight);
	}

	public static void styleText(TextView tv, String fontFamily, String fontSize, String fontWeight) {
		Typeface tf = tv.getTypeface();
		tf = Typeface.SANS_SERIF; // default

		if (fontFamily != null) {
			if ("monospace".equals(fontFamily)) {
				tf = Typeface.MONOSPACE;
			} else if ("serif".equals(fontFamily)) {
				tf = Typeface.SERIF;
			} else if ("sans-serif".equals(fontFamily)) {
				tf = Typeface.SANS_SERIF;
			} else {
				if (DBG) {
					Log.w(LCAT, "Unsupported font: '" + fontFamily + "' supported fonts are 'monospace', 'serif', 'sans-serif'.");
				}
			}
		}
		tv.setTypeface(tf, toTypefaceStyle(fontWeight));
		tv.setTextSize(getSizeUnits(fontSize), getSize(fontSize));
	}

	public static String getDefaultFontSize(Context context) {
		String size = "15.0px";
		TextView tv = new TextView(context);
		if (tv != null) {
			size = String.valueOf(tv.getTextSize()) + "px";
			tv = null;
		}

		return size;
	}

	public static String getDefaultFontWeight(Context context) {
		String style = "normal";
		TextView tv = new TextView(context);
		if (tv != null) {
			Typeface tf = tv.getTypeface();
			if (tf != null && tf.isBold()) {
				style = "bold";
			}
		}

		return style;
	}

	public static StateListDrawable buildBackgroundDrawable(Context context,
			String color,
			String selectedColor,
			String image,
			String selectedImage,
			String focusedImage)
	{
		StateListDrawable sld = null;

		Drawable bgDrawable = null;
		Drawable bgSelectedDrawable = null;
		Drawable bgFocusedDrawable = null;

		TiFileHelper tfh = new TiFileHelper(context);

		if (image != null) {
			bgDrawable = tfh.loadDrawable(image, false, true);
		} else if (color != null) {
			Bitmap b = Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888);
			int c = TiConvert.toColor(color);
			b.eraseColor(c);
			bgDrawable = new BitmapDrawable(b);
		}

		if (selectedImage != null) {
			bgSelectedDrawable = tfh.loadDrawable(selectedImage, false, true);
		} else if (selectedColor != null) {
			Bitmap b = Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888);
			int c = TiConvert.toColor(selectedColor);
			b.eraseColor(c);
			bgSelectedDrawable = new BitmapDrawable(b);
		}

		if (focusedImage != null) {
			bgFocusedDrawable = tfh.loadDrawable(focusedImage, false, true);
		} else {
			if (selectedImage != null) {
				bgFocusedDrawable = tfh.loadDrawable(selectedImage, false, true);
			} else if (selectedColor != null) {
				Bitmap b = Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888);
				int c = TiConvert.toColor(selectedColor);
				b.eraseColor(c);
				bgFocusedDrawable = new BitmapDrawable(b);
			}
		}

		if (bgDrawable != null || bgSelectedDrawable != null || bgFocusedDrawable != null) {
			sld = new StateListDrawable();

			if (bgFocusedDrawable != null) {
				int[] ss = {
					android.R.attr.state_focused,
					android.R.attr.state_window_focused,
					android.R.attr.state_enabled
				};
				sld.addState(ss, bgFocusedDrawable);
			}

			if (bgSelectedDrawable != null) {
				int[] ss = { android.R.attr.state_pressed };
				sld.addState(ss, bgSelectedDrawable);
				int[] ss1 = {
						android.R.attr.state_focused,
						android.R.attr.state_window_focused,
						android.R.attr.state_enabled,
						android.R.attr.state_pressed
				};
				sld.addState(ss1, bgSelectedDrawable);
				int[] ss2 = { android.R.attr.state_selected };
				sld.addState(ss2, bgSelectedDrawable);
			}

			if (bgDrawable != null) {
				int[] stateSet = { android.R.attr.state_enabled };
				sld.addState(stateSet, bgDrawable);
			}
		}

		return sld;
	}

	public static TiDict createDictForImage(TiContext context, int width, int height, byte[] data)
	{
		TiDict d = new TiDict();
		d.put("x", 0);
		d.put("y", 0);
		d.put("width", width);
		d.put("height", height);

		TiDict cropRect = new TiDict();
		cropRect.put("x", 0);
		cropRect.put("y", 0);
		cropRect.put("width", width);
		cropRect.put("height", height);
		d.put("cropRect", cropRect);
		d.put("media", TiBlob.blobFromData(context, data, "image/png"));

		return d;
	}

	public static TiBlob getImageFromDict(TiDict dict)
	{
		if (dict != null) {
			if (dict.containsKey("media")) {
				Object media = dict.get("media");
				if (media instanceof TiBlob) {
					return (TiBlob) media;
				}
			}
		}
		return null;
	}

	public static TiDict viewToImage(TiContext context, View view)
	{
		Activity a = null;
		TiDict image = new TiDict();

		if (view != null) {
			int width = view.getWidth();
			int height = view.getHeight();
			Bitmap bitmap = Bitmap.createBitmap(width, height, Config.RGB_565);
			Canvas canvas = new Canvas(bitmap);

			view.draw(canvas);

			ByteArrayOutputStream bos = new ByteArrayOutputStream();
			if (bitmap.compress(CompressFormat.PNG, 100, bos)) {
				image = createDictForImage(context, width, height, bos.toByteArray());
			}

			canvas = null;
			bitmap.recycle();
		}

		return image;
	}

	public static Bitmap createBitmap(InputStream stream)
	{
		Rect pad = new Rect();
		BitmapFactory.Options opts = new BitmapFactory.Options();
		opts.inScreenDensity = DisplayMetrics.DENSITY_HIGH;
		Bitmap b = null;
		try {
			b = BitmapFactory.decodeResourceStream(null, null, stream, pad, opts);
		} catch (OutOfMemoryError e) {
			Log.e(LCAT, "Unable to load bitmap. Not enough memory: " + e.getMessage());
		}
		return b;
	}
}
