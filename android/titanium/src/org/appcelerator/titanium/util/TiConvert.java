/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.util.Date;
import java.util.Map;
import java.util.Iterator;

import org.mozilla.javascript.Function;

import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.kroll.KrollCallback;
import org.appcelerator.titanium.kroll.KrollObject;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiCompositeLayout.LayoutParams;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.net.Uri;

public class TiConvert
{
    private static final String LCAT = "TiConvert";
    private static final boolean DBG = TiConfig.LOGD;

    public static final String ASSET_URL = "file:///android_asset/"; // class scope on URLUtil

    // Bundle

    public static Object putInTiDict(TiDict d, String key, Object value)
    {
        if (value instanceof String || value instanceof Number || value instanceof Boolean || value instanceof Date) {
            d.put(key, value);
        } else if (value instanceof TiDict) {
            TiDict nd = new TiDict();
            TiDict dict = (TiDict) value;
            for (String k : dict.keySet()) {
                putInTiDict(nd, k, dict.get(k));
            }
            d.put(key, nd);
            value = nd;
        } else if (value instanceof Object[]) {
            Object[] a = (Object[]) value;
            int len = a.length;
            if (len > 0) {
                Object v = a[0];
                if (DBG) {
	                if (v != null) {
	                    Log.w(LCAT, "Array member is type: " + v.getClass().getSimpleName());
	                } else {
	                    Log.w(LCAT, "First member of array is null");
	                }
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
                } else if (v != null && v instanceof KrollObject) {
                    TiProxy[] pa = new TiProxy[len];
                    for(int i = 0; i < len; i++) {
                        KrollObject ko = (KrollObject) a[i];
                        pa[i] = (TiProxy) ko.getTarget();
                    }
                    d.put(key, pa);
                } else {

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
        } else if (value instanceof TiProxy) {
            d.put(key, value);
        } else if (value instanceof KrollCallback || value instanceof Function) {
            d.put(key, value);
		} else if (value instanceof Map) {
			TiDict dict = new TiDict();
			Map map = (Map)value;
			Iterator iter = map.keySet().iterator();
			while(iter.hasNext())
			{
				String k = (String)iter.next();
				putInTiDict(dict,k,map.get(k));
			}
			d.put(key,dict);
        } else {
            throw new IllegalArgumentException("Unsupported property type " + value.getClass().getName());
        }

        return value;
    }
    // Color conversions
    public static int toColor(String value) {
        return TiColorHelper.parseColor(value);
    }
    public static int toColor(TiDict d, String key) {
        return toColor(d.getString(key));
    }
    public static int toColor(TiDict d, String colorKey, String opacityKey) {
        int color = toColor(d, colorKey);
        if (color == Color.TRANSPARENT) {
        	return color;
        }

        int alpha = 255;
        if (d.containsKey(opacityKey)) {
            alpha = (int) Math.round(255 * TiConvert.toDouble(d, opacityKey));
        }
        return Color.argb(alpha, Color.red(color), Color.green(color), Color.blue(color));
    }
    public static ColorDrawable toColorDrawable(String value) {
        return new ColorDrawable(toColor(value));
    }
    public static ColorDrawable toColorDrawable(TiDict d, String key) {
        return toColorDrawable(d.getString(key));
    }
    public static ColorDrawable toColorDrawable(TiDict d, String colorKey, String opacityKey) {
        return new ColorDrawable(toColor(d, colorKey, opacityKey));
    }

    // Layout
    public static boolean fillLayout(TiDict d, LayoutParams layoutParams) {
        boolean dirty = false;
        Object width = null;
        Object height = null;

        if (d.containsKey("size")) {
            TiDict size = (TiDict)d.get("size");
            width = size.get("width");
            height = size.get("height");
        }
        if (d.containsKey("left")) {
            layoutParams.optionLeft = toTiDimension(d, "left").getIntValue();
            dirty = true;
        }
        if (d.containsKey("top")) {
            layoutParams.optionTop = toTiDimension(d, "top").getIntValue();
            dirty = true;
        }
        if (d.containsKey("right")) {
            layoutParams.optionRight = toTiDimension(d, "right").getIntValue();
            dirty = true;
        }
        if (d.containsKey("bottom")) {
            layoutParams.optionBottom = toTiDimension(d, "bottom").getIntValue();
            dirty = true;
        }
        if (width!=null || d.containsKey("width")) {
            if (width==null)
            {
                width = d.get("width");
            }
            if (width == null || width.equals("auto")) {
                layoutParams.optionWidth = TiCompositeLayout.NOT_SET;
                layoutParams.autoWidth = true;
            } else {
                layoutParams.optionWidth = toTiDimension(width).getIntValue();
                layoutParams.autoWidth = false;
            }
            dirty = true;
        }
        if (height!=null || d.containsKey("height")) {
            if (height==null)
            {
                height = d.get("height");
            }
            if (height == null || height.equals("auto")) {
                layoutParams.optionHeight = TiCompositeLayout.NOT_SET;
                layoutParams.autoHeight = true;
            } else {
                layoutParams.optionHeight = toTiDimension(height).getIntValue();
                layoutParams.autoHeight = false;
            }
            dirty = true;
        }
        if (d.containsKey("zIndex")) {
            Object zIndex = d.get("zIndex");
            if (zIndex != null) {
                layoutParams.optionZIndex = toInt(zIndex);
            } else {
            	layoutParams.optionZIndex = 0;
            }
            dirty = true;
        }

        return dirty;
    }

    // Values

    public static boolean toBoolean(Object value)
    {
        if (value instanceof Boolean) {
            return (Boolean) value;
        } else if (value instanceof String) {
            return Boolean.parseBoolean(((String) value));
        } else {
            throw new IllegalArgumentException("Unable to convert " + value.getClass().getName() + " to boolean.");
        }
    }
    public static boolean toBoolean(TiDict d, String key) {
        return toBoolean(d.get(key));
    }

    public static int toInt(Object value) {
        if (value instanceof Double) {
            return ((Double) value).intValue();
        } else if (value instanceof Integer) {
            return ((Integer) value);
        } else if (value instanceof String) {
            return Integer.parseInt((String) value);
        } else {
            throw new NumberFormatException("Unable to convert " + value.getClass().getName());
        }
    }
    public static int toInt(TiDict d, String key) {
        return toInt(d.get(key));
    }

    public static float toFloat(Object value) {
        if (value instanceof Double) {
            return ((Double) value).floatValue();
        } else if (value instanceof Integer) {
            return ((Integer) value).floatValue();
        } else if (value instanceof String) {
            return Float.parseFloat((String) value);
        } else {
            throw new NumberFormatException("Unable to convert " + value.getClass().getName());
        }
    }
    public static float toFloat(TiDict d, String key) {
        return toFloat(d.get(key));
    }

    public static double toDouble(Object value) {
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
    public static double toDouble(TiDict d, String key) {
        return toDouble(d.get(key));
    }

    public static String toString(Object value) {
        return value == null ? null : value.toString();
    }
    public static String toString(TiDict d, String key) {
        return toString(d.get(key));
    }

    public static String[] toStringArray(Object[] parts) {
        String[] sparts = (parts != null ? new String[parts.length] : new String[0]);

        if (parts != null) {
            for (int i = 0; i < parts.length; i++) {
                sparts[i] = (String) parts[i];
            }
        }
        return sparts;
    }

    // Dimensions
    public static TiDimension toTiDimension(String value) {
        return new TiDimension(value);
    }
    
    public static TiDimension toTiDimension(Object value) {
        if (value instanceof Number) {
            value = value.toString() + "px";
        }
        return toTiDimension((String) value);
    }

    public static TiDimension toTiDimension(TiDict d, String key) {
        return toTiDimension(d.get(key));
    }

    // URL
    public static String toURL(Uri uri)
    {
        //TODO handle Ti URLs.

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

    //Error
    public static TiDict toErrorObject(int code, String msg) {
        TiDict d = new TiDict(1);

        TiDict e = new TiDict();
        e.put("code", code);
        e.put("message", msg);

        d.put("error", e);
        return d;
    }

    public static TiBlob toBlob(Object value) {
        return (TiBlob) value;
    }

    public static TiBlob toBlob(TiDict object, String property) {
        return toBlob(object.get(property));
    }

    // JSON

    public static JSONObject toJSON(TiDict data)
    {
    	if (data == null)
    	{
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
    			} else if (o instanceof TiDict) {
    				json.put(key, toJSON((TiDict) o));
    			} else if (o.getClass().isArray()) {
    				json.put(key, toJSONArray((Object[]) o));
    			}  else {
    				Log.w(LCAT, "Unsupported type " + o.getClass());
    			}
    		} catch (JSONException e) {
    			Log.w(LCAT, "Unable to JSON encode key: " + key);
    		}
    	}

    	return json;
    }

    public static JSONArray toJSONArray(Object[] a) {
    	JSONArray ja = new JSONArray();


    	for (Object o : a) {
    		if (o == null) {
    			if (DBG) {
    				Log.w(LCAT, "Skipping null value in array");
    			}
    			continue;
    		}
    		if (o == null) {
    			ja.put(JSONObject.NULL);
    		} else if (o instanceof Number) {
				ja.put((Number) o);
			} else if (o instanceof String) {
				ja.put((String) o);
			} else if (o instanceof Boolean) {
				ja.put((Boolean) o);
			} else if (o instanceof TiDict) {
				ja.put(toJSON((TiDict) o));
			} else if (o.getClass().isArray()) {
				ja.put(toJSONArray((Object[]) o));
			} else {
				Log.w(LCAT, "Unsupported type " + o.getClass());
			}
    	}
    	return ja;
    }
    
    public static Date toDate(Object value) {
		if (value instanceof Date) {
			return (Date)value;
		} else if (value instanceof Number) {
			long millis = ((Number)value).longValue();
			return new Date(millis);
		}
		return null;
	}

	public static Date toDate(TiDict d, String key) {
		return toDate(d.get(key));
	}
}
