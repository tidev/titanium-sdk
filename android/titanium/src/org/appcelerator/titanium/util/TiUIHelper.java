/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.util;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.commons.codec.digest.DigestUtils;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.DialogInterface.OnClickListener;
import android.graphics.Bitmap;
import android.graphics.Bitmap.CompressFormat;
import android.graphics.Bitmap.Config;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.ColorFilter;
import android.graphics.ColorMatrix;
import android.graphics.ColorMatrixColorFilter;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.Typeface;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.StateListDrawable;
import android.os.Build;
import android.os.Process;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.TextView;

public class TiUIHelper
{
	private static final String LCAT = "TiUIHelper";
	private static final boolean DBG = TiConfig.LOGD;

	public static final Pattern SIZED_VALUE = Pattern.compile("([0-9]*\\.?[0-9]+)\\W*(px|dp|dip|sp|sip|mm|pt|in)?");

	private static Method overridePendingTransition;
	private static Map<String, String> raImageKeys = Collections.synchronizedMap(new HashMap<String, String>());
	
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
		
		new AlertDialog.Builder(context).setTitle(title).setMessage(message)
			.setPositiveButton("Continue", positiveListener)
			.setNegativeButton("Kill", negativeListener)
			.setCancelable(false).create().show();
	}

	public static void doOkDialog(Context context, String title, String message, OnClickListener listener) {
		if (listener == null) {
			listener = new OnClickListener() {

				public void onClick(DialogInterface dialog, int which) {
					// Do nothing.
				}};
		}
		
		new AlertDialog.Builder(context).setTitle(title).setMessage(message)
			.setPositiveButton(android.R.string.ok, listener)
			.setCancelable(false).create().show();
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

	public static void styleText(TextView tv, KrollDict d) {
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

	public static void setAlignment(TextView tv, String textAlign, String verticalAlign) 
	{
		int gravity = Gravity.NO_GRAVITY;
		
		if (textAlign != null) {
			if ("left".equals(textAlign)) {
				 gravity |= Gravity.LEFT;
			} else if ("center".equals(textAlign)) {
				gravity |=  Gravity.CENTER_HORIZONTAL;
			} else if ("right".equals(textAlign)) {
				gravity |=  Gravity.RIGHT;
			} else {
				Log.w(LCAT, "Unsupported horizontal alignment: " + textAlign);
			}
		} else {
			// Nothing has been set - let's set if something was set previously
			// You can do this with shortcut syntax - but long term maint of code is easier if it's explicit
			if (DBG) {
				Log.w(LCAT, "No alignment set - old horiz align was: " + (tv.getGravity() & Gravity.HORIZONTAL_GRAVITY_MASK));
			}
			
			if ((tv.getGravity() & Gravity.HORIZONTAL_GRAVITY_MASK) != Gravity.NO_GRAVITY) {
				// Something was set before - so let's use it
				gravity |= tv.getGravity() & Gravity.HORIZONTAL_GRAVITY_MASK;
			}
		}
		
		if (verticalAlign != null) {
			if ("top".equals(verticalAlign)) {
				gravity |= Gravity.TOP;
			} else if ("middle".equals(verticalAlign)) {
				gravity |= Gravity.CENTER_VERTICAL;			
			} else if ("bottom".equals(verticalAlign)) {
				gravity |= Gravity.BOTTOM;			
			} else {
				Log.w(LCAT, "Unsupported vertical alignment: " + verticalAlign);			
			}
		} else {
			// Nothing has been set - let's set if something was set previously
			// You can do this with shortcut syntax - but long term maint of code is easier if it's explicit
			if (DBG) {
				Log.w(LCAT, "No alignment set - old vert align was: " + (tv.getGravity() & Gravity.VERTICAL_GRAVITY_MASK));
			}
			if ((tv.getGravity() & Gravity.VERTICAL_GRAVITY_MASK) != Gravity.NO_GRAVITY) {
				// Something was set before - so let's use it
				gravity |= tv.getGravity() & Gravity.VERTICAL_GRAVITY_MASK;
			}			
		}
		
		tv.setGravity(gravity);
	}


	public static StateListDrawable buildBackgroundDrawable(TiContext tiContext,
			String image,
			String color,
			String selectedImage,
			String selectedColor,
			String disabledImage,
			String disabledColor,
			String focusedImage,
			String focusedColor)
	{
		StateListDrawable sld = null;

		Drawable bgDrawable = null;
		Drawable bgSelectedDrawable = null;
		Drawable bgFocusedDrawable = null;
		Drawable bgDisabledDrawable = null;
		
		Context appContext = tiContext.getActivity().getApplicationContext();

		TiFileHelper tfh = new TiFileHelper(appContext);

		if (image != null) {
			bgDrawable = tfh.loadDrawable(tiContext, image, false, true);
		} else if (color != null) {
			bgDrawable = new ColorDrawable(TiConvert.toColor(color));
		}

		if (selectedImage != null) {
			bgSelectedDrawable = tfh.loadDrawable(tiContext, selectedImage, false, true);
		} else if (selectedColor != null) {
			bgSelectedDrawable = new ColorDrawable(TiConvert.toColor(selectedColor));
		} else {
			if (image != null) {
				bgSelectedDrawable = tfh.loadDrawable(tiContext, image, false, true);
			} else if (color != null) {
				bgSelectedDrawable = new ColorDrawable(TiConvert.toColor(color));				
			}			
		}

		if (focusedImage != null) {
			bgFocusedDrawable = tfh.loadDrawable(tiContext, focusedImage, false, true);
		} else if (focusedColor != null) {
			bgFocusedDrawable = new ColorDrawable(TiConvert.toColor(focusedColor));
		} else {
			if (image != null) {
				bgFocusedDrawable = tfh.loadDrawable(tiContext, image, false, true);
			} else if (color != null) {
				bgFocusedDrawable = new ColorDrawable(TiConvert.toColor(color));				
			}
		}

		if (disabledImage != null) {
			bgDisabledDrawable = tfh.loadDrawable(tiContext, disabledImage, false, true);
		} else if (disabledColor != null) {
			bgDisabledDrawable = new ColorDrawable(TiConvert.toColor(disabledColor));
		} else {
			if (image != null) {
				bgDisabledDrawable = tfh.loadDrawable(tiContext, image, false, true);
			} else if (color != null) {
				bgDisabledDrawable = new ColorDrawable(TiConvert.toColor(color));				
			}
		}

		if (bgDrawable != null || bgSelectedDrawable != null || bgFocusedDrawable != null || bgDisabledDrawable != null) {
			sld = new StateListDrawable();

			if (bgDisabledDrawable != null) {
				int[] stateSet = {
					-android.R.attr.state_enabled
				};
				sld.addState(stateSet, bgDisabledDrawable);
			}

			if (bgFocusedDrawable != null) {
				int[] ss = {
					android.R.attr.state_focused,
					android.R.attr.state_window_focused,
					android.R.attr.state_enabled
				};
				sld.addState(ss, bgFocusedDrawable);
			}

			if (bgSelectedDrawable != null) {
				int[] ss = {
						android.R.attr.state_window_focused,
						android.R.attr.state_enabled,
						android.R.attr.state_pressed
					};
				sld.addState(ss, bgSelectedDrawable);


				int[] ss1 = {
					android.R.attr.state_focused,
					android.R.attr.state_window_focused,
					android.R.attr.state_enabled,
					android.R.attr.state_pressed
				};
				sld.addState(ss1, bgSelectedDrawable);
				
//				int[] ss2 = { android.R.attr.state_selected };
//				sld.addState(ss2, bgSelectedDrawable);
			}

			if (bgDrawable != null) {
				int[] ss1 = {
					android.R.attr.state_window_focused,
					android.R.attr.state_enabled
				};
				sld.addState(ss1, bgDrawable);
				int[] ss2 = { android.R.attr.state_enabled };
				sld.addState(ss2, bgDrawable);
			}
		}

		return sld;
	}

	public static KrollDict createDictForImage(TiContext context, int width, int height, byte[] data)
	{
		KrollDict d = new KrollDict();
		d.put("x", 0);
		d.put("y", 0);
		d.put("width", width);
		d.put("height", height);

		KrollDict cropRect = new KrollDict();
		cropRect.put("x", 0);
		cropRect.put("y", 0);
		cropRect.put("width", width);
		cropRect.put("height", height);
		d.put("cropRect", cropRect);
		d.put("media", TiBlob.blobFromData(context, data, "image/png"));

		return d;
	}

	public static TiBlob getImageFromDict(KrollDict dict)
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

	public static KrollDict viewToImage(TiContext context, View view)
	{
		KrollDict image = new KrollDict();

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
		opts.inPurgeable = true;
		opts.inInputShareable = true;

		Bitmap b = null;
		try {
			b = BitmapFactory.decodeResourceStream(null, null, stream, pad, opts);
		} catch (OutOfMemoryError e) {
			Log.e(LCAT, "Unable to load bitmap. Not enough memory: " + e.getMessage());
		}
		return b;
	}
	
	private static String getRAKeyForImage(String url)
	{
		if (raImageKeys.containsKey(url)) {
			return raImageKeys.get(url);
		}
		
		Pattern pattern = Pattern.compile("^.*/Resources/images/(.*$)");
		Matcher matcher = pattern.matcher(url);
		if (!matcher.matches()) {
			return null;
		}
		
		String chopped = matcher.group(1);
		if (chopped == null) {
			return null;
		}
		
		chopped = chopped.toLowerCase();
		String forHash = chopped;
		if (forHash.endsWith(".9.png")) {
			forHash = forHash.replace(".9.png", ".png");
		}
		String withoutExtension = chopped;
		
		if (chopped.matches("^.*\\..*$")) {
			if (chopped.endsWith(".9.png")) {
				withoutExtension = chopped.substring(0, chopped.lastIndexOf(".9.png"));
			} else {
				withoutExtension = chopped.substring(0, chopped.lastIndexOf('.'));
			}
		}
		
		String cleanedWithoutExtension = withoutExtension.replaceAll("[^a-z0-9_]", "_");
		StringBuilder result = new StringBuilder(100);
		result.append(cleanedWithoutExtension.substring(0, Math.min(cleanedWithoutExtension.length(), 80))) ;
		result.append("_");
		result.append(DigestUtils.md5Hex(forHash).substring(0, 10));
		String sResult = result.toString();
		raImageKeys.put(url, sResult);
		return sResult;
	}
	
	public static int getResourceId(TiContext context, String url)
	{
		if (!url.contains("Resources/images/")) {
			return 0;
		}
		
		String key = getRAKeyForImage(url);
		if (key == null) {
			return 0;
		}
		
		return TiResourceHelper.getDrawable(key);
	}

	public static Bitmap getResourceBitmap(TiContext context, String url)
	{
		int id = getResourceId(context, url);
		if (id == 0) {
			return null;
		}
		
		Bitmap bitmap = BitmapFactory.decodeResource(context.getActivity().getResources(), id);
		return bitmap;
	}
	
	public static Drawable getResourceDrawable(TiContext context, String url)
	{
		int id = getResourceId(context, url);
		if (id == 0) {
			return null;
		}
		
		return context.getActivity().getResources().getDrawable(id);
	}
	
	
	public static void overridePendingTransition(Activity activity) 
	{
		if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.DONUT) {
			return;
		}
		
		if (overridePendingTransition == null) {
			try {
				overridePendingTransition = Activity.class.getMethod("overridePendingTransition", Integer.TYPE, Integer.TYPE);
			} catch (NoSuchMethodException e) {
				Log.w(LCAT, "Activity.overridePendingTransition() not found");
			}
			
		}
		
		if (overridePendingTransition != null) {
			try {
				overridePendingTransition.invoke(activity, new Object[]{0,0});
			} catch (InvocationTargetException e) {
				Log.e(LCAT, "Called incorrectly: " + e.getMessage());
			} catch (IllegalAccessException e) {
				Log.e(LCAT, "Illegal access: " + e.getMessage());
			}
		}
	}
	
	public static ColorFilter createColorFilterForOpacity(float opacity) {
		// 5x4 identity color matrix + fade the alpha to achieve opacity
		float[] matrix = {
			1, 0, 0, 0, 0,
			0, 1, 0, 0, 0,
			0, 0, 1, 0, 0,
			0, 0, 0, opacity, 0
		};
		
		return new ColorMatrixColorFilter(new ColorMatrix(matrix));
	}
	
	public static void setDrawableOpacity(Drawable drawable, float opacity) {
		if (drawable instanceof ColorDrawable) {
			ColorDrawable colorDrawable = (ColorDrawable) drawable;
			colorDrawable.setAlpha(Math.round(opacity * 255));
		} else if (drawable != null) {
			drawable.setColorFilter(createColorFilterForOpacity(opacity));
		}
	}
	
	public static void setPaintOpacity(Paint paint, float opacity) {
		paint.setColorFilter(createColorFilterForOpacity(opacity));
	}

	public static void requestSoftInputChange(KrollProxy proxy, View view) 
	{
		int focusState = TiUIView.SOFT_KEYBOARD_DEFAULT_ON_FOCUS;
		
		if (proxy.hasProperty("softKeyboardOnFocus")) {
			focusState = TiConvert.toInt(proxy.getProperty("softKeyboardOnFocus"));
		}

		if (focusState > TiUIView.SOFT_KEYBOARD_DEFAULT_ON_FOCUS) {
			InputMethodManager imm = (InputMethodManager) view.getContext().getSystemService(Activity.INPUT_METHOD_SERVICE);
			if (imm != null) {
				boolean useForce = (Build.VERSION.SDK_INT <= Build.VERSION_CODES.DONUT || Build.VERSION.SDK_INT >= 8) ? true : false;
				String model = TiPlatformHelper.getModel(); 
				if (model != null && model.toLowerCase().startsWith("droid")) {
					useForce = true;
				}
				if (DBG) {
					Log.i(LCAT, "soft input change request: flag: " + focusState + " useForce: " + useForce);
				}
				if (focusState == TiUIView.SOFT_KEYBOARD_SHOW_ON_FOCUS) {
					imm.showSoftInput(view, useForce ? InputMethodManager.SHOW_FORCED : InputMethodManager.SHOW_IMPLICIT);
				} else if (focusState == TiUIView.SOFT_KEYBOARD_HIDE_ON_FOCUS) {
					imm.hideSoftInputFromWindow(view.getWindowToken(), useForce ? 0 : InputMethodManager.HIDE_IMPLICIT_ONLY);
				} else {
					Log.w(LCAT, "Unknown onFocus state: " + focusState);
				}
			}
		}
	}
}
