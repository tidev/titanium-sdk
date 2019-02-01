/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.view;

import java.util.ArrayList;
import java.util.List;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.util.TiConvert;

import android.graphics.Matrix;
import android.util.Pair;

@Kroll.proxy
public class Ti2DMatrix extends KrollProxy
{
	public static final float DEFAULT_ANCHOR_VALUE = -1f;
	public static final float VALUE_UNSPECIFIED = Float.MIN_VALUE;

	protected Ti2DMatrix next, prev;

	public static class Operation
	{
		public static final int TYPE_SCALE = 0;
		public static final int TYPE_TRANSLATE = 1;
		public static final int TYPE_ROTATE = 2;
		public static final int TYPE_MULTIPLY = 3;
		public static final int TYPE_INVERT = 4;

		public float scaleFromX, scaleFromY, scaleToX, scaleToY;
		public float translateX, translateY;
		public float rotateFrom, rotateTo;
		public float anchorX = 0.5f, anchorY = 0.5f;
		public Ti2DMatrix multiplyWith;
		public int type;
		public boolean scaleFromValuesSpecified = false;
		public boolean rotationFromValueSpecified = false;

		public Operation(int type)
		{
			this.type = type;
		}

		public void apply(float interpolatedTime, Matrix matrix, int childWidth, int childHeight, float anchorX,
						  float anchorY)
		{
			anchorX = anchorX == DEFAULT_ANCHOR_VALUE ? this.anchorX : anchorX;
			anchorY = anchorY == DEFAULT_ANCHOR_VALUE ? this.anchorY : anchorY;
			switch (type) {
				case TYPE_SCALE:
					matrix.preScale((interpolatedTime * (scaleToX - scaleFromX)) + scaleFromX,
									(interpolatedTime * (scaleToY - scaleFromY)) + scaleFromY, anchorX * childWidth,
									anchorY * childHeight);
					break;
				case TYPE_TRANSLATE:
					matrix.preTranslate(interpolatedTime * translateX, interpolatedTime * translateY);
					break;
				case TYPE_ROTATE:
					matrix.preRotate((interpolatedTime * (rotateTo - rotateFrom)) + rotateFrom, anchorX * childWidth,
									 anchorY * childHeight);
					break;
				case TYPE_MULTIPLY:
					matrix.preConcat(
						multiplyWith.interpolate(interpolatedTime, childWidth, childHeight, anchorX, anchorY));
					break;
				case TYPE_INVERT:
					matrix.invert(matrix);
					break;
			}
		}
	}

	protected Operation op;

	public Ti2DMatrix()
	{
	}
	protected Ti2DMatrix(Ti2DMatrix prev, int opType)
	{
		if (prev != null) {
			// this.prev represents the previous matrix. This value does not change.
			this.prev = prev;
			// prev.next is not constant. Subsequent calls to Ti2DMatrix() will alter the value of prev.next.
			prev.next = this;
		}
		this.op = new Operation(opType);
	}

	@Override
	public void handleCreationDict(KrollDict dict)
	{
		super.handleCreationDict(dict);
		if (dict.containsKey(TiC.PROPERTY_ROTATE)) {
			op = new Operation(Operation.TYPE_ROTATE);
			op.rotateFrom = 0;
			op.rotateTo = TiConvert.toFloat(dict, TiC.PROPERTY_ROTATE);
			handleAnchorPoint(dict);

			// If scale also specified in creation dict,
			// then we need to link a scaling matrix separately.
			if (dict.containsKey(TiC.PROPERTY_SCALE)) {
				KrollDict newDict = new KrollDict();
				newDict.put(TiC.PROPERTY_SCALE, dict.get(TiC.PROPERTY_SCALE));
				if (dict.containsKey(TiC.PROPERTY_ANCHOR_POINT)) {
					newDict.put(TiC.PROPERTY_ANCHOR_POINT, dict.get(TiC.PROPERTY_ANCHOR_POINT));
				}
				prev = new Ti2DMatrix();
				prev.handleCreationDict(newDict);
				prev.next = this;
			}

		} else if (dict.containsKey(TiC.PROPERTY_SCALE)) {
			op = new Operation(Operation.TYPE_SCALE);
			op.scaleFromX = op.scaleFromY = 1.0f;
			op.scaleToX = op.scaleToY = TiConvert.toFloat(dict, TiC.PROPERTY_SCALE);
			handleAnchorPoint(dict);
		}
	}

	protected void handleAnchorPoint(KrollDict dict)
	{
		if (dict.containsKey(TiC.PROPERTY_ANCHOR_POINT)) {
			KrollDict anchorPoint = dict.getKrollDict(TiC.PROPERTY_ANCHOR_POINT);
			if (anchorPoint != null) {
				op.anchorX = TiConvert.toFloat(anchorPoint, TiC.PROPERTY_X);
				op.anchorY = TiConvert.toFloat(anchorPoint, TiC.PROPERTY_Y);
			}
		}
	}

	@Kroll.method
	public Ti2DMatrix translate(double x, double y)
	{
		TiDimension xDimension = new TiDimension(TiConvert.toString(x), TiDimension.TYPE_LEFT);
		TiDimension yDimension = new TiDimension(TiConvert.toString(y), TiDimension.TYPE_TOP);

		Ti2DMatrix newMatrix = new Ti2DMatrix(this, Operation.TYPE_TRANSLATE);
		newMatrix.op.translateX = (float) xDimension.getPixels(null);
		newMatrix.op.translateY = (float) yDimension.getPixels(null);
		return newMatrix;
	}

	@Kroll.method
	public Ti2DMatrix scale(Object args[])
	{
		Ti2DMatrix newMatrix = new Ti2DMatrix(this, Operation.TYPE_SCALE);
		newMatrix.op.scaleFromX = newMatrix.op.scaleFromY = VALUE_UNSPECIFIED;
		newMatrix.op.scaleToX = newMatrix.op.scaleToY = 1.0f;
		// varargs for API backwards compatibility
		if (args.length == 4) {
			// scale(fromX, fromY, toX, toY)
			newMatrix.op.scaleFromValuesSpecified = true;
			newMatrix.op.scaleFromX = TiConvert.toFloat(args[0]);
			newMatrix.op.scaleFromY = TiConvert.toFloat(args[1]);
			newMatrix.op.scaleToX = TiConvert.toFloat(args[2]);
			newMatrix.op.scaleToY = TiConvert.toFloat(args[3]);
		}
		if (args.length == 2) {
			// scale(toX, toY)
			newMatrix.op.scaleFromValuesSpecified = false;
			newMatrix.op.scaleToX = TiConvert.toFloat(args[0]);
			newMatrix.op.scaleToY = TiConvert.toFloat(args[1]);
		} else if (args.length == 1) {
			// scale(scaleFactor)
			newMatrix.op.scaleFromValuesSpecified = false;
			newMatrix.op.scaleToX = newMatrix.op.scaleToY = TiConvert.toFloat(args[0]);
		}
		// TODO newMatrix.handleAnchorPoint(newMatrix.getProperties());
		return newMatrix;
	}

	@Kroll.method
	public Ti2DMatrix rotate(Object[] args)
	{
		Ti2DMatrix newMatrix = new Ti2DMatrix(this, Operation.TYPE_ROTATE);

		if (args.length == 1) {
			newMatrix.op.rotationFromValueSpecified = false;
			newMatrix.op.rotateFrom = VALUE_UNSPECIFIED;
			newMatrix.op.rotateTo = TiConvert.toFloat(args[0]);
		} else if (args.length == 2) {
			newMatrix.op.rotationFromValueSpecified = true;
			newMatrix.op.rotateFrom = TiConvert.toFloat(args[0]);
			newMatrix.op.rotateTo = TiConvert.toFloat(args[1]);
		}
		// TODO newMatrix.handleAnchorPoint(newMatrix.getProperties());
		return newMatrix;
	}

	@Kroll.method
	public Ti2DMatrix invert()
	{
		return new Ti2DMatrix(this, Operation.TYPE_INVERT);
	}

	@Kroll.method
	public Ti2DMatrix multiply(Ti2DMatrix other)
	{
		Ti2DMatrix newMatrix = new Ti2DMatrix(other, Operation.TYPE_MULTIPLY);
		newMatrix.op.multiplyWith = this;
		return newMatrix;
	}

	@Kroll.method
	public float[] finalValuesAfterInterpolation(int width, int height)
	{
		Matrix m = interpolate(1f, width, height, 0.5f, 0.5f);
		float[] result = new float[9];
		m.getValues(result);
		return result;
	}

	public Matrix interpolate(float interpolatedTime, int childWidth, int childHeight, float anchorX, float anchorY)
	{
		Ti2DMatrix first = this;
		ArrayList<Ti2DMatrix> preMatrixList = new ArrayList<Ti2DMatrix>();

		while (first.prev != null) {
			first = first.prev;
			// It is safe to use prev matrix to trace back the transformation matrix list,
			// since prev matrix is constant.
			preMatrixList.add(0, first);
		}

		Matrix matrix = new Matrix();
		for (Ti2DMatrix current : preMatrixList) {
			if (current.op != null) {
				current.op.apply(interpolatedTime, matrix, childWidth, childHeight, anchorX, anchorY);
			}
		}
		if (op != null) {
			op.apply(interpolatedTime, matrix, childWidth, childHeight, anchorX, anchorY);
		}
		return matrix;
	}

	/**
	 * Check if this matrix has an operation of a particular type, or if any
	 * in the chain of operations preceding it does.
	 * @param operationType Operation.TYPE_SCALE, etc.
	 * @return true if this matrix or any of the "prev" matrices is of the given type, false otherwise
	 */
	private boolean containsOperationOfType(int operationType)
	{
		Ti2DMatrix check = this;
		while (check != null) {
			if (check.op != null && check.op.type == operationType) {
				return true;
			}
			check = check.prev;
		}
		return false;
	}

	public boolean hasScaleOperation()
	{
		return containsOperationOfType(Operation.TYPE_SCALE);
	}

	public boolean hasRotateOperation()
	{
		return containsOperationOfType(Operation.TYPE_ROTATE);
	}

	/**
	 * Checks all of the scale operations in the sequence and sets the appropriate
	 * scale "from" values for them all (in case they aren't specified), then gives
	 * back the final scale values that will be in effect when the animation has completed.
	 * @param view
	 * @param autoreverse
	 * @return Final scale values after the animation has finished.
	 */
	public Pair<Float, Float> verifyScaleValues(TiUIView view, boolean autoreverse)
	{
		ArrayList<Operation> scaleOps = new ArrayList<Operation>();

		Ti2DMatrix check = this;
		while (check != null) {

			if (check.op != null && check.op.type == Operation.TYPE_SCALE) {
				scaleOps.add(0, check.op);
			}
			check = check.prev;
		}

		Pair<Float, Float> viewCurrentScale =
			(view == null ? Pair.create(Float.valueOf(1f), Float.valueOf(1f)) : view.getAnimatedScaleValues());

		if (scaleOps.size() == 0) {
			return viewCurrentScale;
		}

		float lastToX = viewCurrentScale.first;
		float lastToY = viewCurrentScale.second;

		for (Operation op : scaleOps) {
			if (!op.scaleFromValuesSpecified) {
				// The "from" values were not specified,
				// so they should be whatever the last "to" values were.
				op.scaleFromX = lastToX;
				op.scaleFromY = lastToY;
			}
			lastToX = op.scaleToX;
			lastToY = op.scaleToY;
		}

		// If autoreversing, then the final scale values for the view will be
		// whatever they are at the start.  Else they are whatever the last "to" scale
		// values are in the sequence.
		if (autoreverse) {
			return viewCurrentScale;
		} else {
			return Pair.create(Float.valueOf(lastToX), Float.valueOf(lastToY));
		}
	}

	/**
	 * Checks all of the rotate operations in the sequence and sets the appropriate
	 * "from" value for them all (in case they aren't specified), then gives
	 * back the final value that will be in effect when the animation has completed.
	 * @param view
	 * @param autoreverse
	 * @return Final rotation value after the animation has finished.
	 */
	public float verifyRotationValues(TiUIView view, boolean autoreverse)
	{
		ArrayList<Operation> rotationOps = new ArrayList<Operation>();

		Ti2DMatrix check = this;
		while (check != null) {

			if (check.op != null && check.op.type == Operation.TYPE_ROTATE) {
				rotationOps.add(0, check.op);
			}
			check = check.prev;
		}

		float viewCurrentRotation = (view == null ? 0f : view.getAnimatedRotationDegrees());

		if (rotationOps.size() == 0) {
			return viewCurrentRotation;
		}

		float lastRotation = viewCurrentRotation;

		for (Operation op : rotationOps) {
			if (!op.rotationFromValueSpecified) {
				// The "from" value was not specified,
				// so it should be whatever the last "to" value was.
				op.rotateFrom = lastRotation;
			}
			lastRotation = op.rotateTo;
		}

		// If autoreversing, then the final rotation value for the view will be
		// whatever it was at the start.  Else it's whatever the last "to" rotation
		// value is in the sequence.
		if (autoreverse) {
			return viewCurrentRotation;
		} else {
			return lastRotation;
		}
	}

	public float[] getRotateOperationParameters()
	{
		if (this.op == null) {
			return new float[4];
		}

		return new float[] { this.op.rotateFrom, this.op.rotateTo, this.op.anchorX, this.op.anchorY };
	}

	public void setRotationFromDegrees(float degrees)
	{
		if (this.op != null) {
			this.op.rotateFrom = degrees;
		}
	}

	/**
	 * Determines whether we can use Honeycomb+ style
	 * animations, namely property Animator instances.
	 * We can do that if the matrix is not "complicated".
	 * See the class documentation for
	 * {@link org.appcelerator.titanium.util.TiAnimationBuilder TiAnimationBuilder}
	 * for a detailed description of what makes a matrix too
	 * complicated for property Animators.
	 * @return true if property animators (i.e., Honeycomb+
	 * animation) can be used, false if we need to stick
	 * with the old-style view animations.
	 */
	public boolean canUsePropertyAnimators()
	{
		boolean hasScale = false, hasRotate = false, hasTranslate = false;
		List<Operation> ops = getAllOperations();

		for (Operation op : ops) {
			if (op == null) {
				continue;
			}

			switch (op.type) {
				case Operation.TYPE_SCALE:
					if (hasScale) {
						return false;
					}
					hasScale = true;
					break;

				case Operation.TYPE_TRANSLATE:
					if (hasTranslate) {
						return false;
					}
					hasTranslate = true;
					break;

				case Operation.TYPE_ROTATE:
					if (hasRotate) {
						return false;
					}
					hasRotate = true;
					break;

				case Operation.TYPE_MULTIPLY:
				case Operation.TYPE_INVERT:
					return false;
			}
		}

		return true;
	}

	/**
	 * Collect this matrix's operation and
	 * those of its predecessors into one
	 * list. This way we can assess
	 * what the resulting transform is
	 * going to do.
	 * @return List of operations.
	 */
	public List<Operation> getAllOperations()
	{
		List<Operation> ops = new ArrayList<Operation>();
		Ti2DMatrix toCheck = this;

		while (toCheck != null) {
			if (toCheck.op != null) {
				ops.add(toCheck.op);
			}
			toCheck = toCheck.prev;
		}

		return ops;
	}
}
