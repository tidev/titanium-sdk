package ti.modules.titanium.ui;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;

public class _2DMatrixProxy extends TiProxy
{

	TiDict options;
	Double translateX;
	Double translateY;
	Double scaleFactor;
	Double rotateDegrees;

	public _2DMatrixProxy(TiContext tiContext, Object[] args)
	{
		super(tiContext);
		if (args.length > 0) {
			options = (TiDict) args[0];
		}
	}

	public void translate(double x, double y)
	{
		translateX = x;
		translateY = y;
	}

	public void scale(double scaleFactor) {
		this.scaleFactor = scaleFactor;
	}

	public void rotate(double degrees) {
		this.rotateDegrees = degrees;
	}

	public boolean hasTranslation() {
		return translateX != null;
	}
	public float getXTranslation() {
		return translateX.floatValue();
	}
	public float getYTranslation() {
		return translateY.floatValue();
	}
	public boolean hasScaleFactor() {
		return scaleFactor != null;
	}
	public float getScaleFactor() {
		return scaleFactor.floatValue();
	}
	public boolean hasRotation() {
		return rotateDegrees != null;
	}
	public float getRotation() {
		return rotateDegrees.floatValue();
	}
}
