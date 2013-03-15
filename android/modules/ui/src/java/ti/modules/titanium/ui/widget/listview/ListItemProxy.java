/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget.listview;

import java.lang.ref.WeakReference;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.UIModule;
import android.app.Activity;

@Kroll.proxy(creatableInModule = UIModule.class)
public class ListItemProxy extends TiViewProxy {
	protected WeakReference<TiViewProxy> listProxy;
	
	public TiUIView createView(Activity activity) {
		return new TiListItem(this);
	}

	public void setListProxy(TiViewProxy list) {
		listProxy = new WeakReference<TiViewProxy>(list);
	}
	
	public TiViewProxy getListProxy() {
		if (listProxy != null) {
			return listProxy.get();
		}
		return null;
	}

	public void release() {
		super.release();
		if (listProxy != null) {
			listProxy = null;
		}
	}
}
