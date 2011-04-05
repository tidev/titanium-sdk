var win = Titanium.UI.currentWindow;

var url = Titanium.UI.createTextField({
    value:'http://dl.dropbox.com/u/2225394/Ken%20Ashcorp%20-%20TASTELESS%20%281%29.mp3',
    color:'#336699',
    returnKeyType:Titanium.UI.RETURNKEY_GO,
    keyboardType:Titanium.UI.KEYBOARD_URL,
    clearButtonMode: Titanium.UI.INPUT_BUTTONMODE_ONFOCUS,
    hintText:'url',
    textAlign:'left',
    clearOnEdit:false, // this set to true was clearing the field on launch
    height:35,
    top:10,
    width:300,
    borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED
});

var streamButton = Titanium.UI.createButton({
    title:'Start Streaming',
    top:60,
    width:200,
    height:40
});

var pauseButton = Titanium.UI.createButton({
    title:'Pause Streaming',
    top:110,
    width:200,
    height:40,
    enabled:false
});

var progressLabel = Titanium.UI.createLabel({
    text:'Time Played: Not Started',
    top:160,
    left:10,
    height:40,
    width:300,
    color:'#555',
    textAlignment:'center'
});
var stateLabel = Titanium.UI.createLabel({
    text:'State: Not Started',
    top:180,
    left:10,
    width:300,
    height:40,
    color:'#555'
});

var timeLapsedLabel = Ti.UI.createLabel({
    top: 230,
    left: 0,
    height: 23,
    width: 40,
    font: {
        fontSize: 9
    },
    textAlign: 'right'
});

var progressSlider = Ti.UI.createSlider({
    top: 230,
    height: 23,
    width: 240,
    min: 0.0,
    max: 1.0
});

var timeRemainingLabel = Ti.UI.createLabel({
    top: 230,
    right: 0,
    height: 23,
    width: 40,
    font: {
        fontSize: 9
    },
    textAlign: 'left'
});

var warningLabel = Ti.UI.createLabel({
    text: 'Note: this example supports iOS background audio, remote controls, and volume; but those features are device-only.',
    color: 'red',
    left: 10,
    bottom: 40,
    height: 'auto',
    width: 300,
    font: {
        fontSize: 14
    },
    textAlign: 'center'
});

var volumeDownLabel = Ti.UI.createLabel({
    text: '-',
    left: 0,
    bottom: 4,
    height: 23,
    width: 40,
    font: {
        fontSize: 18
    },
    textAlign: 'center'
});

var volumeSlider = Ti.UI.createSlider({
    bottom: 4,
    height: 23,
    width: 240,
    min: 0.0,
    max: 1.0
});

var volumeUpLabel = Ti.UI.createLabel({
    text: '+',
    right: 0,
    bottom: 4,
    height: 23,
    width: 40,
    font: {
        fontSize: 18
    },
    textAlign: 'center'
});

Ti.UI.currentWindow.add(url);
Ti.UI.currentWindow.add(streamButton);
Ti.UI.currentWindow.add(pauseButton);
Ti.UI.currentWindow.add(progressLabel);
Ti.UI.currentWindow.add(stateLabel);
Ti.UI.currentWindow.add(timeLapsedLabel);
Ti.UI.currentWindow.add(progressSlider);
Ti.UI.currentWindow.add(timeRemainingLabel);
Ti.UI.currentWindow.add(warningLabel);
Ti.UI.currentWindow.add(volumeDownLabel);
Ti.UI.currentWindow.add(volumeSlider);
Ti.UI.currentWindow.add(volumeUpLabel);

var streamer = Ti.Media.createAudioPlayer();

// support background audio
Ti.Media.audioSessionMode = Ti.Media.AUDIO_SESSION_MODE_PLAYBACK;

streamButton.addEventListener('click',function()
{
    if (streamButton.title == 'Stop Stream')
    {
        progressLabel.text = 'Stopped';
        streamer.stop();
        pauseButton.enabled = false;
        pauseButton.title = 'Pause Streaming';
        streamButton.title = "Start Streaming";
    }
    else
    {
        progressLabel.text = 'Starting ...';
        streamer.url = url.value;
        streamer.start();
        pauseButton.enabled = true;
        pauseButton.title = 'Pause Streaming';
        streamButton.title = "Stop Stream";
    }
});

pauseButton.addEventListener('click', function()
{
    streamer.pause();
    if (streamer.paused) {
        pauseButton.title = 'Unpause Streaming';
    }
    else {
        pauseButton.title = 'Pause Streaming';
    }
});

var updateTimeLabels = function(timeLapsed, duration)
{
    var stringForDuration = function(duration)
    {
        duration = Math.round(duration);
        
        var negative = false;
        if (duration < 0)
        {
            negative = true;
            duration = -duration;
        }
        
        var hours = Math.floor(duration / 3600);
        duration %= 3600;
        var minutes = Math.floor(duration / 60);
        var seconds = Math.floor(duration % 60);
        
        var stringForPart = function(part, zero, more)
        {
            var result = '';
            
            if (zero && part < 10)
            {
                result += '0' + part;
            }
            else
            {
                result += part;
            }
            
            if (more)
            {
                result += ':';
            }
            
            return result;
        };
        
        var result = '';
        
        if (negative)
        {
            result += '-';
        }
        
        if (hours > 0)
        {
            result += stringForPart(hours, false, true);
        }
        
        result += stringForPart(minutes, hours > 0, true);
        result += stringForPart(seconds, true, false);
        
        return result;
    };
    
    timeLapsedLabel.text = stringForDuration(timeLapsed);
    timeRemainingLabel.text = stringForDuration(timeLapsed - duration);
};

var progressSliding = false;

streamer.addEventListener('progress',function(e)
{
    progressLabel.text = 'Time Played: ' + Math.round(e.progress) + ' seconds';
    
    var timeLapsed = Math.round(e.progress);
    var duration = Math.round(streamer.duration);
    
    updateTimeLabels(timeLapsed, duration);
    
    var sliderValue = 0;
    
    if (duration > 0)
    {
        sliderValue = timeLapsed / duration;
    }
    
    progressSlider.value = sliderValue;
});

progressSlider.addEventListener('change',function(e)
{
    if (progressSliding)
    {
        var duration = streamer.duration;
        var newTimeLapsed = e.value * duration;
        
        updateTimeLabels(newTimeLapsed, duration);
    }
});

var timeLapsed = 0;
var duration = Math.round(streamer.duration);
progressSlider.value = timeLapsed;
updateTimeLabels(timeLapsed, duration);

progressSlider.addEventListener('touchstart',function()
{
    streamer.pause();
    progressSliding = true;
});

progressSlider.addEventListener('touchend',function()
{
    progressSliding = false;
    
    var duration = streamer.duration;
    var newTimeLapsed = progressSlider.value * duration;
    
    streamer.time = newTimeLapsed;
    streamer.setPaused(false);
});

var volumeSliding = false;

Ti.Media.addEventListener('volume',function(e)
{
    if (!volumeSliding)
    {
        volumeSlider.value = e.volume;
    }
});

volumeSlider.addEventListener('change',function(e)
{
    if (volumeSliding)
    {
        streamer.volume = e.value;
    }
});

volumeSlider.addEventListener('touchstart',function()
{
    volumeSliding = true;
});

volumeSlider.addEventListener('touchend',function()
{
    // this delay prevents the backlog of 'volume' events caused by the slider
    // from now affecting the slider's value
    setTimeout(function()
    {
        volumeSliding = false;
    },
    100);
});

volumeSlider.value = streamer.volume;

streamer.addEventListener('change',function(e)
{
    stateLabel.text = 'State: '+e.description +' ('+e.state+')';
    if(e.description == "stopped")
    {
        progressLabel.text = 'Stopped';
        pauseButton.enabled = false;
        pauseButton.title = 'Pause Streaming';
        streamButton.title = "Start Streaming";
    }
});

streamer.addEventListener('remoteControl',function(e)
{
    var handledString = '';
    
    // if we set the 'handlePlayRemoteControls' property of our Ti.Media.AudioPlayer to false,
    // then we will need to handle all remote control events
    // otherwise: play, pause, stop, and play / pause toggle will be handled for us
    if (streamer.handlePlayRemoteControls)
    {
        handledString = ' - will be handled by our Ti.Media.AudioPlayer';
    }
    
    switch(e.controlType)
    {
        case Ti.Media.REMOTE_CONTROL_PLAY:
            Ti.API.info('remote control - play' + handledString);
            break;
        case Ti.Media.REMOTE_CONTROL_PAUSE:
            Ti.API.info('remote control - pause' + handledString);
            break;
        case Ti.Media.REMOTE_CONTROL_STOP:
            Ti.API.info('remote control - stop' + handledString);
            break;
        case Ti.Media.REMOTE_CONTROL_PLAY_PAUSE:
            Ti.API.info('remote control - play / pause toggle' + handledString);
            break;
        case Ti.Media.REMOTE_CONTROL_NEXT:
            Ti.API.info('remote control - next track');
            break;
        case Ti.Media.REMOTE_CONTROL_PREV:
            Ti.API.info('remote control - prev track');
            break;
        case Ti.Media.REMOTE_CONTROL_START_SEEK_BACK:
            Ti.API.info('remote control - seek back - start');
            break;
        case Ti.Media.REMOTE_CONTROL_END_SEEK_BACK:
            Ti.API.info('remote control - seek back - end');
            break;
        case Ti.Media.REMOTE_CONTROL_START_SEEK_FORWARD:
            Ti.API.info('remote control - seek forward - start');
            break;
        case Ti.Media.REMOTE_CONTROL_END_SEEK_FORWARD:
            Ti.API.info('remote control - seek forward - end');
            break;
    }
});

// save off current idle timer state
var idleTimer = Ti.App.idleTimerDisabled;

// while we're in this window don't let the app shutdown
// when the screen is idle
Ti.App.idleTimerDisabled = true;

win.addEventListener('close',function()
{
    Ti.API.info("window was closed, idleTimer reset to = "+idleTimer);

    // restore previous idle state when closed
    Ti.App.idleTimerDisabled = idleTimer;
});