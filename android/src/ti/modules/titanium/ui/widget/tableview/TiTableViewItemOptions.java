package ti.modules.titanium.ui.widget.tableview;

import java.util.HashMap;

import org.appcelerator.titanium.TiDict;

public class TiTableViewItemOptions extends HashMap<String, String>
{
	private static final long serialVersionUID = 1L;
	private static final int INITIAL = 10;

	public TiTableViewItemOptions() {
		this(INITIAL);
	}

	public TiTableViewItemOptions(int initialCapacity) {
		super(initialCapacity);
	}

	public String resolveOption(String key, TiDict ... items) {

		String value = get(key);

		for(TiDict item : items) {
			if (item != null && item.containsKey(key)) {
				value = item.getString(key);
				break;
			}
		}
		return value;
	}

	public int resolveIntOption(String key, TiDict ... items) {
		String value = resolveOption(key, items);
		return value == null ? -1 : Integer.parseInt(value);
	}

	public int getIntOption(String key) {
		String value = get(key);
		return value == null ? -1 : Integer.parseInt(value);
	}
}
