package ti.modules.titanium.ui.widget;

import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import android.widget.ProgressBar;

public class TiUIProgressBar extends TiUIView {

	public TiUIProgressBar(TiViewProxy proxy)
	{
		super(proxy);
		
		ProgressBar progress = new ProgressBar(proxy.getContext());
		setNativeView(progress);
	}
	
	private ProgressBar getProgressBar()
	{
		return (ProgressBar)getNativeView();
	}
	
	public void handleSetMax(int max)
	{
		//TODO support non-0 min (we need to store an offset)
		getProgressBar().setMax(max);
	}
	
	public void handleSetValue(int value)
	{
		getProgressBar().setProgress(value);
	}
	
	public void handleSetMessage(String message)
	{
	}
}
