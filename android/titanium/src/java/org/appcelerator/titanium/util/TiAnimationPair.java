/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import android.view.animation.Animation;
import android.view.animation.Animation.AnimationListener;
import android.widget.ViewAnimator;

public class TiAnimationPair
{
	Animation in;
	Animation out;

	public void apply(ViewAnimator layout)
	{
		layout.setInAnimation(in);
		layout.setOutAnimation(out);
	}

	public void setAnimationListener(AnimationListener listener)
	{
		in.setAnimationListener(listener);
	}
}
