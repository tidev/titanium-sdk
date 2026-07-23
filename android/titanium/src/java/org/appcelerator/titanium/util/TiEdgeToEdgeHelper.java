/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import android.app.Activity;
import android.content.Intent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.tabgroup.TiUIBottomNavigation;
import ti.modules.titanium.ui.widget.tabgroup.TiUIBottomNavigationTabGroup;
import ti.modules.titanium.ui.widget.tabgroup.TiUITabLayoutTabGroup;

/**
 * Applies edge-to-edge window handling, required as of Android 15 (API 35) where the
 * "windowOptOutEdgeToEdgeEnforcement" theme attribute is ignored.
 * <p>
 * Because the window opts out of decor fitting, the platform no longer honors
 * SOFT_INPUT_ADJUST_RESIZE and no longer keeps content clear of the system bars or the
 * display cutout. This helper reproduces that behavior by padding the content frame.
 */
public class TiEdgeToEdgeHelper
{
	private TiEdgeToEdgeHelper()
	{
	}

	public static void enable(Activity activity)
	{
		Window window = activity.getWindow();

		// Enable edge-to-edge drawing.
		WindowCompat.setDecorFitsSystemWindows(window, false);

		View content = activity.findViewById(android.R.id.content);
		if (content == null) {
			return;
		}

		// Determine which edges the window's view already handles itself, so we don't inset twice.
		// Note: Material's BottomNavigationView applies its own bottom inset, and the TabLayout
		//       style draws its tab bar beneath the status bar by design.
		boolean isBottomNavigation = false;
		boolean isTabLayout = false;

		// Titanium's "extendSafeArea" property asks for content to be drawn beneath the system
		// bars, with the app positioning its own views via Ti.UI.Window.safeAreaPadding.
		// Note: Read this from the intent, the same way TiBaseActivity.onCreate() does. We cannot
		//       infer it from getLayout().getFitsSystemWindows(), because a TabGroup may have
		//       already replaced the activity's layout with one of its own. TiUIBottomNavigation
		//       does exactly that via TiBaseActivity.setLayout().
		boolean extendSafeArea = false;
		Intent intent = activity.getIntent();
		if (intent != null) {
			extendSafeArea = intent.getBooleanExtra(TiC.PROPERTY_EXTEND_SAFE_AREA, false);
		}

		if (activity instanceof TiBaseActivity tiActivity) {
			TiViewProxy windowProxy = tiActivity.getWindowProxy();
			if (windowProxy != null) {
				TiUIView view = windowProxy.peekView();
				if (view instanceof TiUIBottomNavigation || view instanceof TiUIBottomNavigationTabGroup) {
					isBottomNavigation = true;
				} else if (view instanceof TiUITabLayoutTabGroup) {
					isTabLayout = true;
				}
			}
		}

		final boolean useBottomNavigation = isBottomNavigation;
		final boolean useTabLayout = isTabLayout;
		final boolean useExtendSafeArea = extendSafeArea;

		// Preserve any padding the content frame was given before we start managing it.
		final int basePaddingLeft = content.getPaddingLeft();
		final int basePaddingTop = content.getPaddingTop();
		final int basePaddingRight = content.getPaddingRight();
		final int basePaddingBottom = content.getPaddingBottom();

		ViewCompat.setOnApplyWindowInsetsListener(content, (v, insets) -> {
			// The display cutout is not part of systemBars(). The Titanium themes request
			// LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES, so in landscape the notch would
			// otherwise overlap content.
			Insets bars = insets.getInsets(
				WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());

			int left = basePaddingLeft;
			int top = basePaddingTop;
			int right = basePaddingRight;
			int bottom = basePaddingBottom;

			// When "extendSafeArea" is set, the app draws beneath the bars on purpose. Leave the
			// system bar insets alone; the app reads them back via safeAreaPadding.
			if (!useExtendSafeArea) {
				left += bars.left;
				right += bars.right;
				if (!useTabLayout) {
					top += bars.top;
				}
				if (!useBottomNavigation) {
					bottom += bars.bottom;
				}
			}

			// Reproduce SOFT_INPUT_ADJUST_RESIZE, which the platform ignores once the window has
			// opted out of decor fitting. This applies even under "extendSafeArea" since the
			// keyboard would otherwise cover input fields. Honor the window's requested mode so
			// that adjustPan/adjustNothing still behave as the app asked.
			if (isResizingForSoftInput(window)) {
				int imeBottom = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom;
				bottom = Math.max(bottom, basePaddingBottom + imeBottom);
			}

			v.setPadding(left, top, right, bottom);
			return insets;
		});
	}

	/**
	 * Determines if the window wants its content resized to make room for the soft keyboard.
	 * @param window The window to check. Can be null.
	 * @return Returns true if the window's soft input mode resizes content. Returns false for
	 *         "adjustPan" and "adjustNothing", where the app has opted out of resizing.
	 */
	private static boolean isResizingForSoftInput(Window window)
	{
		if (window == null) {
			return false;
		}
		int adjustMode = window.getAttributes().softInputMode
			& WindowManager.LayoutParams.SOFT_INPUT_MASK_ADJUST;
		return (adjustMode == WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)
			|| (adjustMode == WindowManager.LayoutParams.SOFT_INPUT_ADJUST_UNSPECIFIED);
	}
}
