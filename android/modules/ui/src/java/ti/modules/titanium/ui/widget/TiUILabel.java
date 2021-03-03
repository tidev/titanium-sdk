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
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.UIModule;
import ti.modules.titanium.ui.AttributedStringProxy;
import android.graphics.Color;
import android.text.Html;
import android.text.Layout;
import android.text.Selection;
import android.text.Spannable;
import android.text.SpannableStringBuilder;
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
	private static final float FONT_SIZE_EPSILON = 0.1f;

	private int defaultColor;
	private TruncateAt ellipsize = TruncateAt.END;
	private float shadowRadius = DEFAULT_SHADOW_RADIUS;
	private float shadowX = 0f;
	private float shadowY = 0f;
	private int shadowColor = Color.TRANSPARENT;
	private int autoLinkFlags;
	private int viewHeightInLines;
	private int maxLines = Integer.MAX_VALUE;
	private float minimumFontSizeInPixels = -1.0f;
	private float unscaledFontSizeInPixels = -1.0f;
	private CharSequence originalText = "";
	private boolean isInvalidationAndLayoutsEnabled = true;

	public TiUILabel(final TiViewProxy proxy)
	{
		super(proxy);
		Log.d(TAG, "Creating a text label", Log.DEBUG_MODE);
		TextView tv = new TextView(getProxy().getActivity()) {
			@Override
			protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec)
			{
				// Only allow label to exceed width of parent if single-line and ellipsize is disabled.
				if (isSingleLineMode() && (ellipsize == null) && (minimumFontSizeInPixels < FONT_SIZE_EPSILON)
					&& (layoutParams != null) && (layoutParams.optionWidth == null) && !layoutParams.autoFillsWidth) {
					widthMeasureSpec =
						MeasureSpec.makeMeasureSpec(MeasureSpec.getSize(widthMeasureSpec), MeasureSpec.UNSPECIFIED);
					heightMeasureSpec =
						MeasureSpec.makeMeasureSpec(MeasureSpec.getSize(heightMeasureSpec), MeasureSpec.UNSPECIFIED);
				}

				super.onMeasure(widthMeasureSpec, heightMeasureSpec);
			}

			@Override
			protected void onLayout(boolean changed, int left, int top, int right, int bottom)
			{
				// Update this view's layout.
				super.onLayout(changed, left, top, right, bottom);

				// Auto-downscale the font to fit the view's width, if enabled.
				adjustTextFontSize(this);

				// Apply ellipsis if enabled and if view has fixed height (ie: not sized to fit text).
				if (!isSingleLineMode() && (viewHeightInLines <= 0) && (ellipsize != null) && (layoutParams != null)
					&& ((layoutParams.optionHeight != null) || layoutParams.autoFillsHeight)) {
					// First, we must reset/re-measure the text based on the original max lines setting.
					// Note: Calling onMeasure() updates the view's StaticLayout and its getLineCount().
					isInvalidationAndLayoutsEnabled = false; // Suppress invalidate() and requestLayout().
					setMaxLines((TiUILabel.this.maxLines > 0) ? TiUILabel.this.maxLines : Integer.MAX_VALUE);
					isInvalidationAndLayoutsEnabled = true;
					int measuredWidth = MeasureSpec.makeMeasureSpec(right - left, MeasureSpec.EXACTLY);
					int measuredHeight = MeasureSpec.makeMeasureSpec(bottom - top, MeasureSpec.EXACTLY);
					onMeasure(measuredWidth, measuredHeight);

					// Calculate the number of "fully" visible lines within the TextView.
					// Note: We can't assume all lines have the same height since we support stylized
					//       spannable text via the "html" and "attributedString" properties.
					int visibleLines = 0;
					Layout layout = getLayout();
					if (layout != null) {
						int maxY = getHeight() - (getTotalPaddingTop() + getTotalPaddingBottom());
						if (maxY > 0) {
							int lineCount = layout.getLineCount();
							for (int lineIndex = 0; lineIndex < lineCount; lineIndex++) {
								if (layout.getLineTop(lineIndex + 1) > maxY) {
									break;
								}
								visibleLines++;
							}
						}
					} else {
						visibleLines = Integer.MAX_VALUE;
					}

					// The only way to apply ellipsis on Android is via the TextView's max lines setting.
					// Also, make sure new setting doesn't exceed Titanium's "maxLines" property, if set.
					int maxLines = Math.max(visibleLines, 1);
					if (TiUILabel.this.maxLines > 0) {
						maxLines = Math.min(maxLines, TiUILabel.this.maxLines);
					}
					isInvalidationAndLayoutsEnabled = false; // Suppress invalidate() and requestLayout().
					setMaxLines(maxLines);
					isInvalidationAndLayoutsEnabled = true;
					onMeasure(measuredWidth, measuredHeight);
				}

				// Fire a "postLayout" event in Titanium.
				if (proxy != null && proxy.hasListeners(TiC.EVENT_POST_LAYOUT)) {
					proxy.fireEvent(TiC.EVENT_POST_LAYOUT, null, false);
				}
			}

			@Override
			public void invalidate()
			{
				if (isInvalidationAndLayoutsEnabled) {
					super.invalidate();
				}
			}

			@Override
			public void requestLayout()
			{
				if (isInvalidationAndLayoutsEnabled) {
					super.requestLayout();
				}
			}

			@Override
			public boolean onTouchEvent(MotionEvent event)
			{
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
						if (layout != null) {
							int line = layout.getLineForVertical(y);
							int off = layout.getOffsetForHorizontal(line, x);

							ClickableSpan[] link = buffer.getSpans(off, off, ClickableSpan.class);

							if (link.length != 0) {
								ClickableSpan cSpan = link[0];
								if (action == MotionEvent.ACTION_UP) {
									TiViewProxy proxy = getProxy();
									if (proxy.hasListeners("link") && (cSpan instanceof URLSpan)) {
										KrollDict evnt = new KrollDict();
										evnt.put("url", ((URLSpan) cSpan).getURL());
										proxy.fireEvent("link", evnt, false);
									} else {
										cSpan.onClick(textView);
									}
								} else if (action == MotionEvent.ACTION_DOWN) {
									Selection.setSelection(buffer, buffer.getSpanStart(cSpan),
														   buffer.getSpanEnd(cSpan));
								}
							}
						}
					}
				}
				return super.onTouchEvent(event);
			}
		};
		tv.setGravity(Gravity.CENTER_VERTICAL | Gravity.LEFT);
		tv.setPadding(0, 0, 0, 0);
		tv.setFocusable(false);
		tv.setEllipsize(this.ellipsize);
		tv.setSingleLine(false);
		TiUIHelper.styleText(tv, null);
		this.unscaledFontSizeInPixels = tv.getTextSize();
		this.defaultColor = tv.getCurrentTextColor();
		setNativeView(tv);
	}

	/**
	 * Method used to decrease the fontsize of the text to fit the width
	 * fontsize should be >= than the property minimumFontSize
	 * @param view
	 */
	private void adjustTextFontSize(View view)
	{
		// Do not continue if auto-sizing the font is disabled.
		if (this.minimumFontSizeInPixels < FONT_SIZE_EPSILON) {
			return;
		}

		// Make sure the given view is a TextView.
		if ((view instanceof TextView) == false) {
			return;
		}
		TextView textView = (TextView) view;

		// Fetch the display's density scale and calculate pixel's per virtual point, rounded up.
		// Note: To keep it simple, don't let the scale be below 1x.
		//       Only obsolete "ldpi" devices use scales lower than this.
		float densityScale = view.getResources().getDisplayMetrics().density;
		if (densityScale <= 0) {
			densityScale = 1.0f;
		}

		// Calculate the pixel width within the view that the text will be rendered to.
		float viewContentWidth;
		{
			int value = textView.getWidth();
			{
				// Exlude the view's padding and borders.
				value -= textView.getTotalPaddingLeft() + textView.getTotalPaddingRight();
			}
			if ((this.layoutParams != null) && (this.layoutParams.optionWidth != null)
				&& !layoutParams.autoFillsWidth) {
				// Shave off 1 dp (device-independent pixel) from the width.
				// This prevents ellipsis from being applied for text that just-fits within the view.
				// Note: We don't want to do this if the view is auto-sized to fit its text
				//       because the font/text might shrink on every call to onLayout() method.
				int pixelsPerPoint = (int) Math.ceil((double) densityScale); // Round up.
				value -= pixelsPerPoint;
			}
			if (value <= 0) {
				return;
			}
			viewContentWidth = (float) value;
		}

		// Fetch the view's text.
		String text = null;
		if (textView.getText() != null) {
			text = textView.getText().toString();
		}
		if ((text == null) || (text.length() <= 0)) {
			return;
		}

		// Restore the view's original font size.
		float previousFontSize = textView.getTextSize();
		textView.setTextSize(android.util.TypedValue.COMPLEX_UNIT_PX, this.unscaledFontSizeInPixels);

		// Automatically downscale the font size to fit the width of the view.
		// Note: Downscaling text width-wise is inaccurate and may take a few attempts.
		while (true) {
			// Fetch the view's current font size. Do not continue if already below the min.
			float currentFontSize = textView.getTextSize();
			if (currentFontSize < (this.minimumFontSizeInPixels + FONT_SIZE_EPSILON)) {
				break;
			}

			// Fetch the view's painting object.
			// Note: Font settings applied to the view will be applied to this paint object as well.
			TextPaint textPaint = textView.getPaint();
			if (textPaint == null) {
				break;
			}

			// Calculate the width of the view's current text in pixels.
			float textWidth = textPaint.measureText(text);

			// Do not continue if the text fits within the view's bounds. (Don't need to downscale.)
			if (textWidth <= viewContentWidth) {
				break;
			}

			// Text does not fit within the width of view. Downscale the font.
			float newFontSize = (viewContentWidth / textWidth) * currentFontSize;

			// Don't let the font scale up. Can happen due to inaccuracies with above calculation.
			// If it has, then downscale the font by 1dp (aka: device-independed point).
			// Note: This also prevents an infinite loop by guaranteeing to downscale by at least 1dp.
			newFontSize = Math.min(newFontSize, currentFontSize - densityScale);

			// Don't allow the font size to exceed the configured minimum.
			newFontSize = Math.max(newFontSize, this.minimumFontSizeInPixels);

			// Apply the downscaled font size to the view.
			textView.setTextSize(android.util.TypedValue.COMPLEX_UNIT_PX, newFontSize);
		}

		// If the view's font size has changed, then the view's height has changed. Request a re-layout.
		if (Math.abs(textView.getTextSize() - previousFontSize) >= FONT_SIZE_EPSILON) {
			final View finalView = view;
			view.post(new Runnable() {
				@Override
				public void run()
				{
					finalView.requestLayout();
				}
			});
		}
	}

	@Override
	public void processProperties(KrollDict d)
	{
		super.processProperties(d);

		TextView tv = (TextView) getNativeView();

		boolean needShadow = false;

		// Update the label's text, if provided.
		{
			// Fetch text from one of the supported properties. (Order is important.)
			CharSequence newText = null;
			boolean hasProperty = false;
			if (d.containsKey(TiC.PROPERTY_ATTRIBUTED_STRING)) {
				hasProperty = true;
				Object attributedString = d.get(TiC.PROPERTY_ATTRIBUTED_STRING);
				if (attributedString instanceof AttributedStringProxy) {
					newText = AttributedStringProxy.toSpannable(((AttributedStringProxy) attributedString),
																TiApplication.getAppCurrentActivity());
				}
			}
			if ((newText == null) && d.containsKey(TiC.PROPERTY_HTML)) {
				hasProperty = true;
				String html = TiConvert.toString(d, TiC.PROPERTY_HTML);
				if (html != null) {
					newText = Html.fromHtml(html);
				}
			}
			if ((newText == null) && d.containsKey(TiC.PROPERTY_TEXT)) {
				hasProperty = true;
				newText = TiConvert.toString(d.get(TiC.PROPERTY_TEXT));
			}
			if ((newText == null) && d.containsKey(TiC.PROPERTY_TITLE)) {
				hasProperty = true;
				newText = TiConvert.toString(d.get(TiC.PROPERTY_TITLE));
			}

			// Update the stored text if provided and if changed.
			if (hasProperty) {
				if (newText == null) {
					newText = "";
				}
				if (!newText.equals(this.originalText)) {
					this.originalText = newText;
				}
			}
		}

		if (d.containsKey(TiC.PROPERTY_INCLUDE_FONT_PADDING)) {
			tv.setIncludeFontPadding(TiConvert.toBoolean(d, TiC.PROPERTY_INCLUDE_FONT_PADDING, true));
		}

		if (d.containsKey(TiC.PROPERTY_MINIMUM_FONT_SIZE)) {
			setMinimumFontSize(TiConvert.toString(d, TiC.PROPERTY_MINIMUM_FONT_SIZE));
		}
		if (d.containsKey(TiC.PROPERTY_LINES)) {
			this.viewHeightInLines = TiConvert.toInt(d.get(TiC.PROPERTY_LINES), 0);
		}
		if (d.containsKey(TiC.PROPERTY_MAX_LINES)) {
			int value = TiConvert.toInt(d.get(TiC.PROPERTY_MAX_LINES), Integer.MAX_VALUE);
			if (value < 1) {
				value = Integer.MAX_VALUE;
			}
			this.maxLines = value;
		}
		if (d.containsKey(TiC.PROPERTY_LINE_SPACING)) {
			Object value = d.get(TiC.PROPERTY_LINE_SPACING);
			if (value instanceof HashMap) {
				HashMap dict = (HashMap) value;
				tv.setLineSpacing(TiConvert.toFloat(dict.get(TiC.PROPERTY_ADD), 0),
								  TiConvert.toFloat(dict.get(TiC.PROPERTY_MULTIPLY), 0));
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
			TiUIHelper.styleText(tv, d.getKrollDict(TiC.PROPERTY_FONT));
			this.unscaledFontSizeInPixels = tv.getTextSize();
		}
		if (d.containsKey(TiC.PROPERTY_TEXT_ALIGN) || d.containsKey(TiC.PROPERTY_VERTICAL_ALIGN)) {
			String textAlign = d.optString(TiC.PROPERTY_TEXT_ALIGN, "left");
			String verticalAlign = d.optString(TiC.PROPERTY_VERTICAL_ALIGN, "middle");
			TiUIHelper.setAlignment(tv, textAlign, verticalAlign);
		}

		if (d.containsKey(TiC.PROPERTY_ELLIPSIZE)) {
			Object value = d.get(TiC.PROPERTY_ELLIPSIZE);
			if (value instanceof Boolean) {
				ellipsize = (Boolean) value ? TruncateAt.END : null;
			} else if (value instanceof Integer) {
				switch ((Integer) value) {
					case UIModule.TEXT_ELLIPSIZE_TRUNCATE_START:
						ellipsize = TruncateAt.START;
						break;
					case UIModule.TEXT_ELLIPSIZE_TRUNCATE_MIDDLE:
						ellipsize = TruncateAt.MIDDLE;
						break;
					case UIModule.TEXT_ELLIPSIZE_TRUNCATE_END:
						ellipsize = TruncateAt.END;
						break;
					case UIModule.TEXT_ELLIPSIZE_TRUNCATE_MARQUEE:
						ellipsize = TruncateAt.MARQUEE;
						break;
					default:
						ellipsize = null;
				}
			}
		}
		if (d.containsKey(TiC.PROPERTY_AUTO_LINK)) {
			this.autoLinkFlags = TiConvert.toInt(d.get(TiC.PROPERTY_AUTO_LINK), 0) & Linkify.ALL;
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

		// This needs to be the last operation.
		updateLabelText();
		tv.invalidate();
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		TextView tv = (TextView) getNativeView();
		if (key.equals(TiC.PROPERTY_ATTRIBUTED_STRING) || key.equals(TiC.PROPERTY_HTML) || key.equals(TiC.PROPERTY_TEXT)
			|| key.equals(TiC.PROPERTY_TITLE)) {
			CharSequence newText = null;
			if (key.equals(TiC.PROPERTY_ATTRIBUTED_STRING)) {
				if (newValue instanceof AttributedStringProxy) {
					newText = AttributedStringProxy.toSpannable((AttributedStringProxy) newValue,
																TiApplication.getAppCurrentActivity());
				}
				if (newText == null) {
					newText = "";
				}
			} else if (key.equals(TiC.PROPERTY_HTML)) {
				newText = Html.fromHtml(TiConvert.toString(newValue, ""));
			} else {
				newText = TiConvert.toString(newValue, "");
			}
			if ((newText != null) && !newText.equals(this.originalText)) {
				this.originalText = newText;
				updateLabelText();
				tv.requestLayout();
			}
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
			setMinimumFontSize(TiConvert.toString(newValue));
		} else if (key.equals(TiC.PROPERTY_FONT)) {
			TiUIHelper.styleText(tv, (HashMap) newValue);
			this.unscaledFontSizeInPixels = tv.getTextSize();
			tv.requestLayout();
		} else if (key.equals(TiC.PROPERTY_ELLIPSIZE)) {
			if (newValue instanceof Boolean) {
				ellipsize = (Boolean) newValue ? TruncateAt.END : null;
			} else if (newValue instanceof Integer) {
				switch ((Integer) newValue) {
					case UIModule.TEXT_ELLIPSIZE_TRUNCATE_START:
						ellipsize = TruncateAt.START;
						break;
					case UIModule.TEXT_ELLIPSIZE_TRUNCATE_MIDDLE:
						ellipsize = TruncateAt.MIDDLE;
						break;
					case UIModule.TEXT_ELLIPSIZE_TRUNCATE_END:
						ellipsize = TruncateAt.END;
						break;
					case UIModule.TEXT_ELLIPSIZE_TRUNCATE_MARQUEE:
						ellipsize = TruncateAt.MARQUEE;
						break;
					default:
						ellipsize = null;
				}
			}
			updateLabelText();
		} else if (key.equals(TiC.PROPERTY_AUTO_LINK)) {
			this.autoLinkFlags = TiConvert.toInt(newValue, 0) & Linkify.ALL;
			updateLabelText();
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
			this.viewHeightInLines = TiConvert.toInt(newValue, 0);
			updateLabelText();
		} else if (key.equals(TiC.PROPERTY_MAX_LINES)) {
			int value = TiConvert.toInt(newValue, Integer.MAX_VALUE);
			if (value < 1) {
				value = Integer.MAX_VALUE;
			}
			if (value != this.maxLines) {
				this.maxLines = value;
				updateLabelText();
			}
		} else if (key.equals(TiC.PROPERTY_LINE_SPACING)) {
			if (newValue instanceof HashMap) {
				HashMap dict = (HashMap) newValue;
				tv.setLineSpacing(TiConvert.toFloat(dict.get(TiC.PROPERTY_ADD), 0),
								  TiConvert.toFloat(dict.get(TiC.PROPERTY_MULTIPLY), 0));
			}
		} else if (key.equals(TiC.PROPERTY_HEIGHT)) {
			// Update the view's height.
			// Note: We may need to update lines/maxLines settings when switching to an auto-sized height.
			boolean hadFixedSize = (this.layoutParams != null)
								   && ((this.layoutParams.optionHeight != null) || this.layoutParams.autoFillsHeight);
			super.propertyChanged(key, oldValue, newValue, proxy);
			boolean isAutoSized = (this.layoutParams != null) && (this.layoutParams.optionHeight == null)
								  && !this.layoutParams.autoFillsHeight;
			if (hadFixedSize && isAutoSized) {
				updateLabelText();
			}
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	public void setClickable(boolean clickable)
	{
		((TextView) getNativeView()).setClickable(clickable);
	}

	/**
	 * Assigns the given value to this object's "minimumFontSizeInPixels" member variable
	 * and updates the Android "TextView" with the new setting.
	 * <p>
	 * Expected to be called when the JavaScript "minimumFontSize" property has been assigned.
	 * @param stringValue
	 * String providing the font size as a fractional number in non-localized US-English form.
	 * <p>
	 * Can optionally have measurements units appended to this number such as "px", "dp", etc.
	 * If units are not assigned, then the default units assigned to Titanium will be used.
	 * <p>
	 * String can be null or empty, in which case, the min font size setting will be cleared
	 * and the auto-downscaling feature will be disabled.
	 */
	private void setMinimumFontSize(String stringValue)
	{
		// Extract the font size and units (if any) from the given string.
		float newSizeInPixels = -1.0f;
		TiDimension dimension = TiConvert.toTiDimension(stringValue, TiDimension.TYPE_UNDEFINED);
		if (dimension != null) {
			newSizeInPixels = (float) dimension.getPixels(getNativeView());
		}

		// Do not continue if the font size isn't changing.
		if ((newSizeInPixels < FONT_SIZE_EPSILON) && (this.minimumFontSizeInPixels < FONT_SIZE_EPSILON)) {
			return;
		}
		float delta = Math.abs(newSizeInPixels - this.minimumFontSizeInPixels);
		if (delta < FONT_SIZE_EPSILON) {
			return;
		}

		// Store the given setting.
		this.minimumFontSizeInPixels = newSizeInPixels;

		// Update the view with the above change.
		updateLabelText();
	}

	/**
	 * Determines if the Android "TextView" is to be displayed single-line or multiline.
	 * @return Returns true if in single-line mode. Returns false if in multiline mode.
	 */
	private boolean isSingleLineMode()
	{
		// We're single-line if font auto-scaling is enabled.
		if (this.minimumFontSizeInPixels >= FONT_SIZE_EPSILON) {
			return true;
		}

		// We're single-line if using one of the following ellipsis modes.
		// Note: This is an Android limitation. These ellipsis modes are not supported by multiline text.
		if (this.ellipsize != null) {
			switch (this.ellipsize) {
				case START:
				case MIDDLE:
				case MARQUEE:
					return true;
			}
		}

		// The TextView is in multiline mode.
		return false;
	}

	public int getColor()
	{
		TextView tv = (TextView) getNativeView();
		return tv.getCurrentTextColor();
	}

	/**
	 * Updates this object's Android "TextView" with the current member variable settings that affect
	 * how text is displayed, which includes the single-line/multiline and ellipsize related settings.
	 */
	private void updateLabelText()
	{
		// Fetch the text view.
		TextView textView = (TextView) getNativeView();
		if (textView == null) {
			return;
		}

		// Set up the view for single-line/multiline mode and apply text line settings.
		// Note: API call order is important! setSingleLine() method must be called before setLines().
		//       The setMinLines() and setMaxLines() methods must be called last. This is because
		//       the setSingleLine() and setLines() change the TextView's internal min/max line settings.
		boolean isSingleLine = isSingleLineMode();
		boolean isAutoScalingFont = (this.minimumFontSizeInPixels >= FONT_SIZE_EPSILON);
		boolean isTrimmingNewlines = isAutoScalingFont;
		textView.setSingleLine(isSingleLine);
		if (this.viewHeightInLines > 0) {
			textView.setLines(this.viewHeightInLines);
		} else {
			textView.setMinLines(0);
		}
		if (isSingleLine) {
			textView.setMaxLines(1);
		} else {
			int value = (this.maxLines > 0) ? this.maxLines : 1;
			if ((this.viewHeightInLines > 0) && (value > this.viewHeightInLines)) {
				value = this.viewHeightInLines;
			}
			textView.setMaxLines(value);
		}

		// Fetch the text to be displayed in the view.
		CharSequence text = this.originalText;
		if (text == null) {
			text = new SpannableStringBuilder("");
		}

		// If set up to be single-line, then trim off any text proceeding a newline character, if any.
		// Note: We do this to match iOS' behavior. Android's default behavior is to replace '\n' with spaces.
		if (isTrimmingNewlines && (text.length() > 0)) {
			// Find the first line ending character in the string.
			int index;
			for (index = 0; index < text.length(); index++) {
				char nextCharacter = text.charAt(index);
				if ((nextCharacter == '\r') || (nextCharacter == '\n')) {
					break;
				}
			}

			// If a line ending was found, then create a new substring with extra lines trimmed off.
			// Note: Create a Spannable substring. This is in case we were given a Spannable type such as
			//       HTML or AttributedString so that we can preserve the text styles applied to its characters.
			if (index < text.length()) {
				text = new SpannableStringBuilder(text, 0, index);
			}
		}

		// Convert the given text to a "Spannable" derived type, if not already done.
		// Reasons:
		// 1) Works-around bug with some Samsung Android forks where calling TextView.setEnable(false)
		//    will cause a crash if the text is not of type Spannable. (See: TIMOB-16911)
		// 2) Ellipsis modes START and MIDDLE only work reliably with text types String and Spannable.
		if ((text instanceof Spannable) == false) {
			text = new SpannableStringBuilder(text);
		}

		// If auto-link is enabled, then scan the text for links and apply URLSpans to it.
		// Note: This must be done after the text has been turned into a Spannable up above.
		if (this.autoLinkFlags != 0) {
			Linkify.addLinks((Spannable) text, this.autoLinkFlags);
		}

		// Update the text view's ellipsize feature.
		TruncateAt updatedEllipsizeType = this.ellipsize;
		if (textView.getMovementMethod() != null) {
			// Android doesn't support start/middle ellipsis when a MovementMethod is configured.
			// If this is what's configured, then use "end" ellipsis mode instead.
			if ((updatedEllipsizeType == TruncateAt.START) || (updatedEllipsizeType == TruncateAt.MIDDLE)) {
				updatedEllipsizeType = TruncateAt.END;
			}
		}
		textView.setEllipsize(updatedEllipsizeType);
		if (updatedEllipsizeType == TruncateAt.MARQUEE) {
			textView.setSelected(true); // Start the marquee animation.
		}

		// Update the view's text.
		textView.setText(text, TextView.BufferType.NORMAL);
		textView.requestLayout();
	}
}
