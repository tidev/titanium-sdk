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

package ti.modules.titanium.barcode.zxing.result;

import android.util.Log;

import com.google.zxing.Result;
import com.google.zxing.client.result.ParsedResult;
import com.google.zxing.client.result.ResultParser;

/**
 * Wrapper class for results from barcode scanner
 * 
 * @author sven@roothausen.de(Sven Pfleiderer)
 *
 */

public class ResultHandler {

	private final ParsedResult mResult;


	public ResultHandler(final Result rawResult) {
		this.mResult = parseResult(rawResult);
		log("Got new data: " + rawResult);
	}

	public Object getType() {
		return mResult.getType();
	}

	public CharSequence getDisplayContents() {
		return mResult.getDisplayResult();
	}

	private void log(String msg) {
		Log.d("ResultHandler", msg);
	}

	private ParsedResult parseResult(Result rawResult) {
		return ResultParser.parseResult(rawResult);
	}

}
