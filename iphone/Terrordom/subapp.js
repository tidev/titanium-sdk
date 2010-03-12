var win = Titanium.UI.currentWindow
win.backgroundColor = '#336699';

var scrollView = Titanium.UI.createScrollView({
    top: 0,
    contentHeight: 'auto',
    contentWidth: '320',
    layout: 'vertical'
});

var headerView = Ti.UI.createView({
    height: 'auto',
    width: '300',
    backgroundColor: '#fff',
    borderRadius: 12
});

var headerLabel = Ti.UI.createLabel({
    text: 'Welcome',
    font: {
        fontSize: 16,
        fontWeight: 'bold'
    },
    left: 10,
    height: 30,
    color: '#336699'
});

headerView.add(headerLabel);

var htmlView = Ti.UI.createView({
    top: 10,
    bottom: 10,
    width: 300,
    backgroundColor: '#fff',
    borderRadius: 12,
    height: 'auto'
});

var html = "<html>";
html += "<head>";
html += "<style type='text/css'>body{font:13px Helvetica, Arial, sans-serif; margin:0px; padding:0px;}</style>";
html += "</head>";
html += "<body>";
html += "<p>Sold out during its Ottawa run, this critically acclaimed one-man show on jazz legend Lenny Breau makes its long-awaited Toronto debut as part of our Guitar Festival.</p>";
html += "<p>Born in Maine, then transplanted to Manitoba (where he taught the young Randy Bachman), guitar genius Lenny Breau was a legend during his tragically brief life.<br /><br />A brilliant innovator who created his own distinctive jazz style from a dizzying fusion of influences, ranging from country to classical to flamenco, Breau had a transformative effect on Canadian and American music that is still heard today. In 1984, a few days after his 43rd birthday, he was found dead in a Los Angeles swimming pool, the victim of a murder that remains unsolved to this day. In this bravura one-man-performance, Pierre Brault delves into Breau's remarkable life, his mysterious death and, above all, the wonder of his music. Directed by Brian Quirt.</p>";
html += "<p><strong>'Tough, tender and textured... As finely executed as it is conceived. Don't miss it.'<br /></strong>- Patrick Langston, <em>The Ottawa Citizen</em><br /><br />Based on the original co-production with the Great Canadian Theatre Company.<em></em> <em>5 O'Clock Bells</em> was the winner of the award for Outstanding New Creation at the 2nd annual Rideau Awards, which honour the best in Ottawa professional theatre. </p>";
html += "<p><strong>Meet the artists at a panel discussion. </strong></p>";
html += "<script>window.htmlHeight = document.height;</script>";
html += "</body>";
html += "</html>";


var webview = Ti.UI.createWebView({
    html: html,
    width: 280,
    top: 10,
    height: 'auto'
});

htmlView.add(webview);

var footerView = Ti.UI.createView({
    height: 'auto',
    width: '300',
    backgroundColor: '#fff',
    borderRadius: 12
});

var footerLabel = Ti.UI.createLabel({
    text: 'Buh Bye',
    font: {
        fontSize: 16
    },
    top: 10,
    left: 10,
//    width:50,
    height: 30,
    color: '#336699'
});

//win.add(htmlView);

footerView.add(footerLabel);

scrollView.add(headerView);
scrollView.add(htmlView);
//scrollView.add(webview);
scrollView.add(footerView);

win.add(scrollView);