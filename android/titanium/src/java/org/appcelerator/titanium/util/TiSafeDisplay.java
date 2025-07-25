package org.appcelerator.titanium.util;

import android.view.Display;
import android.view.View;

public class TiSafeDisplay
{
	public interface DisplayCallback {
		void onDisplayAvailable(Boolean isDisplayAvailable);
	}

	public static void getDisplaySafely(View view, DisplayCallback callback)
	{
		if (view == null || callback == null) return;

		if (view.isAttachedToWindow()) {
			Display display = view.getDisplay();
			if (display != null) {
				callback.onDisplayAvailable(true);
				return;
			}
		}

		view.addOnAttachStateChangeListener(new View.OnAttachStateChangeListener() {
			@Override
			public void onViewAttachedToWindow(View v)
			{
				v.removeOnAttachStateChangeListener(this);

				/**
				 * It's rare that a display is not available even at this stage.
				 * Since `getDisplay()` returns null, send a boolean to make proper decisions.
				 */
				callback.onDisplayAvailable(v.getDisplay() != null);
			}

			@Override
			public void onViewDetachedFromWindow(View v)
			{
				v.removeOnAttachStateChangeListener(this);
			}
		});
	}
}
