/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.UIModule;
import ti.modules.titanium.ui.AttributedStringProxy;
import android.graphics.Color;
import android.os.Build;
import android.text.Html;
import android.text.InputType;
import android.text.Layout;
import android.text.Selection;
import android.text.Spannable;
import android.text.Spannable.Factory;
import android.text.SpannedString;
import android.text.TextUtils.TruncateAt;
import android.text.style.ClickableSpan;
import android.text.style.URLSpan;
import android.text.util.Linkify;
import android.text.TextPaint;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.widget.TextView;

public class TiUILabel extends TiUIView
{
	private static final String TAG = "TiUILabel";
	private static final float DEFAULT_SHADOW_RADIUS = 1f;

	private int defaultColor;
	private boolean wordWrap = true;
	private TruncateAt ellipsize = TruncateAt.END;
	private float shadowRadius = DEFAULT_SHADOW_RADIUS;
	private float shadowX = 0f;
	private float shadowY = 0f;
	private int shadowColor = Color.TRANSPARENT;
	private String minimumFontSize = null;
	private String propertySetFontSize = null;
	private String autoshrinkSetFontSize = null;

	public TiUILabel(final TiViewProxy proxy)
	{
		super(proxy);
		Log.d(TAG, "Creating a text label", Log.DEBUG_MODE);
		TextView tv = new TextView(getProxy().getActivity())
		{
			@Override
			protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec)
			{
				// Only allow label to exceed the size of parent when it's size behavior with both wordwrap and ellipsize disabled
				if (!wordWrap && ellipsize == null && layoutParams.optionWidth == null && !layoutParams.autoFillsWidth) {
					widthMeasureSpec = MeasureSpec.makeMeasureSpec(MeasureSpec.getSize(widthMeasureSpec),
						MeasureSpec.UNSPECIFIED);
					heightMeasureSpec = MeasureSpec.makeMeasureSpec(MeasureSpec.getSize(heightMeasureSpec),
						MeasureSpec.UNSPECIFIED);
				}

				super.onMeasure(widthMeasureSpec, heightMeasureSpec);
			}

			@Override
			protected void onLayout(boolean changed, int left, int top, int right, int bottom)
			{
				super.onLayout(changed, left, top, right, bottom);
				
				adjustTextFontSize(this);
				
				if (proxy != null && proxy.hasListeners(TiC.EVENT_POST_LAYOUT)) {
					proxy.fireEvent(TiC.EVENT_POST_LAYOUT, null, false);
				}
			}
			
			@Override
			public boolean onTouchEvent(MotionEvent event) {
			        TextView textView = (TextView) this;
			        Object text = textView.getText();
			        //For html texts, we will manually detect url clicks.
			        if (text instanceof SpannedString) {
			            SpannedString spanned = (SpannedString) text;
			            Spannable buffer = Factory.getInstance().newSpannable(spanned.subSequence(0, spanned.length()));

			            int action = event.getAction();

			            if (action == MotionEvent.ACTION_UP || action == MotionEvent.ACTION_DOWN) {
			                int x = (int) event.getX();
			                int y = (int) event.getY();

			                x -= textView.getTotalPaddingLeft();
			                y -= textView.getTotalPaddingTop();

			                x += textView.getScrollX();
			                y += textView.getScrollY();

			                Layout layout = textView.getLayout();
			                int line = layout.getLineForVertical(y);
			                int off = layout.getOffsetForHorizontal(line, x);

			                ClickableSpan[] link = buffer.getSpans(off, off,
			                        ClickableSpan.class);

							if (link.length != 0) {
								ClickableSpan cSpan = link[0]; 
								if (action == MotionEvent.ACTION_UP) {
									TiViewProxy proxy = getProxy();
									if(proxy.hasListeners("link") && (cSpan instanceof URLSpan)) {
										KrollDict evnt = new KrollDict();
										evnt.put("url", ((URLSpan)cSpan).getURL());
										proxy.fireEvent("link", evnt, false);
									} else {
										cSpan.onClick(textView);
									}
								} else if (action == MotionEvent.ACTION_DOWN) {
									Selection.setSelection(buffer, buffer.getSpanStart(cSpan), buffer.getSpanEnd(cSpan));
								}
							}
			            }

			        }
			        return super.onTouchEvent(event);
			    }
		};
		tv.setGravity(Gravity.CENTER_VERTICAL | Gravity.LEFT);
		tv.setPadding(0, 0, 0, 0);
		tv.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_MULTI_LINE);
		tv.setKeyListener(null);
		tv.setFocusable(false);
		tv.setSingleLine(false);
		tv.setEllipsize(ellipsize);
		TiUIHelper.styleText(tv, null);
		defaultColor =  tv.getCurrentTextColor();
		setNativeView(tv);

	}
	
	/**
	 * Method used to decrease the fontsize of the text to fit the width
	 * fontsize should be >= than the property minimumFontSize
	 * @param view
	 */
	private void adjustTextFontSize(View v){	
		if (minimumFontSize != null){
			TextView tv = (TextView) v;

			if (tv != null) {
				if (autoshrinkSetFontSize != null) {
					if (tv.getTextSize() == TiConvert.toFloat(autoshrinkSetFontSize)) {
						if (propertySetFontSize != null ) {
							tv.setTextSize(TiUIHelper.getSizeUnits(propertySetFontSize), TiUIHelper.getSize(propertySetFontSize));
						} else {
							tv.setTextSize(TiUIHelper.getSizeUnits(null), TiUIHelper.getSize(null));
						}
					}
				}
			    
			    TextPaint textPaint = tv.getPaint();
				if (textPaint != null) {
					float stringWidth = textPaint.measureText((tv.getText()).toString());
					int textViewWidth = tv.getWidth();
					if (textViewWidth < stringWidth && stringWidth != 0) {
						float fontSize = (textViewWidth / stringWidth) * tv.getTextSize();
						autoshrinkSetFontSize = fontSize > TiConvert.toFloat(minimumFontSize) ? String.valueOf(fontSize) : minimumFontSize;
						tv.setTextSize(TiUIHelper.getSizeUnits(autoshrinkSetFontSize), TiUIHelper.getSize(autoshrinkSetFontSize));
					}
				}
			}
		}
	}

	@Override
	public void processProperties(KrollDict d)
	{
		super.processProperties(d);

		TextView tv = (TextView) getNativeView();
		
		boolean needShadow = false;

		// Only accept one, html has priority
		if (d.containsKey(TiC.PROPERTY_HTML)) {
			String html = TiConvert.toString(d, TiC.PROPERTY_HTML);
			if (html == null) {
				//If html is null, set text if applicable
				if (d.containsKey(TiC.PROPERTY_TEXT)) {
					tv.setText(TiConvert.toString(d,TiC.PROPERTY_TEXT));
				} else {
					tv.setText(Html.fromHtml(""));
				}
			} else {
				tv.setMovementMethod(null);
				// Before Jelly Bean (API < 16), disabling the movement method will 
				// disable focusable, clickable and longclickable.
				if (Build.VERSION.SDK_INT < TiC.API_LEVEL_JELLY_BEAN) {
					tv.setFocusable(true);
					tv.setClickable(true);
					tv.setLongClickable(true);
				}
				tv.setText(Html.fromHtml(html));
			}
		} else if (d.containsKey(TiC.PROPERTY_TEXT)) {
			tv.setText(TiConvert.toString(d,TiC.PROPERTY_TEXT), TextView.BufferType.SPANNABLE);
			
		} else if (d.containsKey(TiC.PROPERTY_TITLE)) { // For table view rows
			tv.setText(TiConvert.toString(d,TiC.PROPERTY_TITLE), TextView.BufferType.SPANNABLE);
		}

		if (d.containsKey(TiC.PROPERTY_INCLUDE_FONT_PADDING)) {
			tv.setIncludeFontPadding(TiConvert.toBoolean(d, TiC.PROPERTY_INCLUDE_FONT_PADDING, true));
 		}
 		
		if (d.containsKey(TiC.PROPERTY_MINIMUM_FONT_SIZE)) {
			//it enables font scaling to fit and forces the label content to be limited to a single line.
			minimumFontSize =  TiConvert.toString(d, TiC.PROPERTY_MINIMUM_FONT_SIZE);
			tv.setSingleLine(true);
			tv.setEllipsize(TruncateAt.END);
		}
		if (d.containsKey(TiC.PROPERTY_LINES)) {
			tv.setLines(TiConvert.toInt(d, TiC.PROPERTY_LINES));
		}
		if (d.containsKey(TiC.PROPERTY_MAX_LINES)) {
			tv.setMaxLines(TiConvert.toInt(d, TiC.PROPERTY_MAX_LINES));
		}
		if (d.containsKey(TiC.PROPERTY_LINE_SPACING)) {
			Object value = d.get(TiC.PROPERTY_LINE_SPACING);
			if (value instanceof HashMap) {
				HashMap dict = (HashMap) value;
				tv.setLineSpacing(TiConvert.toFloat(dict.get(TiC.PROPERTY_ADD), 0), TiConvert.toFloat(dict.get(TiC.PROPERTY_MULTIPLY), 0));
			}
		}
		if (d.containsKey(TiC.PROPERTY_COLOR)) {
			Object color = d.get(TiC.PROPERTY_COLOR);
			if (color == null) {
				tv.setTextColor(defaultColor);
			} else {
				tv.setTextColor(TiConvert.toColor(d, TiC.PROPERTY_COLOR));
			}
		}
		if (d.containsKey(TiC.PROPERTY_HIGHLIGHTED_COLOR)) {
			tv.setHighlightColor(TiConvert.toColor(d, TiC.PROPERTY_HIGHLIGHTED_COLOR));
		}
		if (d.containsKey(TiC.PROPERTY_FONT)) {
			if ((d.getKrollDict(TiC.PROPERTY_FONT)).containsKey("fontSize")) {
				propertySetFontSize = TiConvert.toString(d.getKrollDict(TiC.PROPERTY_FONT), "fontSize");
			}
			TiUIHelper.styleText(tv, d.getKrollDict(TiC.PROPERTY_FONT));
		}
		if (d.containsKey(TiC.PROPERTY_TEXT_ALIGN) || d.containsKey(TiC.PROPERTY_VERTICAL_ALIGN)) {
			String textAlign = d.optString(TiC.PROPERTY_TEXT_ALIGN, "left");
			String verticalAlign = d.optString(TiC.PROPERTY_VERTICAL_ALIGN, "middle");
			TiUIHelper.setAlignment(tv, textAlign, verticalAlign);
		}

		if (d.containsKey(TiC.PROPERTY_ELLIPSIZE)) {
			
			Object value = d.get(TiC.PROPERTY_ELLIPSIZE);
			if (value instanceof Boolean){
				ellipsize = (Boolean) value ? TruncateAt.END : null;
			}

			if (value instanceof Integer){
				switch((Integer)value){
					case UIModule.TEXT_ELLIPSIZE_TRUNCATE_START: 
						ellipsize = TruncateAt.START; break;
					case UIModule.TEXT_ELLIPSIZE_TRUNCATE_MIDDLE: 
						ellipsize = TruncateAt.MIDDLE; break;
					case UIModule.TEXT_ELLIPSIZE_TRUNCATE_END: 
						ellipsize = TruncateAt.END; break;
					case UIModule.TEXT_ELLIPSIZE_TRUNCATE_MARQUEE: 
						// marquee effect only works in single line mode
						tv.setSingleLine(true);
						tv.setSelected(true);
						ellipsize = TruncateAt.MARQUEE; break;
					default:
						ellipsize = null;
				}
			}
			tv.setEllipsize(ellipsize);
		}

		if (d.containsKey(TiC.PROPERTY_WORD_WRAP)) {
			wordWrap = TiConvert.toBoolean(d, TiC.PROPERTY_WORD_WRAP, true);
			tv.setSingleLine(!wordWrap);
		}

		if (d.containsKey(TiC.PROPERTY_SHADOW_OFFSET)) {
			Object value = d.get(TiC.PROPERTY_SHADOW_OFFSET);
			if (value instanceof HashMap) {
				needShadow = true;
				HashMap dict = (HashMap) value;
				shadowX = TiConvert.toFloat(dict.get(TiC.PROPERTY_X), 0);
				shadowY = TiConvert.toFloat(dict.get(TiC.PROPERTY_Y), 0);
			}
		}
		if (d.containsKey(TiC.PROPERTY_SHADOW_RADIUS)) {
			needShadow = true;
			shadowRadius = TiConvert.toFloat(d.get(TiC.PROPERTY_SHADOW_RADIUS), DEFAULT_SHADOW_RADIUS);
		}
		if (d.containsKey(TiC.PROPERTY_SHADOW_COLOR)) {
			needShadow = true;
			shadowColor = TiConvert.toColor(d, TiC.PROPERTY_SHADOW_COLOR);
		}
		if (needShadow) {
			tv.setShadowLayer(shadowRadius, shadowX, shadowY, shadowColor);
		}
		if (d.containsKey(TiC.PROPERTY_ATTRIBUTED_STRING)) {
			Object attributedString = d.get(TiC.PROPERTY_ATTRIBUTED_STRING);
			if (attributedString instanceof AttributedStringProxy) {
				Spannable spannableText = AttributedStringProxy.toSpannable(((AttributedStringProxy)attributedString), TiApplication.getAppCurrentActivity());
				if (spannableText != null) {
					tv.setText(spannableText, TextView.BufferType.NORMAL);
				}
			}
		}
		// This needs to be the last operation.
		TiUIHelper.linkifyIfEnabled(tv, d.get(TiC.PROPERTY_AUTO_LINK));
		tv.invalidate();
	}
	
	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		TextView tv = (TextView) getNativeView();
		if (key.equals(TiC.PROPERTY_HTML)) {
			tv.setText(Html.fromHtml(TiConvert.toString(newValue)));
			TiUIHelper.linkifyIfEnabled(tv, proxy.getProperty(TiC.PROPERTY_AUTO_LINK));
			tv.requestLayout();
		} else if (key.equals(TiC.PROPERTY_TEXT) || key.equals(TiC.PROPERTY_TITLE)) {
			tv.setText(TiConvert.toString(newValue));
			TiUIHelper.linkifyIfEnabled(tv, proxy.getProperty(TiC.PROPERTY_AUTO_LINK));
			tv.requestLayout();
		} else if (key.equals(TiC.PROPERTY_INCLUDE_FONT_PADDING)) {
			tv.setIncludeFontPadding(TiConvert.toBoolean(newValue, true));
		} else if (key.equals(TiC.PROPERTY_COLOR)) {
			if (newValue == null) {
				tv.setTextColor(defaultColor);
			} else {
				tv.setTextColor(TiConvert.toColor((String) newValue));
			}
		} else if (key.equals(TiC.PROPERTY_HIGHLIGHTED_COLOR)) {
			tv.setHighlightColor(TiConvert.toColor((String) newValue));
		} else if (key.equals(TiC.PROPERTY_TEXT_ALIGN)) {
			TiUIHelper.setAlignment(tv, TiConvert.toString(newValue), null);
			tv.requestLayout();
		} else if (key.equals(TiC.PROPERTY_VERTICAL_ALIGN)) {
			TiUIHelper.setAlignment(tv, null, TiConvert.toString(newValue));
			tv.requestLayout();
		} else if (key.equals(TiC.PROPERTY_MINIMUM_FONT_SIZE)) {
			minimumFontSize = TiConvert.toString(newValue);
			tv.setSingleLine(true);
			tv.setEllipsize(TruncateAt.END);
			tv.requestLayout();
		} else if (key.equals(TiC.PROPERTY_FONT)) {
			if (((HashMap) newValue).containsKey("fontSize")) {
				propertySetFontSize = TiConvert.toString(((HashMap) newValue), "fontSize");
			}
			TiUIHelper.styleText(tv, (HashMap) newValue);
			tv.requestLayout();
		} else if (key.equals(TiC.PROPERTY_ELLIPSIZE)) {
			if (newValue instanceof Boolean){
				ellipsize = (Boolean) newValue ? TruncateAt.END : null;
			}
			if (newValue instanceof Integer){
				switch((Integer)newValue){
					case UIModule.TEXT_ELLIPSIZE_TRUNCATE_START: 
						ellipsize = TruncateAt.START; break;
					case UIModule.TEXT_ELLIPSIZE_TRUNCATE_MIDDLE: 
						ellipsize = TruncateAt.MIDDLE; break;
					case UIModule.TEXT_ELLIPSIZE_TRUNCATE_END: 
						ellipsize = TruncateAt.END; break;
					case UIModule.TEXT_ELLIPSIZE_TRUNCATE_MARQUEE: 
						// marquee effect only works in single line mode
						tv.setSingleLine(true);
						tv.setSelected(true);
						ellipsize = TruncateAt.MARQUEE; break;
					default:
						ellipsize = null;
				}
			}
			tv.setEllipsize(ellipsize);
		} else if (key.equals(TiC.PROPERTY_WORD_WRAP)) {
			wordWrap = TiConvert.toBoolean(newValue, true);
			tv.setSingleLine(!wordWrap);
		} else if (key.equals(TiC.PROPERTY_AUTO_LINK)) {
			Linkify.addLinks(tv, TiConvert.toInt(newValue));
		} else if (key.equals(TiC.PROPERTY_SHADOW_OFFSET)) {
			if (newValue instanceof HashMap) {
				HashMap dict = (HashMap) newValue;
				shadowX = TiConvert.toFloat(dict.get(TiC.PROPERTY_X), 0);
				shadowY = TiConvert.toFloat(dict.get(TiC.PROPERTY_Y), 0);
				tv.setShadowLayer(shadowRadius, shadowX, shadowY, shadowColor);
			}
		} else if (key.equals(TiC.PROPERTY_SHADOW_RADIUS)) {
			shadowRadius = TiConvert.toFloat(newValue, DEFAULT_SHADOW_RADIUS);
			tv.setShadowLayer(shadowRadius, shadowX, shadowY, shadowColor);
		} else if (key.equals(TiC.PROPERTY_SHADOW_COLOR)) {
			shadowColor = TiConvert.toColor(TiConvert.toString(newValue));
			tv.setShadowLayer(shadowRadius, shadowX, shadowY, shadowColor);
		} else if (key.equals(TiC.PROPERTY_LINES)) {
			tv.setLines(TiConvert.toInt(newValue));
		} else if (key.equals(TiC.PROPERTY_MAX_LINES)) {
			tv.setMaxLines(TiConvert.toInt(newValue));	
		} else if (key.equals(TiC.PROPERTY_ATTRIBUTED_STRING) && newValue instanceof AttributedStringProxy) {
			Spannable spannableText = AttributedStringProxy.toSpannable(((AttributedStringProxy)newValue), TiApplication.getAppCurrentActivity());
			if (spannableText != null) {
				tv.setText(spannableText, TextView.BufferType.NORMAL);
			}
		} else if (key.equals(TiC.PROPERTY_LINE_SPACING)) {
			if (newValue instanceof HashMap) {
				HashMap dict = (HashMap) newValue;
				tv.setLineSpacing(TiConvert.toFloat(dict.get(TiC.PROPERTY_ADD), 0), TiConvert.toFloat(dict.get(TiC.PROPERTY_MULTIPLY), 0));
			}
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	public void setClickable(boolean clickable) {
		((TextView)getNativeView()).setClickable(clickable);
	}
}
