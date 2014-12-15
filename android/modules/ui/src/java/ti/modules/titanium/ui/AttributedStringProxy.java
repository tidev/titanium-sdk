/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;

import android.text.Spannable;
import android.text.SpannableString;
import android.text.TextUtils;
import android.text.style.AbsoluteSizeSpan;
import android.text.style.BackgroundColorSpan;
import android.text.style.ForegroundColorSpan;
import android.text.style.StrikethroughSpan;
import android.text.style.StyleSpan;
import android.text.style.TypefaceSpan;
import android.text.style.URLSpan;
import android.text.style.UnderlineSpan;

@Kroll.proxy(creatableInModule=UIModule.class, propertyAccessors = {
	TiC.PROPERTY_ATTRIBUTES,
	TiC.PROPERTY_TEXT
})
public class AttributedStringProxy extends KrollProxy
{
	private static final String TAG = "AttributedString";

	public AttributedStringProxy()
	{
	}

	public static AttributeProxy attributeProxyFor(Object obj, KrollProxy proxy)
	{
		AttributeProxy attributeProxy = null;
		if (obj instanceof AttributeProxy) {
			return (AttributeProxy)obj;
		} else {
			KrollDict attributeDict = null;
			if (obj instanceof KrollDict) {
				attributeDict = (KrollDict)obj;
			} else if (obj instanceof HashMap) {
				attributeDict = new KrollDict((HashMap)obj);
			}
			if (attributeDict != null) {
				attributeProxy = new AttributeProxy();
				attributeProxy.setCreationUrl(proxy.getCreationUrl().getNormalizedUrl());
				attributeProxy.handleCreationDict(attributeDict);
			}
			if(attributeProxy == null) {
				Log.e(TAG, "Unable to create attribute proxy for object, likely an error in the type of the object passed in.");
			}
			
			return attributeProxy;
		}
	}
	
	public static Spannable toSpannable(AttributedStringProxy attrString, TiViewProxy proxy)
	{
		if (attrString.hasProperty(TiC.PROPERTY_TEXT)) {
			String textString = TiConvert.toString(attrString.getProperty(TiC.PROPERTY_TEXT));
			if (!TextUtils.isEmpty(textString)) {
				Spannable spannableText = new SpannableString(textString);
				AttributeProxy[] attributes = null;
				Object obj = attrString.getProperty(TiC.PROPERTY_ATTRIBUTES);
				if (obj != null && obj instanceof Object[]) {
					Object[] objArray = (Object[])obj;
					attributes = new AttributeProxy[objArray.length];
					for (int i = 0; i < objArray.length; i++) {
						attributes[i] = AttributedStringProxy.attributeProxyFor(objArray[i], attrString);
					}
				}
				if(attributes != null) {
					for (AttributeProxy attr : attributes) {
						if (attr.hasProperty(TiC.PROPERTY_TYPE)) {
							Object type = attr.getProperty(TiC.PROPERTY_ATTRIBUTE_TYPE);
							int[] range = null;
							Object inRange = attr.getProperty(TiC.PROPERTY_ATTRIBUTE_RANGE);
							if (inRange != null && inRange instanceof Object[]) {
								range = TiConvert.toIntArray((Object[])inRange);
							}
							Object attrValue = attr.getProperty(TiC.PROPERTY_ATTRIBUTE_VALUE);
							switch (TiConvert.toInt(type)) {
								case UIModule.ATTRIBUTE_FONT:
									KrollDict fontProp = null;
									if (attrValue instanceof KrollDict) {
										fontProp = (KrollDict) attrValue;
									} else if (attrValue instanceof HashMap) {
										fontProp = new KrollDict((HashMap<String, Object>) attrValue);
									}
									String[] fontProperties = TiUIHelper.getFontProperties((KrollDict) fontProp);
									if (fontProperties[TiUIHelper.FONT_SIZE_POSITION] != null) {
										spannableText.setSpan(
											new AbsoluteSizeSpan((int) TiUIHelper.getRawSize(
												fontProperties[TiUIHelper.FONT_SIZE_POSITION], proxy.getActivity())),
											range[0], range[0] + range[1], Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
									}
									if (fontProperties[TiUIHelper.FONT_WEIGHT_POSITION] != null) {
										int typefaceStyle = Integer.valueOf(TiUIHelper.toTypefaceStyle(
											fontProperties[TiUIHelper.FONT_WEIGHT_POSITION],
											fontProperties[TiUIHelper.FONT_STYLE_POSITION]));
										spannableText.setSpan(new StyleSpan(typefaceStyle), range[0], range[0] + range[1],
											Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
									}
									if (fontProperties[TiUIHelper.FONT_FAMILY_POSITION] != null) {
										spannableText.setSpan(new TypefaceSpan(fontProperties[TiUIHelper.FONT_FAMILY_POSITION]),
											range[0], range[0] + range[1], Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
									}
									break;
								case UIModule.ATTRIBUTE_BACKGROUND_COLOR:
									spannableText.setSpan(
										new BackgroundColorSpan(TiConvert.toColor(TiConvert.toString(attrValue))), range[0],
										range[0] + range[1], Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
									break;
								case UIModule.ATTRIBUTE_FOREGROUND_COLOR:
									spannableText.setSpan(
										new ForegroundColorSpan(TiConvert.toColor(TiConvert.toString(attrValue))), range[0],
										range[0] + range[1], Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
									break;
								case UIModule.ATTRIBUTE_STRIKETHROUGH_STYLE:
									spannableText.setSpan(new StrikethroughSpan(), range[0], range[0] + range[1],
										Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
									break;
								case UIModule.ATTRIBUTE_UNDERLINES_STYLE:
									spannableText.setSpan(new UnderlineSpan(), range[0], range[0] + range[1],
										Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
									break;
								case UIModule.ATTRIBUTE_LINK:
									spannableText.setSpan(new URLSpan(TiConvert.toString(attrValue)), range[0], range[0]
										+ range[1], Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
									break;
							}
						}
					}
				}
				return spannableText;
			}
		}
		return null;
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.AttributedString";
	}
}
