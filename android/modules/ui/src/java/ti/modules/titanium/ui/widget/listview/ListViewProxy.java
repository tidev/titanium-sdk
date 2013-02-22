package ti.modules.titanium.ui.widget.listview;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.UIModule;
import ti.modules.titanium.ui.ViewProxy;
import android.app.Activity;

@Kroll.proxy(creatableInModule = UIModule.class, propertyAccessors = {
	TiC.PROPERTY_HEADER_TITLE
})
public class ListViewProxy extends ViewProxy {

	public TiUIView createView(Activity activity) {
		return new TiListView(this, activity);
	}

}
