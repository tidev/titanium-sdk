function tizenNFC(title) {
	var nfc = require('tizen').NFC,
        nfcDetectionLabel,
		ndefRecordLabel,
		nfcSwitch,
		picker,
		nfcAdapter,
		nfcTag;

	// Convert NFC record type to string
	function NfcRecordTypeToString(tnfType) {
		switch (tnfType) {
			case nfc.NFC_RECORD_TNF_EMPTY:
				return 'EMPTY';
			case nfc.NFC_RECORD_TNF_WELL_KNOWN:
				return 'WELL KNOWN';
			case nfc.NFC_RECORD_TNF_MIME_MEDIA:
				return 'MIME MEDIA';
			case nfc.NFC_RECORD_TNF_URI:
				return 'URI';
			case nfc.NFC_RECORD_TNF_EXTERNAL_RTD:
				return 'EXTERNAL RTD';
			case nfc.NFC_RECORD_TNF_UNKNOWN:
				return 'UNKNOWN';
			default:
				return 'incorrect value';
		}
	}

	//Format property and value into html code
	function propertyToLine(propertyName, propertyValue) {
		return '<b>' + propertyName + ': </b> ' + propertyValue + '<br />';
	}

	// Format nfc record to html
	function formatRecordInfo(record) {
		var result;
		try {
			var className = record.toString();

            Ti.API.info(className);

            result = propertyToLine('NFC', NfcRecordTypeToString(record.tnf));
            result += propertyToLine('id', record.id);
            result += propertyToLine('Payload', record.payload);

            if (className == 'TizenNFCNDEFRecordText') {
				result += propertyToLine('text', record.text);
				result += propertyToLine('langCode', record.languageCode);
				result += propertyToLine('encodeType', (record.encoding == 'UTF8' ? 'UTF-8' : 'UTF-16'));
			} else if (className == 'TizenNFCNDEFRecordURI') {
				result += propertyToLine('URI', record.uri);
			} else if (className == 'TizenNFCNDEFRecordMedia') {
                result += propertyToLine('mimeType', record.mimeType);
			}
		} catch (e) {
			result = 'NFC message parse error. \n' + e.name + ' : ' + e.message;
		}

		return result;
	}

	// Clear picker control
	function clearPicker() {
		try{
			if(picker.columns[0]) {
				var col = picker.columns[0],
					len = col.rowCount;

				for(var x = len-1; x >= 0; x-- ){
					var row = col.rows[x];
					col.removeRow(row);
				}
				picker.reloadColumn(col);
			}
		} catch (e) {
			Titanium.API.info(e.name + ' : ' + e.message);
		}
	}

	// Add received message to picker
	function fillPicker(message) {
		clearPicker();

		var data = [message.recordCount];
		for ( var i = 0; i < message.recordCount; i++) {
			data[i] = Ti.UI.createPickerRow({title:'record #'+i,recordsOriginalData:message.records[i]});
		}

		picker.add(data);
		picker.setSelectedRow(0, 0, false);
		picker.show();
	}

	// Read incoming message and put data to UI
	function readMessage(response) {
		if (response.success) {
			var message = response.ndefMessage;
			Ti.API.info('NDEF successfully received.');
			Ti.API.info(JSON.stringify(message));

			if (message.recordCount > 0) {

				if (message.recordCount == 1) {
					ndefRecordLabel.text = formatRecordInfo(message.records[0]);
					picker.hide();
				} else {
					fillPicker(message);
				}

			} else {
				ndefRecordLabel.text = 'There are no records in NDEF.';
			}
		} else {
			// show reading errors
			ndefRecordLabel.text = 'NDEF read error.  \n' + response.error;
		}
	}

	// Start listening to incoming NFC messages
	function setTagDetect(response) {
		if (response.success) {
			var onSuccess = {
				onattach: function(tag) {
					nfcTag = tag;
					var isNDEF = nfcTag.isSupportedNDEF;
					nfcDetectionLabel.text = 'Tag found:' + nfcTag.type;

					if (isNDEF) {
						nfcTag.readNDEF(readMessage);
					} else {
						Ti.API.info('This Tag does not support NDEF');
					}
				},
				ondetach: function () {
					//update UI when NFC is detached
					nfcTag = null;
					picker.hide();
					nfcDetectionLabel.text = 'Tag successfully detached. \n Searching for new NFC tags around...';
					ndefRecordLabel.text = '';
				}
			};

			try {
				nfcAdapter.setTagListener(onSuccess);
			} catch (e) {
				Ti.API.warn(e.name + ' : ' + e.message);
			}
		} else {
			nfcSwitch.value = false;
			nfcDetectionLabel.text = 'Failed to power on NFC: ' + response.error;
		}
	}

	// Turned off detecting NFC tags
	function unsetTagDetect() {
		try {
			nfcAdapter.unsetTagListener();
			clearPicker();
			picker.hide();
			nfcTag = null;
			nfcDetectionLabel.text = 'Tag listener is turned off';
			ndefRecordLabel.text = '';
		} catch (e) {
			nfcDetectionLabel.text = 'Failed to turn off listener  ' + e.name + ' : ' + e.message;
		}
	}

	function switchNfc(turnOn){
		function onPowerOnFails(e) {
			nfcSwitch.value = false;
			nfcDetectionLabel.text = 'Failed to power on NFC: ' + e.message;
		}
		
		if (turnOn) {
			nfcDetectionLabel.text = 'Searching for new NFC tags around...';

			try {
				nfcAdapter = nfc.getDefaultAdapter();
				nfcAdapter.setPowered(true, setTagDetect);
			} catch (e) {
				onPowerOnFails(e);
				nfcAdapter = null;
			}
		} else {
			if (nfcAdapter) {
				unsetTagDetect();
			}else{
				nfcDetectionLabel.text = 'NFC is powered off.';
			}
		}
	}

    // UI
	var win = Ti.UI.createWindow({backgroundColor:'#fff'});
	nfcSwitch = Ti.UI.createSwitch({
		value:false,
		top:20,
		titleOff: 'NFC listening is turned off',
		titleOn: 'Now NFC listening is turned on'
	});
	nfcDetectionLabel = Ti.UI.createLabel({
		text:'Press the button to start listening.',
		color:'#000',
		autoLink: false,
		textAlign:'left',
		font:{fontSize:12,fontWeight:'bold'},
		top:90,
		height:'auto',
		width:'95%'
	});
	ndefRecordLabel = Ti.UI.createLabel({
		text:'',
		autoLink: false,
		color:'#000',
		textAlign:'left',
		font:{fontSize:12},
		top: 150,
		height:'auto',
		width:'95%'
	});

	picker = Ti.UI.createPicker({
		top: 65,
		right:10,
		height: 110,
		width: 120,
		selectionIndicator: true
	});

	win.add(picker);
	win.add(nfcSwitch);
	win.add(nfcDetectionLabel);
	win.add(ndefRecordLabel);

	nfcSwitch.addEventListener('change', function(e) {
        switchNfc(e.value);
    });
    
	picker.addEventListener('change', function(e) {
        ndefRecordLabel.text = formatRecordInfo(e.row.recordsOriginalData);
    });
    
	picker.hide();

	return win;
}

module.exports = tizenNFC;