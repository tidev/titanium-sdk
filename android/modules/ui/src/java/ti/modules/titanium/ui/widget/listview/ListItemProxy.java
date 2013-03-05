package ti.modules.titanium.ui.widget.listview;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.UIModule;
import android.app.Activity;

@Kroll.proxy(creatableInModule = UIModule.class)
public class ListItemProxy extends TiViewProxy {

	
	public TiUIView createView(Activity activity) {
		return new TiListItem(this);
	}

}
