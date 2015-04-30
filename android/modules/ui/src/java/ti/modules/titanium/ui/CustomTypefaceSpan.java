/**
 * Copyright (c) 2013, Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * https://android.googlesource.com/platform/packages/apps/UnifiedEmail/+/android-4.4.4_r1.0.1/src/com/android/mail/ui/CustomTypefaceSpan.java
 */
package ti.modules.titanium.ui;

import android.graphics.Paint;
import android.graphics.Typeface;
import android.text.TextPaint;
import android.text.style.TypefaceSpan;
/**
 * CustomTypefaceSpan allows for the use of a non-framework font supplied in the
 * assets/fonts directory of the application. Use this class whenever the
 * framework does not contain a needed font.
 */
public class CustomTypefaceSpan extends TypefaceSpan {
    private final Typeface newType;
    /**
     * @param type Typeface, specified as: Typeface.createFromAsset(
     *            context.getAssets(), "fonts/Roboto-Medium.ttf"),
     */
    public CustomTypefaceSpan(Typeface type) {
    	//super(family) Ignored since this uses a completely custom included font.
        super("");
        newType = type;
    }
    @Override
    public void updateDrawState(TextPaint ds) {
        applyCustomTypeFace(ds, newType);
    }
    @Override
    public void updateMeasureState(TextPaint paint) {
        applyCustomTypeFace(paint, newType);
    }
    private static void applyCustomTypeFace(Paint paint, Typeface tf) {
        int oldStyle;
        Typeface old = paint.getTypeface();
        if (old == null) {
            oldStyle = 0;
        } else {
            oldStyle = old.getStyle();
        }
        int fake = oldStyle & ~tf.getStyle();
        if ((fake & Typeface.BOLD) != 0) {
            paint.setFakeBoldText(true);
        }
        if ((fake & Typeface.ITALIC) != 0) {
            paint.setTextSkewX(-0.25f);
        }
        paint.setTypeface(tf);
    }
}