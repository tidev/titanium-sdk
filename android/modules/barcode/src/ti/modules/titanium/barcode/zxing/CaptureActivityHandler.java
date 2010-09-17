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

import com.google.zxing.BarcodeFormat;
import com.google.zxing.Result;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;

import java.util.Vector;

import org.appcelerator.titanium.util.Log;

import ti.modules.titanium.barcode.BarcodeActivity;
import ti.modules.titanium.barcode.camera.CameraManager;
import ti.modules.titanium.barcode.constants.Id;

/**
 * This class handles all the messaging which comprises the state machine for
 * capture.
 * 
 * @author dswitkin@google.com (Daniel Switkin)
 * @author sven@roothausen.de(Sven Pfleiderer)
 */

public final class CaptureActivityHandler extends Handler {
	private final BarcodeActivity activity;
	private final DecodeThread decodeThread;
	private State state;

	private static final String LOG_TAG = "CaptureActivityHandler";

	private enum State {
		PREVIEW, SUCCESS, DONE
	}

	public CaptureActivityHandler(BarcodeActivity activity,
			Vector<BarcodeFormat> decodeFormats, String characterSet,
			boolean beginScanning) {
		this.activity = activity;
		decodeThread = new DecodeThread(activity, decodeFormats, characterSet,
				new ViewfinderResultPointCallback(activity.getViewfinderView()));
		decodeThread.start();
		state = State.SUCCESS;

		// Start ourselves capturing previews and decoding.
		CameraManager.get().startPreview();
		if (beginScanning) {
			restartPreviewAndDecode();
		}
	}

	@Override
	public void handleMessage(Message message) {
		switch (message.what) {
		case Id.AUTO_FOCUS:
			// When one auto focus pass finishes, start another. This is the
			// closest thing to
			// continuous AF. It does seem to hunt a bit, but I'm not sure what
			// else to do.
			if (state == State.PREVIEW) {
				CameraManager.get().requestAutoFocus(this, Id.AUTO_FOCUS);
			}
			break;
		case Id.RESTART_PREVIEW:
			restartPreviewAndDecode();
			break;
		case Id.DECODE_SUCCEEDED:
			state = State.SUCCESS;
			Bundle bundle = message.getData();
			Bitmap barcode = bundle == null ? null : (Bitmap) bundle
					.getParcelable(DecodeThread.BARCODE_BITMAP);
			activity.handleDecode((Result) message.obj, barcode);
			break;
		case Id.DECODE_FAILED:
			// We're decoding as fast as possible, so when one decode fails,
			// start another.
			state = State.PREVIEW;
			CameraManager.get().requestPreviewFrame(decodeThread.getHandler(),
					Id.DECODE);
			break;
		case Id.RETURN_SCAN_RESULT:
			activity.setResult(Activity.RESULT_OK, (Intent) message.obj);
			activity.finish();
			break;
		}
	}

	public void quitSynchronously() {
		state = State.DONE;
		CameraManager.get().stopPreview();
		Message quit = Message.obtain(decodeThread.getHandler(), Id.QUIT);
		quit.sendToTarget();
		try {
			decodeThread.join();
		} catch (InterruptedException e) {
			Log.e(LOG_TAG, "Caught exception: " + e);
		}

		// Be absolutely sure we don't send any queued up messages
		removeMessages(Id.DECODE_SUCCEEDED);
		removeMessages(Id.DECODE_FAILED);
	}

	private void restartPreviewAndDecode() {
		if (state == State.SUCCESS) {
			state = State.PREVIEW;
			CameraManager.get().requestPreviewFrame(decodeThread.getHandler(),
					Id.DECODE);
			CameraManager.get().requestAutoFocus(this, Id.AUTO_FOCUS);
			activity.drawViewfinder();
		}
	}
}
