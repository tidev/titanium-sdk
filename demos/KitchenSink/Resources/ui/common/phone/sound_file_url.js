function sound_file_url(_args) {
	var win = Titanium.UI.createWindow({
			title:_args.title
		}),
		isTizen = Ti.Platform.osname === 'tizen',
		isAndroid = Ti.Platform.name === 'android',
		timob7502fix = ((Ti.version >= '3.0.0') && (Titanium.Platform.name == 'iPhone OS')),
		file = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory,'etc/cricket.wav'),
		file2 = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, isTizen ? 'etc/Kalimba.mp3' : 'etc/pop.caf');

	
	// load from file object but use the nativepath
	var sound = Titanium.Media.createSound({url:file.nativePath});
	
	//
	// PLAY
	//
	var play = Titanium.UI.createButton({
		title:'Play',
		height:40,
		width:145,
		left:10,
		top:10
	});
	play.addEventListener('click', function()
	{
		sound.play();
		if (timob7502fix) {
			pb.max = sound.duration*1000;
		}
		else {
			pb.max = sound.duration;
		}
	});
	win.add(play);
	
	//
	// PAUSE
	//
	var pause = Titanium.UI.createButton({
		title:'Pause',
		height:40,
		width:145,
		right:10,
		top:10
	});
	pause.addEventListener('click', function()
	{
		sound.pause();
	});
	win.add(pause);
	
	//
	// RESET
	//
	var reset = Titanium.UI.createButton({
		title:'Reset',
		height:40,
		width:145,
		left:10,
		top:60
	});
	reset.addEventListener('click', function()
	{
		sound.reset();
		pb.value = 0;
	
	});
	win.add(reset);
	
	//
	// STOP
	//
	var stop = Titanium.UI.createButton({
		title:'Stop',
		height:40,
		width:145,
		right:10,
		top:60
	});
	stop.addEventListener('click', function()
	{
		sound.stop();
		pb.value = 0;
	});
	win.add(stop);
	
	//
	// VOLUME +
	//
	var volumeUp = Titanium.UI.createButton({
		title:'Volume++',
		height:40,
		width:145,
		left:10,
		top:110
	});
	volumeUp.addEventListener('click', function()
	{
		if (sound.volume < 1.0)
		{
			sound.volume += 0.1;
			var roundedVolume = Math.round(sound.volume*1000)/1000;
			volumeUp.title = 'Volume++ (' + roundedVolume + ')';
			volumeDown.title = 'Volume--';
		}
	});
	win.add(volumeUp);
	
	//
	// VOLUME -
	//
	var volumeDown = Titanium.UI.createButton({
		title:'Volume--',
		height:40,
		width:145,
		right:10,
		top:110
	});
	volumeDown.addEventListener('click', function()
	{
		if (sound.volume > 0)
		{
			if (sound.volume < 0.1){
				sound.volume = 0;
			} else {
				sound.volume -= 0.1;
			}
			var roundedVolume = Math.round(sound.volume*1000)/1000;
			volumeDown.title = 'Volume-- (' + roundedVolume + ')';
			volumeUp.title = 'Volume++';
		}
	
	});
	win.add(volumeDown);
	
	//
	// LOOPING
	//
	var looping = Titanium.UI.createButton({
		title:'Looping (false)',
		height:40,
		width:145,
		left:10,
		top:160
	});
	looping.addEventListener('click', function()
	{
		sound.looping = (sound.looping === false)?true:false;
		looping.title = 'Looping (' + sound.isLooping() + ')';
	});
	win.add(looping);
	
	//
	// CHANGE URL (#1488)
	//
	var fileNum = 0;
	var urlChange = Titanium.UI.createButton({
		title:'Change file',
		height:40,
		width:145,
		right:10,
		top:160
	});
	urlChange.addEventListener('click', function()
	{
		if (fileNum === 0) {
			sound.url = file2.nativePath;
			fileNum = 1;
		}
		else {
			sound.url = file.nativePath;
			fileNum = 0;
		}
		
		// Update the progress bar
		pb.value = 0;
		pb.max = sound.duration;
		
	});
	win.add(urlChange);
	
	//
	// EVENTS
	//
	sound.addEventListener('complete', function()
	{
		pb.value = 0;
	});
	sound.addEventListener('resume', function()
	{
		Titanium.API.info('RESUME CALLED');
	});
	
	//
	//  PROGRESS BAR TO TRACK SOUND DURATION
	//
	var flexSpace = Titanium.UI.createButton();
	isTizen || (flexSpace.systemButton = Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE); 
	
	var pb = Titanium.UI.createProgressBar({
		min:0,
		value:0,
		width:200
	});
	
	if (isTizen) {
		// setToolbar is not supported on Tizen; simply add the progress bar to the window
		pb.top = 210;
		win.add(pb);
	} else if (!isAndroid) {
		win.setToolbar([flexSpace,pb,flexSpace]);
	}
	pb.show();
	
	//
	// INTERVAL TO UPDATE PB
	//
	var i = setInterval(function()
	{
		if (sound.isPlaying())
		{
			Ti.API.info('time ' + sound.time);
			pb.value = sound.time;
	
		}
	},500);
	
	//
	//  CLOSE EVENT - CANCEL INTERVAL
	//
	win.addEventListener('close', function()
	{
		clearInterval(i);
		isTizen && sound.release();  // stop playing the audio and release the resources
	});
	return win;
};

module.exports = sound_file_url;