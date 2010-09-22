/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import org.appcelerator.kroll.KrollConverter;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.kroll.KrollCallback;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.Ti2DMatrix;
import org.appcelerator.titanium.view.TiAnimation;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;
import org.appcelerator.titanium.view.TiCompositeLayout.LayoutParams;

import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.view.animation.AlphaAnimation;
import android.view.animation.Animation;
import android.view.animation.AnimationSet;
import android.view.animation.LinearInterpolator;
import android.view.animation.RotateAnimation;
import android.view.animation.ScaleAnimation;
import android.view.animation.Transformation;
import android.view.animation.TranslateAnimation;

public class TiAnimationBuilder
{
	private static final String LCAT = "TiAnimationBuilder";
	
	protected double anchorX;
	protected double anchorY;

	protected Ti2DMatrix tdm = null;
	protected Double delay = null;
	protected Double duration = null;
	protected Double toOpacity = null;
	protected Double fromOpacity = null;
	protected Double repeat = null;
	protected Boolean autoreverse = null;
	protected Integer top = null, bottom = null, left = null, right = null;
	protected Integer width = null, height = null;
	
	protected TiAnimation animationProxy;

	protected KrollCallback callback;
	protected boolean relayoutChild = false, applyOpacity = false;
	protected KrollDict options;
	protected View view;
	protected TiViewProxy viewProxy;
	
	public TiAnimationBuilder()
	{
		// Defaults
		anchorX = 0.5;
		anchorY = 0.5;
	}

	public void applyOptions(KrollDict options)
	{
		if (options == null) {
			return;
		}

		if (options.containsKey("anchorPoint")) {
			KrollDict point = (KrollDict) options.get("anchorPoint");
			anchorX = KrollConverter.toDouble(point, "x");
			anchorY = KrollConverter.toDouble(point, "y");
		}

		if (options.containsKey("transform")) {
			tdm = (Ti2DMatrix) options.get("transform");
		}
		if (options.containsKey("delay")) {
			delay = KrollConverter.toDouble(options, "delay");
		}
		if (options.containsKey("duration")) {
			duration = KrollConverter.toDouble(options, "duration");
		}
		if (options.containsKey("opacity")) {
			toOpacity = KrollConverter.toDouble(options, "opacity");
		}
		if (options.containsKey("repeat")) {
			repeat = KrollConverter.toDouble(options, "repeat");
		}
		if (options.containsKey("autoreverse")) {
			autoreverse = KrollConverter.toBoolean(options, "autoreverse");
		}
		if (options.containsKey("top")) {
			top = KrollConverter.toInt(options, "top");
		}
		if (options.containsKey("bottom")) {
			bottom = KrollConverter.toInt(options, "bottom");
		}
		if (options.containsKey("left")) {
			left = KrollConverter.toInt(options, "left");
		}
		if (options.containsKey("right")) {
			right = KrollConverter.toInt(options, "right");
		}
		if (options.containsKey("width")) {
			width = TiConvert.toInt(options, "width");
		}
		if (options.containsKey("height")) {
			height = TiConvert.toInt(options, "height");
		}
		
		this.options = options;
	}

	public void applyAnimation(TiAnimation anim) {
		this.animationProxy = anim;
		applyOptions(anim.getProperties());
	}

	public void setCallback(KrollCallback callback) {
		this.callback = callback;
	}

	public AnimationSet render(TiViewProxy viewProxy, View view)
	{
		ViewParent parent = view.getParent();
		int parentWidth = 0, parentHeight = 0;
		if (parent instanceof ViewGroup) {
			ViewGroup group = (ViewGroup) parent;
			parentHeight = group.getMeasuredHeight();
			parentWidth = group.getMeasuredWidth();
		}
		return render(viewProxy, view, view.getLeft(), view.getTop(), view.getMeasuredWidth(), view.getMeasuredHeight(), parentWidth, parentHeight);
	}

	private void addAnimation(AnimationSet as, Animation a)
	{
		if (repeat != null) {
			a.setRepeatCount(repeat.intValue());
		}

		if (autoreverse != null) {
			if (autoreverse) {
				a.setRepeatMode(Animation.REVERSE);
			} else {
				a.setRepeatMode(Animation.RESTART);
			}
		}
		as.addAnimation(a);
	}

	public AnimationSet render(TiViewProxy viewProxy, View view, int x, int y, int w, int h, int parentWidth, int parentHeight)
	{
		float anchorPointX = (float)((w * anchorX));
		float anchorPointY = (float)((h * anchorY));
		this.view = view;
		this.viewProxy = viewProxy;
		
		AnimationSet as = new AnimationSet(false);
		AnimationListener listener = new AnimationListener();
		
		if (toOpacity != null) {
			if (viewProxy.hasProperty("opacity")) {
				fromOpacity = TiConvert.toDouble(viewProxy.getProperty("opacity"));
			} else {
				fromOpacity = 1.0 - toOpacity;
			}
			
			Animation a = new AlphaAnimation(fromOpacity.floatValue(), toOpacity.floatValue());
			applyOpacity = true;
			addAnimation(as,a);
			a.setAnimationListener(listener);
			
			if (viewProxy.hasProperty("opacity") && fromOpacity != null && toOpacity != null) {
				if (fromOpacity > 0 && fromOpacity < 1) {
					TiUIView uiView = viewProxy.getView(null);
					uiView.setOpacity(1);
				}
			}
		}

		if (tdm != null) {
			as.setFillAfter(true);
			as.setFillEnabled(true);
			if (tdm.hasRotation()) {
				Animation a = new RotateAnimation(0,tdm.getRotation(), anchorPointX, anchorPointY);
				addAnimation(as, a);
			}
			if (tdm.hasScaleFactor()) {
				Animation a = new ScaleAnimation(tdm.getFromScaleX(), tdm.getToScaleX(), tdm.getFromScaleY(), tdm.getToScaleY(), anchorPointX, anchorPointY);
				if (duration != null) {
					a.setDuration(duration.longValue());
				}
				addAnimation(as, a);
			}
			if (tdm.hasTranslation()) {
				Animation a = new TranslateAnimation(
					0,
					anchorPointX + tdm.getXTranslation(),
					0,
					anchorPointY + tdm.getYTranslation()
					);
				addAnimation(as, a);
			}
		}

		// Set duration after adding children.
		if (duration != null) {
			as.setDuration(duration.longValue());
		}
		if (delay != null) {
			as.setStartOffset(delay.longValue());
		}
		
		// ignore translate/resize if we have a matrix.. we need to eventually collect to/from properly
		if (tdm == null && (top != null || bottom != null || left != null || right != null)) {
			int optionTop = TiCompositeLayout.NOT_SET, optionBottom = TiCompositeLayout.NOT_SET;
			int optionLeft = TiCompositeLayout.NOT_SET, optionRight = TiCompositeLayout.NOT_SET;
			
			if (top != null) {
				optionTop = top;
			}
			if (bottom != null) {
				optionBottom = bottom;
			}
			if (left != null) {
				optionLeft = left;
			}
			if (right != null) {
				optionRight = right;
			}
			
			int horizontal[] = new int[2];
			int vertical[] = new int[2];
			TiCompositeLayout.computePosition(optionLeft, optionRight, w, 0, parentWidth, horizontal);
			TiCompositeLayout.computePosition(optionTop, optionBottom, h, 0, parentHeight, vertical);
			
			Animation a = new TranslateAnimation(Animation.RELATIVE_TO_SELF, 0, Animation.ABSOLUTE, horizontal[0]-x,
				Animation.RELATIVE_TO_SELF, 0, Animation.ABSOLUTE, vertical[0]-y);
			a.setFillEnabled(true);
			a.setFillAfter(true);

			if (duration != null) {
				a.setDuration(duration.longValue());
			}
			as.setFillEnabled(true);
			as.setFillAfter(true);

			a.setAnimationListener(listener);
			as.addAnimation(a);
			
			Log.d(LCAT, "animate " + viewProxy + " relative to self: " + (horizontal[0]-x) + ", " + (vertical[0]-y));
			relayoutChild = true;
		}

		if (tdm == null && (width != null || height != null)) {
			// we need to setup a custom animation for this, is there a better way?
			int toWidth = width == null ? w : width;
			int toHeight = height == null ? h : height;
			SizeAnimation sa = new SizeAnimation(view, w, h, toWidth, toHeight);
			if (duration != null) {
				sa.setDuration(duration.longValue());
			}
			sa.setInterpolator(new LinearInterpolator());
			sa.setAnimationListener(listener);
			as.addAnimation(sa);
			relayoutChild = true;
		}
		
		if (callback != null || animationProxy != null) {
			as.setAnimationListener(listener);
		}

		return as;
	}
	
	protected class SizeAnimation extends Animation {
		protected View view;
		protected float fromWidth, fromHeight, toWidth, toHeight;
		protected static final String LCAT = "TiSizeAnimation";
		
		public SizeAnimation(View view, float fromWidth, float fromHeight, float toWidth, float toHeight) {
			this.view = view;
			this.fromWidth = fromWidth;
			this.fromHeight = fromHeight;
			this.toWidth = toWidth;
			this.toHeight = toHeight;
			Log.d(LCAT, "animate view from ("+fromWidth+"x"+fromHeight+") to ("+toWidth+"x"+toHeight+")");
		}
		
		@Override
		protected void applyTransformation(float interpolatedTime, Transformation t) {
			super.applyTransformation(interpolatedTime, t);
			
			int width = 0;
			if (fromWidth == toWidth) {
				width = (int)fromWidth;
			} else {
				width = (int)Math.floor(fromWidth + ((toWidth - fromWidth) * interpolatedTime));
			}
			int height = 0;
			if (fromHeight == toHeight) {
				height = (int)fromHeight;
			} else {
				height = (int)Math.floor(fromHeight + ((toHeight - fromHeight) * interpolatedTime));
			}
			
			ViewGroup.LayoutParams params = view.getLayoutParams();
			params.width = width;
			params.height = height;
			if (params instanceof TiCompositeLayout.LayoutParams) {
				TiCompositeLayout.LayoutParams tiParams = (TiCompositeLayout.LayoutParams)params;
				tiParams.optionHeight = height;
				tiParams.optionWidth = width;
			}
			view.setLayoutParams(params);
		}
	}
	
	protected class AnimationListener implements Animation.AnimationListener {
		@Override
		public void onAnimationEnd(Animation a)
		{
			if (relayoutChild) {
				LayoutParams params = (LayoutParams) view.getLayoutParams();
				TiConvert.fillLayout(options, params);
				view.setLayoutParams(params);
				view.clearAnimation();
				relayoutChild = false;
			}
			if (applyOpacity) {
				if (toOpacity.floatValue() == 0) {
					view.setVisibility(View. INVISIBLE);
				} else if (toOpacity.floatValue() == 1) {
					view.setVisibility(View.VISIBLE);
				} else {
					// this is apparently the only way to apply an opacity to the entire view and have it stick
					AlphaAnimation aa = new AlphaAnimation(toOpacity.floatValue(), toOpacity.floatValue());
					aa.setDuration(1);
					aa.setFillAfter(true);
					aa.setFillEnabled(true);
					view.startAnimation(aa);
				}
				applyOpacity = false;
			}
			if (callback != null) {
				callback.call();
			}
			if (animationProxy != null) {
				animationProxy.fireEvent("complete", null);
			}
		}

		@Override
		public void onAnimationRepeat(Animation a) {
		}

		@Override
		public void onAnimationStart(Animation a)
		{
			if (animationProxy != null) {
				animationProxy.fireEvent("start", null);
			}
		}
	}
}
