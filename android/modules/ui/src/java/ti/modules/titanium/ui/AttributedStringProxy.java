/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2014-2015 by Appcelerator, Inc. All Rights Reserved.
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
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;

import android.app.Activity;
import android.graphics.Paint;
import android.graphics.Typeface;
import android.os.Bundle;
import android.text.Spannable;
import android.text.SpannableString;
import android.text.TextUtils;
import android.text.style.AbsoluteSizeSpan;
import android.text.style.BackgroundColorSpan;
import android.text.style.ForegroundColorSpan;
import android.text.style.LineHeightSpan;
import android.text.style.StrikethroughSpan;
import android.text.style.StyleSpan;
import android.text.style.SubscriptSpan;
import android.text.style.SuperscriptSpan;
import android.text.style.TypefaceSpan;
import android.text.style.URLSpan;
import android.text.style.UnderlineSpan;

@Kroll.proxy(creatableInModule = UIModule.class, propertyAccessors = { TiC.PROPERTY_ATTRIBUTES, TiC.PROPERTY_TEXT })
public class AttributedStringProxy extends KrollProxy
{
	private static final String TAG = "AttributedString";

	public AttributedStringProxy()
	{
	}

	@Kroll.method
	public void addAttribute(Object attr)
	{
		AttributeProxy attribute;
		KrollDict attributeDict = null;
		if (attr instanceof HashMap) {
			attributeDict = new KrollDict((HashMap) attr);
		}
		if (attributeDict != null) {
			attribute = new AttributeProxy();
			attribute.setCreationUrl(getCreationUrl().getNormalizedUrl());
			attribute.handleCreationDict(attributeDict);
			Object obj = getProperty(TiC.PROPERTY_ATTRIBUTES);
			AttributeProxy[] attributes = null;
			if (obj instanceof Object[]) {
				Object[] objArray = (Object[]) obj;
				attributes = new AttributeProxy[objArray.length + 1];
				for (int i = 0; i < objArray.length; i++) {
					attributes[i] = AttributedStringProxy.attributeProxyFor(objArray[i], this);
				}
				attributes[objArray.length] = attribute;
			} else {
				attributes = new AttributeProxy[1];
				attributes[0] = attribute;
			}
			setProperty(TiC.PROPERTY_ATTRIBUTES, attributes);
		}
	}

	public static AttributeProxy attributeProxyFor(Object obj, KrollProxy proxy)
	{
		AttributeProxy attributeProxy = null;
		if (obj instanceof AttributeProxy) {
			return (AttributeProxy) obj;
		} else {
			KrollDict attributeDict = null;
			if (obj instanceof KrollDict) {
				attributeDict = (KrollDict) obj;
			} else if (obj instanceof HashMap) {
				attributeDict = new KrollDict((HashMap) obj);
			}
			if (attributeDict != null) {
				attributeProxy = new AttributeProxy();
				attributeProxy.setCreationUrl(proxy.getCreationUrl().getNormalizedUrl());
				attributeProxy.handleCreationDict(attributeDict);
			}
			if (attributeProxy == null) {
				Log.e(
					TAG,
					"Unable to create attribute proxy for object, likely an error in the type of the object passed in.");
			}

			return attributeProxy;
		}
	}

	public static Spannable toSpannable(AttributedStringProxy attrString, Activity activity)
	{
		Bundle results = toSpannableInBundle(attrString, activity);
		if (results.containsKey(TiC.PROPERTY_ATTRIBUTED_STRING)) {
			return (Spannable) results.getCharSequence(TiC.PROPERTY_ATTRIBUTED_STRING);
		}
		return null;
	}

	public static Bundle toSpannableInBundle(AttributedStringProxy attrString, Activity activity)
	{
		Bundle results = new Bundle();
		if (attrString != null && attrString.hasProperty(TiC.PROPERTY_TEXT)) {
			String textString = TiConvert.toString(attrString.getProperty(TiC.PROPERTY_TEXT));
			if (!TextUtils.isEmpty(textString)) {
				Spannable spannableText = new SpannableString(textString);
				AttributeProxy[] attributes = null;
				Object obj = attrString.getProperty(TiC.PROPERTY_ATTRIBUTES);
				if (obj instanceof Object[]) {
					Object[] objArray = (Object[]) obj;
					attributes = new AttributeProxy[objArray.length];
					for (int i = 0; i < objArray.length; i++) {
						attributes[i] = AttributedStringProxy.attributeProxyFor(objArray[i], attrString);
					}
				}
				if (attributes != null) {
					for (AttributeProxy attr : attributes) {
						if (attr.hasProperty(TiC.PROPERTY_TYPE)) {
							Object type = attr.getProperty(TiC.PROPERTY_TYPE);
							int[] range = null;
							Object inRange = attr.getProperty(TiC.PROPERTY_ATTRIBUTE_RANGE);
							if (inRange instanceof Object[]) {
								range = TiConvert.toIntArray((Object[]) inRange);
							}
							Object attrValue = attr.getProperty(TiC.PROPERTY_VALUE);
							if (range != null && (range[0] < (range[0] + range[1]))) {
								switch (TiConvert.toInt(type)) {
									case UIModule.ATTRIBUTE_FONT:
										KrollDict fontProp = null;
										if (attrValue instanceof KrollDict) {
											fontProp = (KrollDict) attrValue;
										} else if (attrValue instanceof HashMap) {
											fontProp = new KrollDict((HashMap<String, Object>) attrValue);
										}
										if (fontProp != null) {
											String[] fontProperties =
												TiUIHelper.getFontProperties((KrollDict) fontProp);
											if (fontProperties != null) {
												if (fontProperties[TiUIHelper.FONT_SIZE_POSITION] != null) {
													spannableText.setSpan(
														new AbsoluteSizeSpan((int) TiUIHelper.getRawSize(
															fontProperties[TiUIHelper.FONT_SIZE_POSITION], activity)),
														range[0], range[0] + range[1],
														Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
												}
												if (fontProperties[TiUIHelper.FONT_WEIGHT_POSITION] != null
													|| fontProperties[TiUIHelper.FONT_STYLE_POSITION] != null) {
													int typefaceStyle = TiUIHelper.toTypefaceStyle(
														fontProperties[TiUIHelper.FONT_WEIGHT_POSITION],
														fontProperties[TiUIHelper.FONT_STYLE_POSITION]);
													spannableText.setSpan(new StyleSpan(typefaceStyle), range[0],
																		  range[0] + range[1],
																		  Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
												}
												if (fontProperties[TiUIHelper.FONT_FAMILY_POSITION] != null) {
													if (TiUIHelper.isAndroidTypeface(
															fontProperties[TiUIHelper.FONT_FAMILY_POSITION])) {
														spannableText.setSpan(
															new TypefaceSpan(
																fontProperties[TiUIHelper.FONT_FAMILY_POSITION]),
															range[0], range[0] + range[1],
															Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
													} else {
														// If it is not an Android Typeface, it is a custom font
														Typeface font = TiUIHelper.toTypeface(
															activity, fontProperties[TiUIHelper.FONT_FAMILY_POSITION]);
														spannableText.setSpan(new CustomTypefaceSpan(font), range[0],
																			  range[0] + range[1],
																			  Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
													}
												}
											}
										}
										break;
									case UIModule.ATTRIBUTE_BACKGROUND_COLOR:
										spannableText.setSpan(
											new BackgroundColorSpan(TiConvert.toColor(TiConvert.toString(attrValue))),
											range[0], range[0] + range[1], Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
										break;
									case UIModule.ATTRIBUTE_FOREGROUND_COLOR:
										spannableText.setSpan(
											new ForegroundColorSpan(TiConvert.toColor(TiConvert.toString(attrValue))),
											range[0], range[0] + range[1], Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
										break;
									case UIModule.ATTRIBUTE_STRIKETHROUGH_STYLE:
										spannableText.setSpan(new StrikethroughSpan(), range[0], range[0] + range[1],
															  Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
										break;
									case UIModule.ATTRIBUTE_UNDERLINES_STYLE:
										spannableText.setSpan(new UnderlineSpan(), range[0], range[0] + range[1],
															  Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
										break;
									case UIModule.ATTRIBUTE_SUPERSCRIPT_STYLE:
										spannableText.setSpan(new SuperscriptSpan(), range[0], range[0] + range[1],
															  Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
										break;
									case UIModule.ATTRIBUTE_SUBSCRIPT_STYLE:
										spannableText.setSpan(new SubscriptSpan(), range[0], range[0] + range[1],
															  Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
										break;
									case UIModule.ATTRIBUTE_LINK:
										if (attrValue != null) {
											spannableText.setSpan(new URLSpan(TiConvert.toString(attrValue)), range[0],
																  range[0] + range[1],
																  Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
										}
										results.putBoolean(TiC.PROPERTY_HAS_LINK, true);
										break;
									case UIModule.ATTRIBUTE_BASELINE_OFFSET:
										final int offset = TiConvert.toInt(attrValue, 5);
										spannableText.setSpan(new LineHeightSpan() {
											@Override
											public void chooseHeight(CharSequence charSequence, int i, int i1, int i2,
																	 int i3, Paint.FontMetricsInt fontMetricsInt)
											{
												fontMetricsInt.bottom = offset * 2;
												fontMetricsInt.descent = offset * 2;
											}
										}, range[0], range[0] + range[1], Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
										break;
								}
							}
						}
					}
				}
				results.putCharSequence(TiC.PROPERTY_ATTRIBUTED_STRING, spannableText);
				return results;
			}
		}
		return results;
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.AttributedString";
	}
}
