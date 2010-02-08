package ti.modules.titanium.ui.widget;

import org.appcelerator.titanium.view.TiUIView;
import org.appcelerator.titanium.view.TiViewProxy;
import org.appcelerator.titanium.view.TitaniumCompositeLayout;

public class TiView extends TiUIView {

	public TiView(TiViewProxy proxy) {
		super(proxy);

		setNativeView(new TitaniumCompositeLayout(proxy.getContext()));
	}

}
