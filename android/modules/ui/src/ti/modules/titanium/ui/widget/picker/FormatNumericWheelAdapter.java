package ti.modules.titanium.ui.widget.picker;

import java.text.NumberFormat;

import kankan.wheel.widget.NumericWheelAdapter;

public class FormatNumericWheelAdapter extends NumericWheelAdapter
{
	private NumberFormat formatter;
	private int maxCharacterLength = 2;
	
	public FormatNumericWheelAdapter(int minValue, int maxValue, NumberFormat formatter, int maxCharLength)
	{
		super(minValue, maxValue);
		this.formatter = formatter;
		this.maxCharacterLength = maxCharLength;
	}
	public void setFormatter(NumberFormat formatter) {
		this.formatter = formatter;
	}
	@Override
	public String getItem(int index)
	{
		if (formatter == null) {
			return Integer.toString(getMinValue() + index);
		} else {
			return formatter.format(getMinValue() + index);
		}
	}
	@Override
	public int getMaximumLength()
	{
		return maxCharacterLength;
	}
	
	public void setMaximumLength(int value) 
	{
		maxCharacterLength = value;
	}
}
