package ti.modules.titanium.ui.widget.picker;

import android.app.DatePickerDialog;
import android.content.Context;
import android.content.DialogInterface;

public class TiDatePickerDialog extends DatePickerDialog {

	public TiDatePickerDialog(Context context, 
			OnDateSetListener callBack,
			int year,
			int monthOfYear,
			int dayOfMonth) {
		super(context, callBack, year, monthOfYear, dayOfMonth);
	}

	@Override
	public void onClick(DialogInterface dialog, int which) {
		// Only allow pressing the positive button to call super.onClick()
		// which will call tryNotifyDataSet();
		if (which == DialogInterface.BUTTON_POSITIVE) {
			super.onClick(dialog, which);
		}
	}

	@Override
	protected void onStop() {
		// super.OnStop() calls tryNotifyDateSet(). This behavior causes picker
		// to call onDateSet() even when we are dismissing this and not selecting
		// a date. Hence, overriding this.
		// https://code.google.com/p/android/issues/detail?id=34833
	}

}
