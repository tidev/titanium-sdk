package ti.modules.titanium.ui.android.optionmenu;

import java.util.ArrayList;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiProxy;

public class MenuProxy extends TiProxy
{
	protected ArrayList<MenuItemProxy> menuItems;

	public MenuProxy(TiContext tiContext, Object[] args) {
		super(tiContext);
		menuItems = new ArrayList<MenuItemProxy>();
	}

	public void add(MenuItemProxy mip) {
		menuItems.add(mip);
	}

	protected ArrayList<MenuItemProxy> getMenuItems() {
		return menuItems;
	}
}
