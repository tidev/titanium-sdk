package ti.modules.titanium.ui.widget.picker;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;

import android.util.Log;
import android.app.TimePickerDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.widget.NumberPicker;
import android.widget.TimePicker;

public class TiTimePickerDialog extends TimePickerDialog {

	private int TIME_PICKER_INTERVAL = 1;
	private static final String TAG = "TiTimePickerDialog";
	
	public TiTimePickerDialog(Context context, 
			OnTimeSetListener callBack,
			int hourOfDay,
			int minute,
			boolean is24HourView) {
		super(context, callBack, hourOfDay, minute, is24HourView);
	}
	
	public TiTimePickerDialog(Context context, 
			int theme,
			OnTimeSetListener callBack,
			int hourOfDay,
			int minute,
			boolean is24HourView) {
		super(context, theme, callBack, hourOfDay, minute, is24HourView);
	}
	
	public void setMinuteInterval(int interval){
		TIME_PICKER_INTERVAL = interval;
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

	@Override
	public void onAttachedToWindow() {
		super.onAttachedToWindow();
		if (TIME_PICKER_INTERVAL != 1) {
			try {
				Class<?> classForid = Class
						.forName("com.android.internal.R$id");
				Field timePickerField = classForid.getField("timePicker");
				TimePicker timePicker = (TimePicker) findViewById(timePickerField
						.getInt(null));
				Field field = classForid.getField("minute");

				NumberPicker mMinuteSpinner = (NumberPicker) timePicker
						.findViewById(field.getInt(null));
				mMinuteSpinner.setMinValue(0);
				mMinuteSpinner.setMaxValue((60 / TIME_PICKER_INTERVAL) - 1);
				List<String> displayedValues = new ArrayList<String>();
				for (int i = 0; i < 60; i += TIME_PICKER_INTERVAL) {
					displayedValues.add(String.format("%02d", i));
				}
				mMinuteSpinner.setDisplayedValues(displayedValues
						.toArray(new String[0]));
			} catch (Exception e) {
				Log.e(TAG, e.getMessage());
			}
		}
	}
}
