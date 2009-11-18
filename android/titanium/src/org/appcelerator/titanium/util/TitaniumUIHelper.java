/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.util;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.appcelerator.titanium.config.TitaniumConfig;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.DialogInterface.OnClickListener;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.StateListDrawable;
import android.os.Process;
import android.util.TypedValue;
import android.widget.TextView;

public class TitaniumUIHelper
{
	private static final String LCAT = "TitaniumUIHelper";
	private static final boolean DBG = TitaniumConfig.LOGD;

	public static Pattern SIZED_VALUE = Pattern.compile("([0-9]*\\.?[0-9]+)\\W*(px|dp|dip|sp|sip|mm|pt|in)?");

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
		int units = TypedValue.COMPLEX_UNIT_SP;

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

	public static void styleText(TextView tv, String fontSize, String fontWeight) {
		Typeface tf = tv.getTypeface();
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
			String image,
			String selectedImage,
			String focusedImage)
	{
		StateListDrawable sld = null;

		if (image != null || selectedImage != null || focusedImage != null) {
			sld = new StateListDrawable();
			TitaniumFileHelper tfh = new TitaniumFileHelper(context);

			if (focusedImage == null) {
				focusedImage = selectedImage;
			}

			if (focusedImage != null) {
				Drawable d = tfh.loadDrawable(focusedImage, false, true);
				if (d != null) {
					int[] ss = {
						android.R.attr.state_focused,
						android.R.attr.state_window_focused,
						android.R.attr.state_enabled
					};
					sld.addState(ss, d);
				}
			}

			if (selectedImage != null) {
				Drawable d = tfh.loadDrawable(selectedImage, false, true);
				if (d != null) {
					int[] ss = { android.R.attr.state_pressed };
					sld.addState(ss, d);
					int[] ss1 = {
							android.R.attr.state_focused,
							android.R.attr.state_window_focused,
							android.R.attr.state_enabled,
							android.R.attr.state_pressed
					};
					sld.addState(ss1, d);
					int[] ss2 = { android.R.attr.state_selected };
					sld.addState(ss2, d);
				}
			}

			if (image != null) {
				Drawable d = tfh.loadDrawable(image, false, true);
				if (d != null) {
					int[] stateSet = { android.R.attr.state_enabled };
					sld.addState(stateSet, d);
				}
			}
		}

		return sld;
	}
}
