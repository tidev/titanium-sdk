package org.appcelerator.titanium.util;

import android.view.animation.Animation;
import android.widget.ViewAnimator;

public class TitaniumAnimationPair
{
	Animation in;
	Animation out;

	public void apply(ViewAnimator layout) {
		layout.setInAnimation(in);
		layout.setOutAnimation(out);
	}
}
