/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.TimeZone;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.view.Ti2DMatrix;
import org.appcelerator.titanium.view.TiCompositeLayout.LayoutParams;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.graphics.drawable.ColorDrawable;
import android.net.Uri;

/**
 * Utility class for type conversions.
 */
public class TiConvert
{
	private static final String TAG = "TiConvert";

	public static final String ASSET_URL = "file:///android_asset/"; // class scope on URLUtil
	public static final String JSON_DATE_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'";


	// Bundle 
	public static Object putInKrollDict(KrollDict d, String key, Object value)
	{
		if (value instanceof String || value instanceof Number || value instanceof Boolean || value instanceof Date) {
			d.put(key, value);

		} else if (value instanceof KrollDict) {
			KrollDict nd = new KrollDict();
			KrollDict dict = (KrollDict) value;
			for (String k : dict.keySet()) {
				putInKrollDict(nd, k, dict.get(k));
			}
			d.put(key, nd);
			value = nd;

		} else if (value instanceof Object[]) {
			Object[] a = (Object[]) value;
			int len = a.length;
			if (len > 0) {
				Object v = a[0];
				if (v != null) {
					Log.w(TAG, "Array member is type: " + v.getClass().getSimpleName(), Log.DEBUG_MODE);

				} else {
					Log.w(TAG, "First member of array is null", Log.DEBUG_MODE);
				}

				if (v != null && v instanceof String) {
					String[] sa = new String[len];
					for(int i = 0; i < len; i++) {
						sa[i] = (String) a[i];
					}
					d.put(key, sa);

				} else if (v != null && v instanceof Double) {
					double[] da = new double[len];
					for(int i = 0; i < len; i++) {
						da[i] = (Double) a[i];
					}
					d.put(key, da);

				} /*else if (v != null && v instanceof KrollObject) {
					KrollProxy[] pa = new KrollProxy[len];
					for(int i = 0; i < len; i++) {
						KrollObject ko = (KrollObject) a[i];
						pa[i] = (KrollProxy) ko.getProxy();
					}
					d.put(key, pa);

				} */else {

					Object[] oa = new Object[len];
					for(int i = 0; i < len; i++) {
						oa[i] = a[i];
					}
					d.put(key, oa);
					//throw new IllegalArgumentException("Unsupported array property type " + v.getClass().getSimpleName());
				}

			} else {
				d.put(key, (Object[]) value);
			}

		} else if (value == null) {
			d.put(key, null);

		} else if (value instanceof KrollProxy) {
			d.put(key, value);

		} else if (value instanceof Map) {
			KrollDict dict = new KrollDict();
			Map<?,?> map = (Map<?,?>)value;
			Iterator<?> iter = map.keySet().iterator();
			while(iter.hasNext())
			{
				String k = (String)iter.next();
				putInKrollDict(dict,k,map.get(k));
			}
			d.put(key,dict);

		} else {
			throw new IllegalArgumentException("Unsupported property type " + value.getClass().getName());
		}

		return value;
	}

	/**
	 * This is a wrapper method. 
	 * Refer to {@link TiColorHelper#parseColor(String)} for more details.
	 * @param value  color value to convert.
	 * @return an int representation of the color.
	 * @module.api
	 */
	public static int toColor(String value)
	{
		return TiColorHelper.parseColor(value);
	}

	/**
	 * This is a wrapper method. 
	 * Refer to {@link TiColorHelper#parseColor(String)} for more details.
	 * @param hashMap the HashMap contains the String representation of the color.
	 * @param key the color lookup key.
	 * @return an int representation of the color.
	 * @module.api
	 */
	public static int toColor(HashMap<String, Object> hashMap, String key)
	{
		return toColor(TiConvert.toString(hashMap.get(key)));
	}

	public static ColorDrawable toColorDrawable(String value)
	{
		return new ColorDrawable(toColor(value));
	}

	public static ColorDrawable toColorDrawable(HashMap<String, Object> hashMap, String key)
	{
		return toColorDrawable(TiConvert.toString(hashMap.get(key)));
	}

	// Layout
	public static boolean fillLayout(HashMap<String, Object> hashMap, LayoutParams layoutParams)
	{
		boolean dirty = false;
		Object width = null;
		Object height = null;

		// Don't use fill or size by default to trigger the undefined behavior. When we have undefined behavior, we try
		// to calculate the height/width from the pins if possible.
		layoutParams.sizeOrFillWidthEnabled = false;
		layoutParams.sizeOrFillHeightEnabled = false;

		if (hashMap.containsKey(TiC.PROPERTY_SIZE)) {
			HashMap<String, Object> size = (HashMap<String, Object>) hashMap.get(TiC.PROPERTY_SIZE);
			width = size.get(TiC.PROPERTY_WIDTH);
			height = size.get(TiC.PROPERTY_HEIGHT);
		}

		if (hashMap.containsKey(TiC.PROPERTY_LEFT)) {
			layoutParams.optionLeft = toTiDimension(hashMap, TiC.PROPERTY_LEFT, TiDimension.TYPE_LEFT);
			dirty = true;
		}

		if (hashMap.containsKey(TiC.PROPERTY_TOP)) {
			layoutParams.optionTop = toTiDimension(hashMap, TiC.PROPERTY_TOP, TiDimension.TYPE_TOP);
			dirty = true;
		}

		if (hashMap.containsKey(TiC.PROPERTY_CENTER)) {
			updateLayoutCenter(hashMap.get(TiC.PROPERTY_CENTER), layoutParams);
			dirty = true;
		}

		if (hashMap.containsKey(TiC.PROPERTY_RIGHT)) {
			layoutParams.optionRight = toTiDimension(hashMap, TiC.PROPERTY_RIGHT, TiDimension.TYPE_RIGHT);
			dirty = true;
		}

		if (hashMap.containsKey(TiC.PROPERTY_BOTTOM)) {
			layoutParams.optionBottom = toTiDimension(hashMap, TiC.PROPERTY_BOTTOM, TiDimension.TYPE_BOTTOM);
			dirty = true;
		}

		if (width != null || hashMap.containsKey(TiC.PROPERTY_WIDTH)) {
			if (width == null) {
				width = hashMap.get(TiC.PROPERTY_WIDTH);
			}

			if (width == null) {
				layoutParams.optionWidth = null;
				layoutParams.sizeOrFillWidthEnabled = false;

			} else if (width.equals(TiC.SIZE_AUTO)) {
				layoutParams.optionWidth = null;
				layoutParams.sizeOrFillWidthEnabled = true;

			} else if (width.equals(TiC.LAYOUT_FILL)) {
				// fill
				layoutParams.optionWidth = null;
				layoutParams.sizeOrFillWidthEnabled = true;
				layoutParams.autoFillsWidth = true;

			} else if (width.equals(TiC.LAYOUT_SIZE)) {
				// size
				layoutParams.optionWidth = null;
				layoutParams.sizeOrFillWidthEnabled = true;
				layoutParams.autoFillsWidth = false;
			} else {
				layoutParams.optionWidth = toTiDimension(width, TiDimension.TYPE_WIDTH);
				layoutParams.sizeOrFillWidthEnabled = false;
			}
			dirty = true;
		}

		if (height != null || hashMap.containsKey(TiC.PROPERTY_HEIGHT)) {
			if (height == null) {
				height = hashMap.get(TiC.PROPERTY_HEIGHT);
			}

			if (height == null) {
				layoutParams.optionHeight = null;
				layoutParams.sizeOrFillHeightEnabled = false;

			} else if (height.equals(TiC.SIZE_AUTO)) {
				layoutParams.optionHeight = null;
				layoutParams.sizeOrFillHeightEnabled = true;

			} else if (height.equals(TiC.LAYOUT_FILL)) {
				// fill
				layoutParams.optionHeight = null;
				layoutParams.sizeOrFillHeightEnabled = true;
				layoutParams.autoFillsHeight = true;

			} else if (height.equals(TiC.LAYOUT_SIZE)) {
				// size
				layoutParams.optionHeight = null;
				layoutParams.sizeOrFillHeightEnabled = true;
				layoutParams.autoFillsHeight = false;
			} else {
				layoutParams.optionHeight = toTiDimension(height, TiDimension.TYPE_HEIGHT);
				layoutParams.sizeOrFillHeightEnabled = false;
			}
			dirty = true;
		}

		if (hashMap.containsKey(TiC.PROPERTY_ZINDEX)) {
			Object zIndex = hashMap.get(TiC.PROPERTY_ZINDEX);
			if (zIndex != null) {
				layoutParams.optionZIndex = toInt(zIndex);

			} else {
				layoutParams.optionZIndex = 0;
			}
			dirty = true;
		}

		if (hashMap.containsKey(TiC.PROPERTY_TRANSFORM)) {
			layoutParams.optionTransform = (Ti2DMatrix) hashMap.get(TiC.PROPERTY_TRANSFORM);
		}

		return dirty;
	}

	public static void updateLayoutCenter(Object value, LayoutParams layoutParams)
	{
		if (value instanceof HashMap) {
			@SuppressWarnings("rawtypes")
			HashMap center = (HashMap) value;
			Object x = center.get(TiC.PROPERTY_X);
			Object y = center.get(TiC.PROPERTY_Y);

			if (x != null) {
				layoutParams.optionCenterX = toTiDimension(x, TiDimension.TYPE_CENTER_X);

			} else {
				layoutParams.optionCenterX = null;
			}

			if (y != null) {
				layoutParams.optionCenterY = toTiDimension(y, TiDimension.TYPE_CENTER_Y);

			} else {
				layoutParams.optionCenterY = null;
			}

		} else if (value != null) {
			layoutParams.optionCenterX = toTiDimension(value, TiDimension.TYPE_CENTER_X);
			layoutParams.optionCenterY = null;

		} else {
			layoutParams.optionCenterX = null;
			layoutParams.optionCenterY = null;
		}
	}

	/**
	 * Attempts to convert a value into a boolean, if value is a Boolean or String. Otherwise,
	 * an exception is thrown.
	 * @param value the value to convert.
	 * @return a boolean value.
	 * @module.api
	 */
	public static boolean toBoolean(Object value)
	{
		if (value instanceof Boolean) {
			return (Boolean) value;

		} else if (value instanceof String) {
			return Boolean.parseBoolean(((String) value));

		} else {
			throw new IllegalArgumentException("Unable to convert " + (value == null ? "null" : value.getClass().getName()) + " to boolean.");
		}
	}

	/**
	 * Takes a value out of a hash table then attempts to convert it using {@link #toBoolean(Object)}.
	 * @param hashMap the hash map to search.
	 * @param key the lookup key.
	 * @return a boolean value.
	 * @module.api
	 */
	public static boolean toBoolean(HashMap<String, Object> hashMap, String key)
	{
		return toBoolean(hashMap.get(key));
	}

	/**
	 * If value is a Double, Integer, Long or String, converts it to Integer. Otherwise
	 * an exception is thrown.
	 * @param value the value to convert.
	 * @return an int value.
	 * @module.api
	 */
	public static int toInt(Object value)
	{
		if (value instanceof Double) {
			return ((Double) value).intValue();

		} else if (value instanceof Integer) {
			return ((Integer) value);

		} else if (value instanceof Long) {
			return ((Long) value).intValue();

		} else if (value instanceof String) {
			return Integer.parseInt((String) value);

		} else {
			throw new NumberFormatException("Unable to convert " + value.getClass().getName());
		}
	}

	/**
	 * If value is a Double, Integer, Long or String, converts it to Integer. Otherwise
	 * returns default value.
	 * @param value the value to convert.
	 * @param def the default value to return
	 * @return an int value.
	 * @module.api
	 */
	public static int toInt(Object value, int def)
	{
		try {
			return toInt(value);
		} catch (NumberFormatException e) {
			return def;
		}
	}

	/**
	 * Takes a value out of a hash table then attempts to convert it using {@link #toInt(Object)}.
	 * @param hashMap the hash map to search.
	 * @param key the lookup key.
	 * @return an int value.
	 * @module.api
	 */
	public static int toInt(HashMap<String, Object> hashMap, String key)
	{
		return toInt(hashMap.get(key));
	}

	/**
	 * If value is a Double, Integer or String, converts it to Float. Otherwise,
	 * an exception is thrown.
	 * @param value the value to convert.
	 * @return a float value.
	 * @module.api
	 */
	public static float toFloat(Object value)
	{
		if (value instanceof Float) {
			return (Float) value;

		} else if (value instanceof Double) {
			return ((Double) value).floatValue();

		} else if (value instanceof Integer) {
			return ((Integer) value).floatValue();

		} else if (value instanceof String) {
			return Float.parseFloat((String) value);

		} else {
			throw new NumberFormatException("Unable to convert value to float.");
		}
	}

	/**
	 * If value is a Double, Integer, Long or String, converts it to Float. Otherwise
	 * returns default value.
	 * @param value the value to convert.
	 * @param def the default value to return
	 * @return an float value.
	 * @module.api
	 */
	public static float toFloat(Object value, float def)
	{
		try {
			return toFloat(value);
		} catch (NumberFormatException e) {
			return def;
		}
	}

	/**
	 * Takes a value out of a hash table then attempts to convert it using {@link #toFloat(Object)} for more details.
	 * @param hashMap the hash map to search.
	 * @param key the lookup key.
	 * @return a float value.
	 * @module.api
	 */
	public static float toFloat(HashMap<String, Object> hashMap, String key)
	{
		return toFloat(hashMap.get(key));
	}

	/**
	 * Takes a value out of a hash table then attempts to convert it using {@link #toFloat(Object)} for more details.
	 * @param hashMap the hash map to search.
	 * @param key the lookup key.
	 * @param def the default value to return.
	 * @return a float value.
	 * @module.api
	 */
	public static float toFloat(HashMap<String, Object> hashMap, String key, float def)
	{
		return toFloat(hashMap.get(key), def);
	}

	/**
	 * If value is a Double, Integer, or String, converts it to Double. Otherwise,
	 * an exception is thrown.
	 * @param value the value to convert.
	 * @return a double value.
	 * @module.api
	 */ 
	public static double toDouble(Object value)
	{
		if (value instanceof Double) {
			return ((Double) value);

		} else if (value instanceof Integer) {
			return ((Integer) value).doubleValue();

		} else if (value instanceof String) {
			return Double.parseDouble((String) value);

		} else {
			throw new NumberFormatException("Unable to convert " + value.getClass().getName());
		}
	}

	/**
	 * Takes a value out of a hash table then attempts to convert it using {@link #toDouble(Object)} for more details.
	 * @param hashMap the hash map to search.
	 * @param key the lookup key.
	 * @return a double.
	 * @module.api
	 */
	public static double toDouble(HashMap<String, Object> hashMap, String key)
	{
		return toDouble(hashMap.get(key));
	}

	/**
	 * Converts a vlaue into a String. If value is null, a default value is returned.
	 * @param value the value to convert.
	 * @param defaultString the default value.
	 * @return a String.
	 * @module.api
	 */
	public static String toString(Object value, String defaultString)
	{
		String result = toString(value);
		if (result == null) {
			result = defaultString;
		}

		return result;
	}

	/**
	 * Converts a value into a String. If value is null, returns null.
	 * @param value the value to convert.
	 * @return String or null.
	 * @module.api
	 */
	public static String toString(Object value)
	{
		return value == null ? null : value.toString();
	}

	/**
	 * Takes a value out of a hash table then attempts to convert it using {@link #toString(Object)} for more details.
	 * @param hashMap the hash map to search.
	 * @param key the lookup key.
	 * @return String or null.
	 * @module.api
	 */
	public static String toString(HashMap<String, Object> hashMap, String key)
	{
		return toString(hashMap.get(key));
	}

	/**
	 * Converts an Object array into a String array.
	 * @param parts the object array to convert
	 * @return a String array.
	 * @module.api
	 */
	public static String[] toStringArray(Object[] parts)
	{
		String[] sparts = (parts != null ? new String[parts.length] : new String[0]);
		if (parts != null) {
			for (int i = 0; i < parts.length; i++) {
				sparts[i] = parts[i] == null ? null : parts[i].toString();
			}
		}

		return sparts;
	}

	/**
	 * Converts an array of boxed objects into a primitive int array.
	 * @param inArray array that contains Number objects
	 * @return a primitive int array
	 * @throws ClassCastException if a non-Integer object is found in the array.
	 */
	public static int[] toIntArray(Object[] inArray) {
		int[] outArray = new int[inArray.length];
		for (int i = 0; i < inArray.length; i++) {
			outArray[i] = ((Number) inArray[i]).intValue();
		}
		return outArray;
	}

	/**
	 * Returns a new TiDimension object given a String value and type.
	 * Refer to {@link TiDimension#TiDimension(String, int)} for more details.
	 * @param value the dimension value.
	 * @param valueType the dimension type.
	 * @return a TiDimension instance.
	 */
	public static TiDimension toTiDimension(String value, int valueType)
	{
		return new TiDimension(value, valueType);
	}

	/**
	 * Converts value to String, and if value is a Number, appends "px" to value, 
	 * then creates and returns a new TiDimension object with the new value and valueType.
	 * Refer to {@link TiDimension#TiDimension(String, int)} for more details.
	 * @param value the dimension value.
	 * @param valueType the dimension type.
	 * @return a TiDimension instance.
	 */
	public static TiDimension toTiDimension(Object value, int valueType)
	{
		if (value instanceof Number) {
			value = value.toString() + TiApplication.getInstance().getDefaultUnit();
		}
		if (value instanceof String) {
			return toTiDimension((String) value, valueType);
		}
		return null;
	}
	/**
	 * Takes a value out of a hash table then attempts to convert it using {@link #toTiDimension(Object, int)} for more details.
	 * @param hashMap the hash map to search.
	 * @param key the lookup key.
	 * @param valueType the dimension type.
	 * @return a TiDimension instance.
	 */
	public static TiDimension toTiDimension(HashMap<String, Object> hashMap, String key, int valueType)
	{
		return toTiDimension(hashMap.get(key), valueType);
	}

	/**
	 * Returns a url string by appending the 
	 * String representation of 'uri' to file:///android_asset/Resources/
	 * @param uri the uri, cannot be null.
	 * @return url string.
	 */
	public static String toURL(Uri uri)
	{
		String url = null;
		if (uri.isRelative()) {
			url = uri.toString();
			if (url.startsWith("/")) {
				url = ASSET_URL + "Resources" + url.substring(1);

			} else {
				url = ASSET_URL + "Resources/" + url;
			}

		} else {
			url = uri.toString();
		}

		return url;
	}

	/**
	 * Casts and returns value as TiBlob.
	 * @param value must be of type TiBlob.
	 * @return a TiBlob instance.
	 * @module.api
	 */
	public static TiBlob toBlob(Object value)
	{
		return (TiBlob) value;
	}

	/**
	 * A wrapper function.
	 * Refer to {@link #toBlob(Object)} for more details.
	 * @param object the hashmap.
	 * @param property the lookup key.
	 * @return a TiBlob instance.
	 * @module.api
	 */
	public static TiBlob toBlob(HashMap<String, Object> object, String property)
	{
		return toBlob(object.get(property));
	}

	/**
	 * Converts a HashMap into a JSONObject and returns it. If data is null, null is returned.
	 * @param data the HashMap used for conversion.
	 * @return a JSONObject instance.
	 */
	public static JSONObject toJSON(HashMap<String, Object> data)
	{
		if (data == null) {
			return null;
		}
		JSONObject json = new JSONObject();

		for (String key : data.keySet()) {
			try {
				Object o = data.get(key);
				if (o == null) {
					json.put(key, JSONObject.NULL);

				} else if (o instanceof Number) {
					json.put(key, (Number) o);

				} else if (o instanceof String) {
					json.put(key, (String) o);

				} else if (o instanceof Boolean) {
					json.put(key, (Boolean) o);

				} else if (o instanceof Date) {
					json.put(key, toJSONString((Date)o));

				} else if (o instanceof HashMap) {
					json.put(key, toJSON((HashMap) o));

				} else if (o.getClass().isArray()) {
					json.put(key, toJSONArray((Object[]) o));

				} else {
					Log.w(TAG, "Unsupported type " + o.getClass());
				}

			} catch (JSONException e) {
				Log.w(TAG, "Unable to JSON encode key: " + key);
			}
		}

		return json;
	}

	/**
	 * Converts an object array into JSONArray and returns it.
	 * @param a  the object array to be converted.
	 * @return a JSONArray instance.
	 */
	public static JSONArray toJSONArray(Object[] a)
	{
		JSONArray ja = new JSONArray();
		for (Object o : a) {
			if (o == null) {
				Log.w(TAG, "Skipping null value in array", Log.DEBUG_MODE);
				continue;
			}

			// dead code, for now leave in place for debugging
			/*if (o == null) {
				ja.put(JSONObject.NULL);
			} else */
			if (o instanceof Number) {
				ja.put((Number) o);

			} else if (o instanceof String) {
				ja.put((String) o);

			} else if (o instanceof Boolean) {
				ja.put((Boolean) o);

			} else if (o instanceof Date) {
				ja.put(toJSONString((Date)o));

			} else if (o instanceof HashMap) {
				ja.put(toJSON((HashMap) o));

			} else if (o.getClass().isArray()) {
				ja.put(toJSONArray((Object[]) o));

			} else {
				Log.w(TAG, "Unsupported type " + o.getClass());
			}
		}

		return ja;
	}
	
	/**
	 * If value is a  Date, formats and returns it. Otherwise,
	 * return a String representation of value.
	 * @param value the value to convert.
	 * @return a String.
	 * @module.api
	 */
	public static String toJSONString(Object value)
	{
		if (value instanceof Date) {
			DateFormat df = new SimpleDateFormat(JSON_DATE_FORMAT);
			df.setTimeZone(TimeZone.getTimeZone("GMT"));

			return df.format((Date)value);

		} else {
			return toString(value);
		}
	}

	/**
	 * Converts value into Date object and returns it.
	 * @param value the value to convert.
	 * @return a Date instance.
	 * @module.api
	 */
	public static Date toDate(Object value)
	{
		if (value instanceof Date) {
			return (Date)value;

		} else if (value instanceof Number) {
			long millis = ((Number)value).longValue();

			return new Date(millis);
		}

		return null;
	}
	
	/**
	 * A wrapper function.
	 * Refer to {@link #toDate(Object)} for more details.
	 * @param hashMap the hash map to search.
	 * @param key the lookup key
	 * @return a Date instance.
	 * @module.api
	 */
	public static Date toDate(HashMap<String, Object> hashMap, String key)
	{
		return toDate(hashMap.get(key));
	}
}


