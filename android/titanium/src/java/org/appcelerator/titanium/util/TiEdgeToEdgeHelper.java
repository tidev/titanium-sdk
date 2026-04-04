package org.appcelerator.titanium.util;

import android.app.Activity;
import android.view.View;
import android.view.Window;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

import org.appcelerator.titanium.TiBaseActivity;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.tabgroup.TiUIBottomNavigation;
import ti.modules.titanium.ui.widget.tabgroup.TiUIBottomNavigationTabGroup;
import ti.modules.titanium.ui.widget.tabgroup.TiUITabLayoutTabGroup;

public class TiEdgeToEdgeHelper
{

	public static void enable(Activity activity)
	{

		Window window = activity.getWindow();

		// Enable edge-to-edge drawing
		WindowCompat.setDecorFitsSystemWindows(window, false);

		View content = activity.findViewById(android.R.id.content);

		if (content == null) {
			return;
		}

		boolean isBottomNavigation = false;
		boolean isTabLayout = false;
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

		ViewCompat.setOnApplyWindowInsetsListener(content, (v, insets) -> {
			Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
			int bottomPadding = useBottomNavigation ? 0 : bars.bottom;
			int topPadding = useTabLayout ? 0 : bars.top;
			v.setPadding(bars.left, topPadding, bars.right, bottomPadding);
			return insets;
		});
	}
}
