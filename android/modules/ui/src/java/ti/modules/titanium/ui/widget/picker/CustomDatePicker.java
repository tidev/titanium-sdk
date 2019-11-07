package ti.modules.titanium.ui.widget.picker;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiUIHelper;

import android.content.Context;
import android.util.AttributeSet;
import android.widget.DatePicker;

public class CustomDatePicker extends DatePicker
{

	private TiViewProxy proxy = null;

	public void setProxy(TiViewProxy value)
	{
		this.proxy = value;
	}

	public CustomDatePicker(Context context)
	{
		super(context);
	}

	public CustomDatePicker(Context context, AttributeSet attrs)
	{
		super(context, attrs);
	}

	public CustomDatePicker(Context context, AttributeSet attrs, int defStyleAttr)
	{
		super(context, attrs, defStyleAttr);
	}

	@Override
	protected void onLayout(boolean changed, int left, int top, int right, int bottom)
	{
		super.onLayout(changed, left, top, right, bottom);
		if (this.proxy != null && changed) {
			TiUIHelper.firePostLayoutEvent(this.proxy);
		} else {
			Log.w("Picker", "Proxy not assigned to a native view!");
		}
	}
}
