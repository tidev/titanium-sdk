/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* globals OS_ANDROID */

if (OS_ANDROID) {
	function iPhoneConstant(name) {
		Titanium.API.error('!!!');
		Titanium.API.error('!!! WARNING : Use of unsupported constant Ti.UI.iPhone.' + name + ' !!!');
		Titanium.API.error('!!!');
		return 0;
	}

	// TODO: Remove me. Only for temporary compatibility
	Titanium.UI.iPhone = {
		ActivityIndicatorStyle: {
			get BIG() { return iPhoneConstant('ActivityIndicatorStyle.BIG'); },
			get DARK() { return  iPhoneConstant('ActivityIndicatorStyle.DARK'); }
		},
		AnimationStyle: {
			get FLIP_FROM_LEFT() { return iPhoneConstant('AnimationStyle.FLIP_FROM_LEFT'); }
		},
		ProgressBarStyle: {
			get SIMPLE() { return iPhoneConstant('ProgressBarStyle.SIMPLE'); }
		},
		SystemButton: {
			get FLEXIBLE_SPACE() { return iPhoneConstant('SystemButton.FLEXIBLE_SPACE'); },
			get DISCLOSURE() { return iPhoneConstant('SystemButton.DISCLOSURE'); }
		},
		SystemButtonStyle: {
			get BAR() { return iPhoneConstant('SystemButtonStyle.BAR'); }
		},
		TableViewCellSelectionStyle: {
			get NONE() { return iPhoneConstant('TableViewCellSelectionStyle.NONE'); }
		},
		TableViewSeparatorStyle: {
			get NONE() { return iPhoneConstant('TableViewSeparatorStyle.NONE'); }
		},
		RowAnimationStyle: {
			get NONE() { return iPhoneConstant('RowAnimationStyle.NONE'); }
		},
		TableViewScrollPosition: {
			get MIDDLE() { return iPhoneConstant('TableViewScrollPosition.MIDDLE'); }
		},
		TableViewStyle: {
			get GROUPED() { return iPhoneConstant('TableViewStyle.GROUPED'); }
		}
	};
}
