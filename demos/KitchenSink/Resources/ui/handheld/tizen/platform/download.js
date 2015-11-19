// Test of Tizen HTTP file download functionality.
// Tizen only.

function tizenDownload(title) {
	var messageWin = require('ui/handheld/tizen/tizenToast'),
		downloadRequest = void 0,
		win = Ti.UI.createWindow({
			backgroundColor: '#fff'
		}),
		urlLabel = createLabel('Type here Url to download:', 10),
		statusLabel = createLabel('Start download to see status...', 290),
		stateLabel = createLabel('Download not started yet.', 330),
		startButton = createButton('start download', 70, function() {
			startDownload(); 
		}),
		pauseButton = createButton('pause download', 110, function() {
			downloadRequest && downloadRequest.pause();
		}),
		resumeButton = createButton('resume download', 150, function() {
			downloadRequest && downloadRequest.resume();
		}),
		stopButton = createButton('stop download', 190, function() {
			downloadRequest && downloadRequest.abort();
		}),
		urlTextField = Titanium.UI.createTextField({
			value: 'http://download.tizen.org/sdk/InstallManager/tizen-sdk-2.0-ubuntu32.bin',
			top: 30,
			backgroundColor: 'white',
			color: 'black',
			height: 39,
			width: '100%',
			borderStyle: Ti.UI.INPUT_BORDERSTYLE_LINE
		}),
		Tizen = require('tizen');

	// Simplify similar buttons creation
	function createButton(title, top, clickHandler) {
		var result = Titanium.UI.createButton({
				title: title,
				top: top,
				height: 39,
				width: '100%'
			});

		result.addEventListener('click', clickHandler);

		return result;
	}

	// Simplify similar labels creation
	function createLabel(text, top) {
		return Ti.UI.createLabel({
			text: text,
			color: '#000',
			textAlign: 'left',
			font: { fontSize: 12, fontWeight: 'bold' },
			top: top,
			height: 'auto',
			width: 'auto'
		});
	}

	// Initiate the download.
	function startDownload() {
		// Listener object must be "local" for call "Tizen.Download.start". Don't move this declaration it out of this function.
		var listener = {
			onDataStream: function(request, receivedSize, totalSize) {
				Titanium.API.info('"onDataStream" event. id=' + request.id + ', receivedSize=' + receivedSize + ', totalSize=' + totalSize);

				var percentString = (totalSize > 0) ? String.formatDecimal((receivedSize * 100 / totalSize), '##.##' ) + '% ' : '';
				statusLabel.text = 'Completed ' + percentString + '['+receivedSize + '/' + totalSize + ' bytes]';

				checkState();
			},
			onPause: function(request) {
				Titanium.API.info('"onPause" event.');

				messageWin.showToast('Download paused. ', 3000);

				checkState();
			},
			onCancel: function(request) {
				Titanium.API.info('"onCancel" event.');

				messageWin.showToast('Download canceled. ', 3000);
				downloadRequest = void 0;

				checkState();
			},
			onLoad: function(request, fullPath) {
				Titanium.API.info('"onLoad" event.');

				messageWin.showToast('Download completed. Saved to file: ' + fullPath, 5000);
				downloadRequest = void 0;

				checkState();
			},
			onError: function(request, error) {
				Titanium.API.info('"onError" event.');

				messageWin.showToast('Download failed with error: ' + error.name, 3000);
				downloadRequest = void 0;

				checkState();
			}
		};

		// Request the download start from Tizen.
		try {
			if (downloadRequest) {
				messageWin.showToast('Please, stop current download before start new one.', 3000);
			} else {
				downloadRequest = Tizen.Download.createDownloadRequest({
					url: urlTextField.value,
					destination: 'documents',
					fileName: 'tmp' + (new Date().getTime())
				});
				statusLabel.text = 'Starting...';
				downloadRequest.send(listener);
			}
		} catch(e) {
			messageWin.showToast('Exception on start download! /n' + e.message, 2500);
		}

		checkState();
	}

	// Checks current download state and updates buttons and messages states according to it.
	function checkState() {
		try {
			startButton.enabled = !downloadRequest;
			stopButton.enabled = !!downloadRequest;			

			var state =  downloadRequest ? downloadRequest.state : 'NONE';

			Titanium.API.info('current download state: ' + state);

			stateLabel.text = 'current download state: ' + state;
			pauseButton.enabled = (state === 'DOWNLOADING');
			resumeButton.enabled = (state === 'PAUSED');
		} catch(e) {
			messageWin.showToast('Exception! ' + e.message, 2500);
			// On error reset download and state.
			downloadRequest = 'undefined';

			checkState();
		}
	}

	win.add(startButton);
	win.add(pauseButton);
	win.add(resumeButton);
	win.add(stopButton);
	win.add(statusLabel);
	win.add(stateLabel);
	win.add(urlLabel);
	win.add(urlTextField);

	checkState();

	return win;
};

module.exports = tizenDownload;