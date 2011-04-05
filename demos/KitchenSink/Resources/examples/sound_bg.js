var win = Ti.UI.currentWindow;


var button = Ti.UI.createButton({
    title:"Start",
    width:100,
    height:40,
    bottom:20
});

win.add(button);

var warningLabel = Ti.UI.createLabel({
    text: 'Note: iOS background audio and remote controls are device-only. Check out the Remote Streaming example to stream audio in the background.',
    color: 'red',
    left: 10,
    bottom: 80,
    height: 'auto',
    width: 300,
    font: {
        fontSize: 14
    },
    textAlign: 'center'
});

win.add(warningLabel);

var text = Ti.UI.createLabel({
    text:"Click the button to start the audio and then exit the app.\n\nThe audio should continue playing and you can use the controls to control the media.",
    width:"auto",
    height:"auto",
    top:10,
    left:10,
    right:10
});

win.add(text);

var sound = Titanium.Media.createSound({url:'../cricket.wav'});

button.addEventListener('click',function()
{
    // support background audio
    sound.audioSessionMode = Ti.Media.AUDIO_SESSION_MODE_PLAYBACK; 
    sound.looping = true;
    sound.play();
});
