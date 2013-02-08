package ti.modules.titanium.ui.widget.listview;

import java.util.ArrayList;
import java.util.HashMap;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;

import ti.modules.titanium.ui.LabelProxy;
import ti.modules.titanium.ui.UIModule;
import ti.modules.titanium.ui.ViewProxy;

@Kroll.proxy(creatableInModule = UIModule.class, propertyAccessors = {
	TiC.PROPERTY_HEADER_TITLE
})
public class SectionProxy extends ViewProxy{

	private static final String TAG = "SectionProxy";
	private ArrayList<TiViewProxy> viewProxies;
	private ArrayList<KrollDict> data;
	private int itemCount;
	
	public SectionProxy () {
		//initialize variables
		viewProxies = new ArrayList<TiViewProxy>();
		data = new ArrayList<KrollDict>();
		itemCount = 0;
	}
	
	@Kroll.method
	public void setData(Object data) {
		if (data instanceof Object[]) {
			Object[] views = (Object[]) data;
			int count = views.length;
			itemCount = count;
			for (int i = 0; i < count; i++) {
				Object rowData = views[i];
				if (rowData instanceof HashMap) {
					KrollDict d = new KrollDict((HashMap)rowData);
					processRowData(d);
					this.data.add(d);
				}
			}
		} else {
			Log.e(TAG, "Invalid argument type to setData");
		}
	}
	
	private void processRowData(KrollDict rowData) {
		boolean defaultStyle = true;
		if (rowData.containsKey(TiC.PROPERTY_CELLSTYLE)) {
			//handle cell style
			defaultStyle = false;
		}
		
		if (defaultStyle) {
			LabelProxy labelProxy = new LabelProxy();
			labelProxy.setActivity(getActivity());
			viewProxies.add(labelProxy);
		}
		
	}
	
	public int getItemCount() {
		return itemCount;
	}
	
	public ArrayList<TiViewProxy> getViewProxies() {
		return viewProxies;
	}
	
	public KrollDict getData(int position) {
		if (position < data.size()) {
			return data.get(position);
		} 
		return null;
	}
	
}
