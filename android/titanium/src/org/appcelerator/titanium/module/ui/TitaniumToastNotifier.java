package org.appcelerator.titanium.module.ui;



import android.os.Handler;
import android.util.Config;
import android.view.View;
import android.webkit.WebView;
import android.widget.Toast;

public class TitaniumToastNotifier extends TitaniumNotifier
{
	@SuppressWarnings("unused")
	private static final String LCAT = "TiToastNotifier";
	@SuppressWarnings("unused")
	private static final boolean DBG = Config.LOGD;

	protected Toast toast;

	public TitaniumToastNotifier(Handler handler, WebView webView) {
		super(handler, webView);
	}

	private int getToastDelay() {
		return getDelay() > 0 ? Toast.LENGTH_LONG : Toast.LENGTH_SHORT;
	}
	@Override
	public void show(boolean animate, boolean autohide)
	{
		final View view = getWebView().get();
		if (view != null) {
			if (toast == null) {
				toast = Toast.makeText(view.getContext(), getMessage(), getToastDelay());
			} else {
				toast.setText(getMessage());
				toast.setDuration(getToastDelay());
			}
		}

		view.post(new Runnable()
		{
			public void run()
			{
				toast.show();
			}
		});
	}

	public void hide(boolean animate) {
		if (toast != null && showing) {
			View view = getWebView().get();
			if (view != null) {
				view.post(new Runnable(){

					public void run() {
						toast.cancel();
					}
				});
			}
		}
	}
}
