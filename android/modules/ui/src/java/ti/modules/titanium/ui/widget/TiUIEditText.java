package ti.modules.titanium.ui.widget;

import android.content.Context;
import android.os.Build;
import android.util.AttributeSet;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.ViewGroup;
import android.widget.EditText;

public class TiUIEditText extends EditText {

	public TiUIEditText(Context context, AttributeSet attributeSet) {
		super(context, attributeSet);
	}

	@Override
	public boolean onKeyPreIme(int keyCode, KeyEvent event) {
		// TIMOB-23757: https://code.google.com/p/android/issues/detail?id=182191
		if (Build.VERSION.SDK_INT < 24 && (getGravity() & Gravity.LEFT) != Gravity.LEFT && keyCode == KeyEvent.KEYCODE_BACK) {
			ViewGroup view = (ViewGroup) getParent();
			view.setFocusableInTouchMode(true);
			view.requestFocus();
		}
		return super.onKeyPreIme(keyCode, event);
	}
}