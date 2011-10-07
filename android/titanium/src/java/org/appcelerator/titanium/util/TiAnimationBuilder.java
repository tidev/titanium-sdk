/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiConfig;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.Ti2DMatrix;
import org.appcelerator.titanium.view.TiAnimation;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;
import org.appcelerator.titanium.view.TiCompositeLayout.LayoutParams;

import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Rect;
import android.graphics.RectF;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.view.animation.AlphaAnimation;
import android.view.animation.Animation;
import android.view.animation.AnimationSet;
import android.view.animation.LinearInterpolator;
import android.view.animation.Transformation;
import android.view.animation.TranslateAnimation;


public class TiAnimationBuilder
{
	private static final String LCAT = "TiAnimationBuilder";
	private static final boolean DBG = TiConfig.LOGD;
	
	protected float anchorX;
	protected float anchorY;
	protected Ti2DMatrix tdm = null;
	protected Double delay = null;
	protected Double duration = null;
	protected Double toOpacity = null;
	protected Double fromOpacity = null;
	protected Double repeat = null;
	protected Boolean autoreverse = null;
	protected Integer top = null, bottom = null, left = null, right = null;
	protected Integer centerX = null, centerY = null;
	protected Integer width = null, height = null;
	protected Integer backgroundColor = null;
	protected TiAnimation animationProxy;
	protected KrollFunction callback;
	protected boolean relayoutChild = false, applyOpacity = false;
	protected KrollDict options;
	protected View view;
	protected TiViewProxy viewProxy;


	public TiAnimationBuilder() 
	{
		anchorX = Ti2DMatrix.DEFAULT_ANCHOR_VALUE;
		anchorY = Ti2DMatrix.DEFAULT_ANCHOR_VALUE;
	}

	public void applyOptions(HashMap optionsMap)
	{
		if (optionsMap == null) {
			return;
		}

		// TODO this sucks, fix it (don't construct a KrollDict, solve the problem)
		KrollDict options = new KrollDict(optionsMap);
		if (options.containsKey(TiC.PROPERTY_ANCHOR_POINT)) {
			KrollDict point = (KrollDict) options.get(TiC.PROPERTY_ANCHOR_POINT);
			anchorX = TiConvert.toFloat(point, TiC.PROPERTY_X);
			anchorY = TiConvert.toFloat(point, TiC.PROPERTY_Y);
		}

		if (options.containsKey(TiC.PROPERTY_TRANSFORM)) {
			tdm = (Ti2DMatrix) options.get(TiC.PROPERTY_TRANSFORM);
		}
		if (options.containsKey(TiC.PROPERTY_DELAY)) {
			delay = TiConvert.toDouble(options, TiC.PROPERTY_DELAY);
		}
		if (options.containsKey(TiC.PROPERTY_DURATION)) {
			duration = TiConvert.toDouble(options, TiC.PROPERTY_DURATION);
		}
		if (options.containsKey(TiC.PROPERTY_OPACITY)) {
			toOpacity = TiConvert.toDouble(options, TiC.PROPERTY_OPACITY);
		}
		if (options.containsKey(TiC.PROPERTY_REPEAT)) {
			repeat = TiConvert.toDouble(options, TiC.PROPERTY_REPEAT);
		}
		if (options.containsKey(TiC.PROPERTY_AUTOREVERSE)) {
			autoreverse = TiConvert.toBoolean(options, TiC.PROPERTY_AUTOREVERSE);
		}
		if (options.containsKey(TiC.PROPERTY_TOP)) {
			top = TiConvert.toInt(options, TiC.PROPERTY_TOP);
		}
		if (options.containsKey(TiC.PROPERTY_BOTTOM)) {
			bottom = TiConvert.toInt(options, TiC.PROPERTY_BOTTOM);
		}
		if (options.containsKey(TiC.PROPERTY_LEFT)) {
			left = TiConvert.toInt(options, TiC.PROPERTY_LEFT);
		}
		if (options.containsKey(TiC.PROPERTY_RIGHT)) {
			right = TiConvert.toInt(options, TiC.PROPERTY_RIGHT);
		}
		if (options.containsKey(TiC.PROPERTY_CENTER)) {
			KrollDict center = options.getKrollDict(TiC.PROPERTY_CENTER);
			if (center != null) {
				centerX = TiConvert.toInt(center, TiC.PROPERTY_X);
				centerY = TiConvert.toInt(center, TiC.PROPERTY_Y);
			}
		}
		if (options.containsKey(TiC.PROPERTY_WIDTH)) {
			width = TiConvert.toInt(options, TiC.PROPERTY_WIDTH);
		}
		if (options.containsKey(TiC.PROPERTY_HEIGHT)) {
			height = TiConvert.toInt(options, TiC.PROPERTY_HEIGHT);
		}
		if (options.containsKey(TiC.PROPERTY_BACKGROUND_COLOR)) {
			backgroundColor = TiConvert.toColor(options, TiC.PROPERTY_BACKGROUND_COLOR);
		}
		
		this.options = options;
	}

	public void applyAnimation(TiAnimation anim)
	{
		this.animationProxy = anim;
		applyOptions(anim.getProperties());
	}

	public void setCallback(KrollFunction callback)
	{
		this.callback = callback;
	}

	public AnimationSet render(TiViewProxy viewProxy, View view)
	{
		ViewParent parent = view.getParent();
		int parentWidth = 0;
		int parentHeight = 0;

		if (parent instanceof ViewGroup) {
			ViewGroup group = (ViewGroup) parent;
			parentHeight = group.getMeasuredHeight();
			parentWidth = group.getMeasuredWidth();
		}

		return render(viewProxy, view, view.getLeft(), view.getTop(), view.getMeasuredWidth(), view.getMeasuredHeight(), parentWidth, parentHeight);
	}

	private void addAnimation(AnimationSet animationSet, Animation animation)
	{
		if (repeat != null) {
			animation.setRepeatCount(repeat.intValue());
		}

		if (autoreverse != null) {
			if (autoreverse) {
				animation.setRepeatMode(Animation.REVERSE);

			} else {
				animation.setRepeatMode(Animation.RESTART);
			}
		}

		animationSet.addAnimation(animation);
	}

	public TiMatrixAnimation createMatrixAnimation(Ti2DMatrix matrix)
	{
		return new TiMatrixAnimation(matrix, anchorX, anchorY);
	}

	public AnimationSet render(TiViewProxy viewProxy, View view, int x, int y, int w, int h, int parentWidth, int parentHeight)
	{
		this.view = view;
		this.viewProxy = viewProxy;
		
		AnimationSet as = new AnimationSet(false);
		AnimationListener animationListener = new AnimationListener();
		
		if (toOpacity != null) {
			if (viewProxy.hasProperty(TiC.PROPERTY_OPACITY)) {
				fromOpacity = TiConvert.toDouble(viewProxy.getProperty(TiC.PROPERTY_OPACITY));

			} else {
				fromOpacity = 1.0 - toOpacity;
			}
			
			Animation animation = new AlphaAnimation(fromOpacity.floatValue(), toOpacity.floatValue());
			applyOpacity = true;
			addAnimation(as, animation);
			animation.setAnimationListener(animationListener);
			
			TiUIView uiView = viewProxy.peekView();
			if (viewProxy.hasProperty(TiC.PROPERTY_OPACITY) && fromOpacity != null && toOpacity != null
				&& uiView != null) {
				// Initialize the opacity to 1 when we are going to change it in
				// the animation. If the opacity of the view was initialized to
				// 0, the animation doesn't work
				uiView.setOpacity(1);
			}
		}
		
		if (backgroundColor != null) {
			if (viewProxy.hasProperty(TiC.PROPERTY_BACKGROUND_COLOR)) {
				int fromBackgroundColor = TiConvert.toColor(TiConvert.toString(viewProxy.getProperty(TiC.PROPERTY_BACKGROUND_COLOR)));
				Animation a = new TiColorAnimation(view, fromBackgroundColor, backgroundColor);
				addAnimation(as, a);
			} else {
				Log.w(LCAT, "Cannot animate backgroundColor. View doesn't have that property.");
			}
		}

		if (tdm != null) {
			animationSet.setFillAfter(true);
			animationSet.setFillEnabled(true);
			TiMatrixAnimation matrixAnimation = new TiMatrixAnimation(tdm, anchorX, anchorY);

			if (duration != null) {
				matrixAnimation.setDuration(duration.longValue());
			}

			addAnimation(animationSet, matrixAnimation);
		}

		// Set duration after adding children.
		if (duration != null) {
			animationSet.setDuration(duration.longValue());
		}
		if (delay != null) {
			animationSet.setStartOffset(delay.longValue());
		}
		
		// ignore translate/resize if we have a matrix.. we need to eventually collect to/from properly
		if (top != null || bottom != null || left != null || right != null || centerX != null || centerY != null) {
			TiDimension optionTop = null, optionBottom = null;
			TiDimension optionLeft = null, optionRight = null;
			TiDimension optionCenterX = null, optionCenterY = null;
			
			if (top != null) {
				optionTop = new TiDimension(top, TiDimension.TYPE_TOP);
			}
			if (bottom != null) {
				optionBottom = new TiDimension(bottom, TiDimension.TYPE_BOTTOM);
			}
			if (left != null) {
				optionLeft = new TiDimension(left, TiDimension.TYPE_LEFT);
			}
			if (right != null) {
				optionRight = new TiDimension(right, TiDimension.TYPE_RIGHT);
			}
			if (centerX != null) {
				optionCenterX = new TiDimension(centerX, TiDimension.TYPE_CENTER_X);
			}
			if (centerY != null) {
				optionCenterY = new TiDimension(centerY, TiDimension.TYPE_CENTER_Y);
			}
			
			int horizontal[] = new int[2];
			int vertical[] = new int[2];
			ViewParent parent = view.getParent();
			View parentView = null;

			if (parent instanceof View) {
				parentView = (View) parent;
			}

			//TODO: center
			TiCompositeLayout.computePosition(parentView, optionLeft, optionCenterX, optionRight, w, 0, parentWidth, horizontal);
			TiCompositeLayout.computePosition(parentView, optionTop, optionCenterY, optionBottom, h, 0, parentHeight, vertical);
			
			Animation animation = new TranslateAnimation(Animation.RELATIVE_TO_SELF, 0, Animation.ABSOLUTE, horizontal[0]-x,
				Animation.RELATIVE_TO_SELF, 0, Animation.ABSOLUTE, vertical[0]-y);
			animation.setFillEnabled(true);
			animation.setFillAfter(true);

			if (duration != null) {
				animation.setDuration(duration.longValue());
			}

			animationSet.setFillEnabled(true);
			animationSet.setFillAfter(true);
			animation.setAnimationListener(animationListener);
			animationSet.addAnimation(animation);

			if (DBG) {
				Log.d(LCAT, "animate " + viewProxy + " relative to self: " + (horizontal[0]-x) + ", " + (vertical[0]-y));
			}

			relayoutChild = true;
		}

		if (tdm == null && (width != null || height != null)) {
			// we need to setup a custom animation for this, is there a better way?
			int toWidth = width == null ? w : width;
			int toHeight = height == null ? h : height;
			SizeAnimation sizeAnimation = new SizeAnimation(view, w, h, toWidth, toHeight);

			if (duration != null) {
				sizeAnimation.setDuration(duration.longValue());
			}

			sizeAnimation.setInterpolator(new LinearInterpolator());
			sizeAnimation.setAnimationListener(animationListener);
			animationSet.addAnimation(sizeAnimation);

			relayoutChild = true;
		}
		
		if (callback != null || animationProxy != null) {
			animationSet.setAnimationListener(animationListener);
		}

		return animationSet;
	}
	
	protected class SizeAnimation extends Animation
	{
		protected View view;
		protected float fromWidth, fromHeight, toWidth, toHeight;
		protected static final String LCAT = "TiSizeAnimation";


		public SizeAnimation(View view, float fromWidth, float fromHeight, float toWidth, float toHeight)
		{
			this.view = view;
			this.fromWidth = fromWidth;
			this.fromHeight = fromHeight;
			this.toWidth = toWidth;
			this.toHeight = toHeight;

			if (DBG) {
				Log.d(LCAT, "animate view from (" + fromWidth + "x" + fromHeight + ") to (" + toWidth + "x" + toHeight + ")");
			}
		}
		
		@Override
		protected void applyTransformation(float interpolatedTime, Transformation transformation)
		{
			super.applyTransformation(interpolatedTime, transformation);
			
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
				tiParams.optionHeight = new TiDimension(height, TiDimension.TYPE_HEIGHT);
				tiParams.optionWidth = new TiDimension(width, TiDimension.TYPE_WIDTH);
			}

			view.setLayoutParams(params);
		}
	}

	public static class TiMatrixAnimation extends Animation
	{
		protected Ti2DMatrix matrix;
		protected int childWidth, childHeight;
		protected float anchorX = -1, anchorY = -1;

		public boolean interpolate = true;


		public TiMatrixAnimation(Ti2DMatrix matrix, float anchorX, float anchorY)
		{
			this.matrix = matrix;
			this.anchorX = anchorX;
			this.anchorY = anchorY;
		}

		@Override
		public void initialize(int width, int height, int parentWidth, int parentHeight)
		{
			super.initialize(width, height, parentWidth, parentHeight);
			this.childWidth = width;
			this.childHeight = height;
		}

		@Override
		protected void applyTransformation(float interpolatedTime, Transformation transformation)
		{
			super.applyTransformation(interpolatedTime, transformation);
			if (interpolate) {
				Matrix m = matrix.interpolate(interpolatedTime, childWidth, childHeight, anchorX, anchorY);
				transformation.getMatrix().set(m);

			} else {
				transformation.getMatrix().set(getFinalMatrix(childWidth, childHeight));
			}
		}

		public Matrix getFinalMatrix(int childWidth, int childHeight)
		{
			return matrix.interpolate(1.0f, childWidth, childHeight, anchorX, anchorY);
		}

		public void invalidateWithMatrix(View view)
		{
			int width = view.getWidth();
			int height = view.getHeight();
			Matrix m = getFinalMatrix(width, height);
			RectF rectF = new RectF(0, 0, width, height);
			m.mapRect(rectF);
			rectF.inset(-1.0f, -1.0f);
			Rect rect = new Rect();
			rectF.round(rect);

			if (view.getParent() instanceof ViewGroup) {
				int left = view.getLeft();
				int top = view.getTop();

				((ViewGroup)view.getParent()).invalidate(left + rect.left, top + rect.top, left + rect.width(), top + rect.height());
			}
		}
	}
	
	public static class TiColorAnimation extends Animation
	{
		protected View view;
		int fromRed, fromGreen, fromBlue;
		int toRed, toGreen, toBlue;
		int deltaRed, deltaGreen, deltaBlue;
		
		public TiColorAnimation(View view, int fromColor, int toColor) 
		{
			this.view = view;

			fromRed = Color.red(fromColor);
			fromGreen = Color.green(fromColor);
			fromBlue = Color.blue(fromColor);
			
			toRed = Color.red(toColor);
			toGreen = Color.green(toColor);
			toBlue = Color.blue(toColor);
			
			deltaRed = toRed - fromRed;
			deltaGreen = toGreen - fromGreen;
			deltaBlue = toBlue - fromBlue;
			
			view.setDrawingCacheEnabled(true);
		}

		@Override
		protected void applyTransformation(float interpolatedTime, Transformation t) 
		{
			super.applyTransformation(interpolatedTime, t);
				
			int c = Color.rgb(
						fromRed + (int) (deltaRed * interpolatedTime),
						fromGreen + (int) (deltaGreen * interpolatedTime),
						fromBlue + (int) (deltaBlue * interpolatedTime)
					);
			view.setBackgroundColor(c);
		}
	}

	protected class AnimationListener implements Animation.AnimationListener
	{
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
				//There is an android bug where animations still occur after this method. We clear it from the view to correct this.
				view.clearAnimation();
				if (toOpacity.floatValue() == 0) {
					view.setVisibility(View.INVISIBLE);
				} else if (toOpacity.floatValue() == 1) {
					view.setVisibility(View.VISIBLE);

				} else {
					// this is apparently the only way to apply an opacity to the entire view and have it stick
					AlphaAnimation aa = new AlphaAnimation(toOpacity.floatValue(), toOpacity.floatValue());
					aa.setDuration(1);
					aa.setFillAfter(true);
					aa.setFillEnabled(true);
					view.setLayoutParams(view.getLayoutParams());
					view.startAnimation(aa);
				}

				applyOpacity = false;
			}

			if (a instanceof AnimationSet) {
				if (callback != null) {
					callback.callAsync(viewProxy.getKrollObject(), new Object[] { new KrollDict() });
				}

				if (animationProxy != null) {
					animationProxy.fireEvent(TiC.EVENT_COMPLETE, null);
				}
			}
		}

		public void onAnimationRepeat(Animation a) 
		{
		}

		public void onAnimationStart(Animation a)
		{
			if (animationProxy != null) {
				animationProxy.fireEvent(TiC.EVENT_START, null);
			}
		}
	}
}
