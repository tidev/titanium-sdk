/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import android.view.animation.AccelerateDecelerateInterpolator;
import android.view.animation.AlphaAnimation;
import android.view.animation.Animation;
import android.view.animation.AnimationSet;
import android.view.animation.RotateAnimation;
import android.view.animation.ScaleAnimation;
import android.view.animation.TranslateAnimation;

public class TiAnimationFactory
{
	public static TiAnimationPair getAnimationFor(String style, int duration) {
		TiAnimationPair a = new TiAnimationPair();
		boolean needsDuration = true;

		if (style.equals("fade-in")) {
			a.in = new AlphaAnimation(0.0f, 1.0f);
			a.out = new AlphaAnimation(1.0f, 0.0f);
		} else if (style.equals("fade-out")) {
			a.in = new AlphaAnimation(1.0f, 0.0f);
			a.out = new AlphaAnimation(0.0f, 1.0f);
		} else if (style.equals("slide-from-left")) {
			a.in = new TranslateAnimation(
				Animation.RELATIVE_TO_SELF, -1.0f, Animation.RELATIVE_TO_SELF, 0.0f,
				Animation.RELATIVE_TO_SELF, 0.0f, Animation.RELATIVE_TO_SELF, 0.0f);
			a.out = new TranslateAnimation(
				Animation.RELATIVE_TO_SELF, 0.0f, Animation.RELATIVE_TO_SELF, 1.0f,
				Animation.RELATIVE_TO_SELF, 0.0f, Animation.RELATIVE_TO_SELF, 0.0f);
		} else if (style.equals("slide-from-top")) {
			a.in = new TranslateAnimation(
				Animation.RELATIVE_TO_SELF, 0.0f, Animation.RELATIVE_TO_SELF, 0.0f,
				Animation.RELATIVE_TO_PARENT, -1.0f, Animation.RELATIVE_TO_PARENT, 0.0f);
			a.out = new TranslateAnimation(
				Animation.RELATIVE_TO_SELF, 0.0f, Animation.RELATIVE_TO_SELF, 0.0f,
				Animation.RELATIVE_TO_PARENT, 0.0f, Animation.RELATIVE_TO_PARENT, 1.0f);
		} else if (style.equals("slide-from-right")) {
			a.in = new TranslateAnimation(
				Animation.RELATIVE_TO_SELF, 1.0f, Animation.RELATIVE_TO_SELF, 0.0f,
				Animation.RELATIVE_TO_SELF, 0.0f, Animation.RELATIVE_TO_SELF, 0.0f);
			a.out = new TranslateAnimation(
				Animation.RELATIVE_TO_SELF, 0.0f, Animation.RELATIVE_TO_SELF, -1.0f,
				Animation.RELATIVE_TO_SELF, 0.0f, Animation.RELATIVE_TO_SELF, 0.0f);
		} else if (style.equals("slide-from-bottom")) {
			a.in = new TranslateAnimation(
				Animation.RELATIVE_TO_SELF, 0.0f, Animation.RELATIVE_TO_SELF, 0.0f,
				Animation.RELATIVE_TO_PARENT, 1.0f, Animation.RELATIVE_TO_PARENT, 0.0f);
			a.out = new TranslateAnimation(
				Animation.RELATIVE_TO_SELF, 0.0f, Animation.RELATIVE_TO_SELF, 0.0f,
				Animation.RELATIVE_TO_PARENT, 0.0f, Animation.RELATIVE_TO_PARENT, -1.0f);
		} else if (style.equals("scale-in")) {
			a.in = new ScaleAnimation(
				0.0f, 1.0f, 0.0f, 1.0f,
				Animation.RELATIVE_TO_PARENT, 0.5f, Animation.RELATIVE_TO_PARENT, 0.5f);
			a.out = new ScaleAnimation(
				1.0f, 0.0f, 1.0f, 0.0f,
				Animation.RELATIVE_TO_PARENT, 0.5f, Animation.RELATIVE_TO_PARENT, 0.5f);
		} else if (style.equals("wink-in")) {
			needsDuration = false;
			int half = duration/2;

			a.in = new ScaleAnimation(
				0.0f, 1.0f, 0.0f, 1.0f,
				Animation.RELATIVE_TO_PARENT, 0.5f, Animation.RELATIVE_TO_PARENT, 0.5f);
			a.in.setStartOffset(half + (half / 5));
			a.in.setDuration(half);

			a.out = new ScaleAnimation(
				1.0f, 0.0f, 1.0f, 0.0f,
				Animation.RELATIVE_TO_PARENT, 0.5f, Animation.RELATIVE_TO_PARENT, 0.5f);
			a.out.setDuration(half);
		} else if (style.equals("headlines")) {
			needsDuration = false;
			int half = duration/2;
			int pause = half / 5;

			// IN
			AnimationSet as = new AnimationSet(true);
			Animation t = new AlphaAnimation(0.0f, 1.0f);
			t.setDuration(half);
			as.addAnimation(t);

			t = new RotateAnimation(0,-720,
				Animation.RELATIVE_TO_SELF, 0.5f, Animation.RELATIVE_TO_SELF, 0.5f);
			t.setDuration(half);
			as.addAnimation(t);

			t = new ScaleAnimation(
				0.0f, 1.0f, 0.0f, 1.0f,
				Animation.RELATIVE_TO_PARENT, 0.5f, Animation.RELATIVE_TO_PARENT, 0.5f);
			t.setDuration(half);
			as.addAnimation(t);

			a.in = as;
			a.in.setStartOffset(half + pause);

			// OUT
			as = new AnimationSet(true);

			t = new AlphaAnimation(1.0f, 0.0f);
			t.setDuration(half);
			as.addAnimation(t);

			t = new RotateAnimation(0,720,
				Animation.RELATIVE_TO_SELF, 0.5f, Animation.RELATIVE_TO_SELF, 0.5f);
			t.setDuration(half);
			as.addAnimation(t);

			t = new ScaleAnimation(
				1.0f, 0.0f, 1.0f, 0.0f,
				Animation.RELATIVE_TO_PARENT, 0.5f, Animation.RELATIVE_TO_PARENT, 0.5f);
			t.setDuration(half);
			as.addAnimation(t);

			a.out = as;
		}

		if (a != null) {
			if (a.in != null) {
				if (needsDuration) {
					a.in.setDuration(duration);
				}
				a.in.setInterpolator(new AccelerateDecelerateInterpolator());
			}
			if (a.out != null) {
				if (needsDuration) {
					a.out.setDuration(duration);
				}
				a.out.setInterpolator(new AccelerateDecelerateInterpolator());
			}
		}

		return a;
	}
}
