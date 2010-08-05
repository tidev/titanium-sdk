/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.kroll.KrollCallback;
import org.appcelerator.titanium.view.Ti2DMatrix;
import org.appcelerator.titanium.view.TiAnimation;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiCompositeLayout.LayoutParams;

import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.view.animation.AlphaAnimation;
import android.view.animation.Animation;
import android.view.animation.AnimationSet;
import android.view.animation.RotateAnimation;
import android.view.animation.ScaleAnimation;
import android.view.animation.TranslateAnimation;

public class TiAnimationBuilder
{
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
	
	protected TiAnimation animationProxy;

	protected KrollCallback callback;
	protected boolean relayoutChild = false;
	protected TiDict options;
	protected View view;
	
	public TiAnimationBuilder()
	{
		// Defaults
		anchorX = 0.5;
		anchorY = 0.5;
	}

	public void applyOptions(TiDict options)
	{
		if (options == null) {
			return;
		}

		if (options.containsKey("anchorPoint")) {
			TiDict point = (TiDict) options.get("anchorPoint");
			anchorX = TiConvert.toDouble(point, "x");
			anchorY = TiConvert.toDouble(point, "y");
		}

		if (options.containsKey("transform")) {
			tdm = (Ti2DMatrix) options.get("transform");
		}
		if (options.containsKey("delay")) {
			delay = TiConvert.toDouble(options, "delay");
		}
		if (options.containsKey("duration")) {
			duration = TiConvert.toDouble(options, "duration");
		}
		if (options.containsKey("opacity")) {
			toOpacity = TiConvert.toDouble(options, "opacity");
			fromOpacity = 1.0 - toOpacity;
		}
		if (options.containsKey("repeat")) {
			repeat = TiConvert.toDouble(options, "repeat");
		}
		if (options.containsKey("autoreverse")) {
			autoreverse = TiConvert.toBoolean(options, "autoreverse");
		}
		if (options.containsKey("top")) {
			top = TiConvert.toInt(options, "top");
		}
		if (options.containsKey("bottom")) {
			bottom = TiConvert.toInt(options, "bottom");
		}
		if (options.containsKey("left")) {
			left = TiConvert.toInt(options, "left");
		}
		if (options.containsKey("right")) {
			right = TiConvert.toInt(options, "right");
		}
		
		this.options = options;
	}

	public void applyAnimation(TiAnimation anim) {
		this.animationProxy = anim;
		applyOptions(anim.getDynamicProperties());
	}

	public void setCallback(KrollCallback callback) {
		this.callback = callback;
	}

	public AnimationSet render(View view)
	{
		ViewParent parent = view.getParent();
		int parentWidth = 0, parentHeight = 0;
		if (parent instanceof ViewGroup) {
			ViewGroup group = (ViewGroup) parent;
			parentHeight = group.getMeasuredHeight();
			parentWidth = group.getMeasuredWidth();
		}
		return render(view, view.getLeft(), view.getTop(), view.getMeasuredWidth(), view.getMeasuredHeight(), parentWidth, parentHeight);
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

	public AnimationSet render(View view, int x, int y, int w, int h, int parentWidth, int parentHeight)
	{
		float anchorPointX = (float)((w * anchorX));
		float anchorPointY = (float)((h * anchorY));
		this.view = view;
		AnimationSet as = new AnimationSet(false);

		if (toOpacity != null) {
			Animation a = new AlphaAnimation(fromOpacity.floatValue(), toOpacity.floatValue());
			addAnimation(as,a);
		}

		if (tdm != null) {
			as.setFillAfter(true);
			as.setFillEnabled(true);
			if (tdm.hasRotation()) {
				Animation a = new RotateAnimation(0,tdm.getRotation(), anchorPointX, anchorPointY);
				addAnimation(as, a);
			}
			if (tdm.hasScaleFactor()) {
				Animation a = new ScaleAnimation(1, tdm.getScaleFactor(), 1, tdm.getScaleFactor(), anchorPointX, anchorPointY);
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
		
		AnimationListener listener = new AnimationListener();
		if (top != null || bottom != null || left != null || right != null) {
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
			
			Log.d("ANIMATE", "animate from (" + x + ", " + y + ") to (" + horizontal[0] + ", " + vertical[0] + ")");
			relayoutChild = true;
		}

		if (callback != null || animationProxy != null) {
			as.setAnimationListener(listener);
		}

		return as;
	}
	
	protected class AnimationListener implements Animation.AnimationListener {
		@Override
		public void onAnimationEnd(Animation a)
		{
			if (callback != null) {
				callback.call();
			}
			if (animationProxy != null) {
				animationProxy.fireEvent("complete", null);
			}
			if (relayoutChild) {
				LayoutParams params = (LayoutParams) view.getLayoutParams();
				TiConvert.fillLayout(options, params);
				view.setLayoutParams(params);
				view.clearAnimation();
				relayoutChild = false;
			}
			view = null;
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
