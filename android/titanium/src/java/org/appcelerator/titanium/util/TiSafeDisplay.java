package org.appcelerator.titanium.util;

import android.os.Handler;
import android.os.Looper;
import android.view.Display;
import android.view.View;

import java.util.concurrent.atomic.AtomicBoolean;

public class TiSafeDisplay
{
	private static final long DISPLAY_WAIT_TIMEOUT_MS = 5000;

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

		Handler handler = new Handler(Looper.getMainLooper());
		AtomicBoolean completed = new AtomicBoolean();
		class DisplayListener implements View.OnAttachStateChangeListener
		{
			private final Runnable timeout = () -> complete(false);

			private void complete(boolean available)
			{
				if (!completed.compareAndSet(false, true)) {
					return;
				}
				view.removeOnAttachStateChangeListener(this);
				handler.removeCallbacks(timeout);
				callback.onDisplayAvailable(available);
			}

			@Override
			public void onViewAttachedToWindow(View v)
			{
				/**
				 * It's rare that a display is not available even at this stage.
				 * Since `getDisplay()` returns null, send a boolean to make proper decisions.
				 */
				complete(v.getDisplay() != null);
			}

			@Override
			public void onViewDetachedFromWindow(View v)
			{
				complete(false);
			}
		}

		DisplayListener listener = new DisplayListener();
		view.addOnAttachStateChangeListener(listener);
		handler.postDelayed(listener.timeout, DISPLAY_WAIT_TIMEOUT_MS);
		if (view.getDisplay() != null) {
			listener.complete(true);
		}
	}
}
