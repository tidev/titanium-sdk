Ti.UI._capitalizeValue = function (_autocapitalization, sValue) {
	if (!sValue) {
		return;
	}
	var resultValue = '';
	switch (_autocapitalization) {
		case Ti.UI.TEXT_AUTOCAPITALIZATION_NONE:  
			resultValue = sValue;
			break;
		case Ti.UI.TEXT_AUTOCAPITALIZATION_WORDS:
			var sTemp = sValue;
			var sEnd = '', iIndex = sValue.length-1;
			while (/[\s,\.!?]/.test(sValue.charAt(iIndex)) && 0 <= iIndex) {
				sEnd += sValue.charAt(iIndex);
				iIndex--;
			}
			sEnd = sEnd.split("").reverse().join("");
			if (!sValue.match(/^[\s,\.!?]/i)) {
				sTemp = ' '+sValue;
			}
			sTemp = sTemp.match(/[\s,\.!]+\w+/gi);
			if (sTemp) {
				for (var iCounter=0; iCounter < sTemp.length; iCounter++) {
					// Found first letter
					for (var jCounter=0; jCounter < sTemp[iCounter].length; jCounter++) {
						if (/\w/.test(sTemp[iCounter].charAt(jCounter))) {
							break;
						}
					}
					sTemp[iCounter] = sTemp[iCounter].replace(
						sTemp[iCounter].charAt(jCounter),
						sTemp[iCounter].charAt(jCounter).toUpperCase()
					);
				}
				if (!sValue.match(/^[\s,\.!?]/i)) {
					sTemp[0] = sTemp[0].replace(sTemp[0].charAt(0), '');
				}
				resultValue = sTemp.join('')+sEnd;
			} else {
				resultValue = _prevVal+sEnd;
			}
			break;
		case Ti.UI.TEXT_AUTOCAPITALIZATION_SENTENCES:
			var sTemp = sValue;
			var sEnd = '', iIndex = sValue.length-1;
			while (/[\.!?]/.test(sValue.charAt(iIndex)) && 0 <= iIndex) {
				sEnd += sValue.charAt(iIndex);
				iIndex--;
			}
			sEnd = sEnd.split("").reverse().join("");
			if (sValue.match(/^\w/i)) {
				sTemp = '!'+sValue;
			}
			sTemp = sTemp.match(/[\.!?]+[\s]*[^\.!?]+/gi);
			if (sTemp) {
				var iIndex = 0;
				for (var iCounter=0; iCounter < sTemp.length; iCounter++) {
					iIndex=0; 
					while (false == /\w/.test(sTemp[iCounter][iIndex])) {
						iIndex++;
					}
					sTemp[iCounter] = sTemp[iCounter].substr(0,iIndex) +
						sTemp[iCounter][iIndex].toUpperCase() +
						sTemp[iCounter].substr(iIndex+1);
				}
				if (sValue.match(/^\w/i)) {
					sTemp[0] = sTemp[0].replace(sTemp[0].charAt(0), '');
				}
				resultValue = sTemp.join('')+sEnd;
			} else {
				resultValue = sEnd;
			}
			break;
		case Ti.UI.TEXT_AUTOCAPITALIZATION_ALL:
			resultValue = sValue.toUpperCase();
			break;
	}
	
	return resultValue;
}		

Ti.UI._updateText = function(obj) {
	var _selectionStart = obj.dom.selectionStart;
	var _selectionEnd = obj.dom.selectionEnd;
	obj.value = api._capitalizeValue(obj.autocapitalization, obj.value);
	obj.dom.selectionStart = _selectionStart;
	obj.dom.selectionEnd = _selectionEnd;
};
