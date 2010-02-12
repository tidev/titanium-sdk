package ti.modules.titanium.ui;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;

public class _2DMatrixProxy extends TiProxy
{

	TiDict options;

	public _2DMatrixProxy(TiContext tiContext, Object[] args) {
		super(tiContext);
		if (args.length > 0) {
			options = (TiDict) args[0];
		}
	}

	public void translate(double x, double y) {

	}

	public void scale(double scaleFactor) {

	}

	public void rotate(double amount) {

	}
}
