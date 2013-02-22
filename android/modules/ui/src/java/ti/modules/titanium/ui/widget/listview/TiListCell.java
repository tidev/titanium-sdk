package ti.modules.titanium.ui.widget.listview;

import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import android.view.View;

public class TiListCell extends TiUIView {

	public TiListCell(TiViewProxy proxy) {
		super(proxy);
	}

	protected void setNativeView (View item) {
		super.setNativeView(item);
	}


}
