package ti.modules.titanium.ui;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.searchbar.TiUISearchBar;

import android.app.Activity;

public class SearchBarProxy extends TiViewProxy
{

	public SearchBarProxy(TiContext tiContext, Object[] args)
	{
		super(tiContext, args);
	}

	@Override
	public TiUIView createView(Activity activity) {
		return new TiUISearchBar(this);
	}
}
