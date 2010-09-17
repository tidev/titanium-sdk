/*
 * Copyright (C) 2008 ZXing authors
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

package ti.modules.titanium.barcode.zxing;

import java.util.Hashtable;
import java.util.Vector;

import ti.modules.titanium.barcode.BarcodeActivity;
import ti.modules.titanium.barcode.camera.CameraManager;
import ti.modules.titanium.barcode.constants.Id;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.util.Log;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.BinaryBitmap;
import com.google.zxing.DecodeHintType;
import com.google.zxing.MultiFormatReader;
import com.google.zxing.ReaderException;
import com.google.zxing.Result;
import com.google.zxing.ResultPointCallback;
import com.google.zxing.common.HybridBinarizer;

/**
 * This thread does all the heavy lifting of decoding the images.
 */

final class DecodeThread extends Thread {

	public static final String BARCODE_BITMAP = "barcode_bitmap";
	private static final String TAG = "DecodeThread";

	private Handler handler;
	private final BarcodeActivity activity;
	private final MultiFormatReader multiFormatReader;

	DecodeThread(BarcodeActivity activity, Vector<BarcodeFormat> decodeFormats,
			String characterSet, ResultPointCallback resultPointCallback) {
		this.activity = activity;
		multiFormatReader = new MultiFormatReader();
		Hashtable<DecodeHintType, Object> hints = new Hashtable<DecodeHintType, Object>(
				3);

		if (decodeFormats == null || decodeFormats.isEmpty()) {
			hints.put(DecodeHintType.POSSIBLE_FORMATS,
					BarcodeActivity.ALL_FORMATS);
		} else {
			hints.put(DecodeHintType.POSSIBLE_FORMATS, decodeFormats);
		}

		if (characterSet != null) {
			hints.put(DecodeHintType.CHARACTER_SET, characterSet);
		}

		hints.put(DecodeHintType.NEED_RESULT_POINT_CALLBACK,
				resultPointCallback);

		multiFormatReader.setHints(hints);
	}

	Handler getHandler() {
		return handler;
	}

	@Override
	public void run() {
		Looper.prepare();
		handler = new Handler() {
			@Override
			public void handleMessage(Message message) {
				switch (message.what) {
				case Id.DECODE:
					decode((byte[]) message.obj, message.arg1, message.arg2);
					break;
				case Id.QUIT:
					Looper.myLooper().quit();
					break;
				}
			}
		};
		Looper.loop();
	}

	/**
	 * Decode the data within the viewfinder rectangle, and time how long it
	 * took. For efficiency, reuse the same reader objects from one decode to
	 * the next.
	 * 
	 * @param data
	 *            The YUV preview frame.
	 * @param width
	 *            The width of the preview frame.
	 * @param height
	 *            The height of the preview frame.
	 */

	private void decode(byte[] data, int width, int height) {
		long start = System.currentTimeMillis();
		Result rawResult = null;
		PlanarYUVLuminanceSource source = CameraManager.get()
				.buildLuminanceSource(data, width, height);
		BinaryBitmap bitmap = new BinaryBitmap(new HybridBinarizer(source));
		try {
			rawResult = multiFormatReader.decodeWithState(bitmap);
		} catch (ReaderException re) {
			// Log and continue
			Log.d("DecodeThread", re.toString());
		} finally {
			multiFormatReader.reset();
		}

		if (rawResult != null) {
			long end = System.currentTimeMillis();
			Log.v(TAG, "Found barcode (" + (end - start) + " ms):\n"
					+ rawResult.toString());
			Message message = Message.obtain(activity.getHandler(),
					Id.DECODE_SUCCEEDED, rawResult);
			Bundle bundle = new Bundle();
			bundle.putParcelable(BARCODE_BITMAP,
					source.renderCroppedGreyscaleBitmap());
			message.setData(bundle);
			message.sendToTarget();
		} else {
			Message message = Message.obtain(activity.getHandler(),
					Id.DECODE_FAILED);
			message.sendToTarget();
		}
	}
}
