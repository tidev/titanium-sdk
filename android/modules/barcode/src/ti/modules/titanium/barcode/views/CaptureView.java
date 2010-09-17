/*
 * Copyright (c) 2010 by M-Way Solutions GmbH
 * 
 *      http://www.mwaysolutions.com
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package ti.modules.titanium.barcode.views;

import ti.modules.titanium.barcode.zxing.ViewfinderView;
import android.content.Context;
import android.graphics.Color;
import android.view.SurfaceView;
import android.widget.FrameLayout;
import android.widget.RelativeLayout;

public class CaptureView extends FrameLayout {

	private final SurfaceView mPreviewView;
	private final ViewfinderView mViewfinderView;

	public CaptureView(final Context context) {
		super(context);
		LayoutParams captureParams = new LayoutParams(LayoutParams.FILL_PARENT,
				LayoutParams.FILL_PARENT);
		setLayoutParams(captureParams);

		mPreviewView = new SurfaceView(getContext());
		RelativeLayout.LayoutParams previewParams = new RelativeLayout.LayoutParams(LayoutParams.FILL_PARENT,
				LayoutParams.FILL_PARENT);
		previewParams.getRules()[RelativeLayout.CENTER_IN_PARENT] = RelativeLayout.TRUE;
		mPreviewView.setLayoutParams(previewParams);
		addView(mPreviewView);

		mViewfinderView = new ViewfinderView(getContext());
		LayoutParams viewfinderParams = new LayoutParams(LayoutParams.FILL_PARENT,
				LayoutParams.FILL_PARENT);
		mViewfinderView.setLayoutParams(viewfinderParams);
		mViewfinderView.setBackgroundColor(Color.TRANSPARENT);
		addView(mViewfinderView);
	}

	public SurfaceView getPreviewView() {
		return mPreviewView;
	}

	public ViewfinderView getViewfinderView() {
		return mViewfinderView;
	}

}
