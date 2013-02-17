package ti.modules.titanium.ui.widget.listview;

import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

public class TiListCell extends TiUIView {

	private TiBaseListViewItem listItem;
	public TiListCell(TiViewProxy proxy) {
		super(proxy);
	}

	public TiListCell(TiBaseListViewItem item) {
		super(null);
		listItem = item;
		setNativeView(listItem);
	}
}
