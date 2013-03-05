package ti.modules.titanium.ui.widget.listview;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiCompositeLayout.LayoutParams;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.UIModule;

import android.view.View;
import android.widget.ImageView;

public class TiListItem extends TiUIView {

	View listItemLayout;
	public TiListItem(TiViewProxy proxy) {
		super(proxy);
	}

	public TiListItem(TiViewProxy proxy, LayoutParams p, View v, View item_layout) {
		super(proxy);
		layoutParams = p;
		listItemLayout = item_layout;
		setNativeView(v);	
	}
	
	public void processProperties(KrollDict d) {
		
		if (d.containsKey(TiC.PROPERTY_ITEM_ID)) {
			String itemId = TiConvert.toString(d, TiC.PROPERTY_ITEM_ID);
			if (itemId != null && additionalEventData != null) {
				additionalEventData.put(TiC.PROPERTY_ITEM_ID, itemId);
			}
		} 
		
		if (d.containsKey(TiC.PROPERTY_ACCESSORY_TYPE)) {
			int accessory = TiConvert.toInt(d.get(TiC.PROPERTY_ACCESSORY_TYPE), -1);
			handleAccessory(accessory);
		} 
		
		super.processProperties(d);
	}

	private void handleAccessory(int accessory) {
		ImageView accessoryImage = (ImageView) listItemLayout.findViewById(TiListView.accessory);
		switch(accessory) {
		
		case UIModule.LIST_ACCESSORY_TYPE_CHECKMARK:
			accessoryImage.setImageResource(TiListView.isCheck);
			break;
		case UIModule.LIST_ACCESSORY_TYPE_DETAIL:
			accessoryImage.setImageResource(TiListView.hasChild);
			break;
		
	    default:
	    	accessoryImage.setImageResource(0);
		}
	}
	
}
