package ti.modules.titanium.ui;

import java.util.ArrayList;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;

public class PickerColumnProxy extends TiProxy {
	
	private final static ArrayList<PickerRowProxy> rows =
		new ArrayList<PickerRowProxy>(); 
	
	public PickerColumnProxy(TiContext tiContext) {
		super(tiContext);	
	}
	
	public void addRow(PickerRowProxy row){
		rows.add(row);		
	}
	
	public ArrayList<PickerRowProxy> getRows() {
		return rows;
	}

}
