streamWin = Ti.UI.createWindow();
_stream = {};
_stream.rootPath = '../';
appSettings = {};
appSettings.apiHost = 'http://checkpoint.zwangr.com';
currentEvent = {};
currentEvent.title = 'Luminato';


streamData = [{
   "type": "comment",
   "listing_id": null,
   "title": null,
   "ref_id": "49",
   "input": "My new comment",
   "comment_type": "event",
   "user_id": "1",
   "fullname": "Nick Lloyd",
   "modified": "2010-02-24 03:03:52",
   "history": "21 hours ago"
},
{
   "type": "image",
   "listing_id": null,
   "title": null,
   "ref_id": "182",
   "input": "this guys was awesome!",
   "comment_type": null,
   "user_id": "3",
   "fullname": "Steve Park",
   "modified": "2010-02-10 10:33:34",
   "history": "15 days ago"
},
{
   "type": "comment",
   "listing_id": "66",
   "title": "1000 Plates, 1000 Tastes",
   "ref_id": "44",
   "input": "I just got to meet Massimo, very cool! AND amazing food.  ",
   "comment_type": "listing",
   "user_id": "1",
   "fullname": "Nick Lloyd",
   "modified": "2010-02-10 10:20:17",
   "history": "15 days ago"
},
{
   "type": "comment",
   "listing_id": "12",
   "title": "Closing Weekend Celebrations: Featuring Cirque du Soleil - June 12-14",
   "ref_id": "46",
   "input": "One of the best live performances I have ever seen!  I will go every time they are in town.",
   "comment_type": "listing",
   "user_id": "14",
   "fullname": "Luminato Rep",
   "modified": "2010-02-10 10:20:15",
   "history": "15 days ago"
},
{
   "type": "image",
   "listing_id": null,
   "title": null,
   "ref_id": "183",
   "input": "For some reason this was very relaxing... like artificial clouds...",
   "comment_type": null,
   "user_id": "3",
   "fullname": "Steve Park",
   "modified": "2010-02-09 10:35:29",
   "history": "16 days ago"
},
{
   "type": "comment",
   "listing_id": "5",
   "title": "Addicted to Bad Ideas: Peter Lorre\'s 20th Century",
   "ref_id": "48",
   "input": "Provocative. This will turn your thinking, come and check it out, here until 8PM.",
   "comment_type": "listing",
   "user_id": "13",
   "fullname": "Morna Cassidy",
   "modified": "2010-02-09 10:52:46",
   "history": "16 days ago"
},
{
   "type": "comment",
   "listing_id": "4",
   "title": "Cirque du Soleil : A Thrilling Ride Through KOOZA",
   "ref_id": "47",
   "input": "Again The Cirque always amazes!  Come and check this out!!!",
   "comment_type": "listing",
   "user_id": "13",
   "fullname": "Morna Cassidy",
   "modified": "2010-02-09 10:51:33",
   "history": "16 days ago"
},
{
   "type": "comment",
   "listing_id": "62",
   "title": "Bloor-Yorkville celebrates the Brazilian Guitar Marathon",
   "ref_id": "45",
   "input": "The music is amazing, make me feel Like I'm in Rio. You have to check this out! Here until 7.",
   "comment_type": "listing",
   "user_id": "13",
   "fullname": "Morna Cassidy",
   "modified": "2010-02-09 10:49:52",
   "history": "16 days ago"
},
{
   "type": "comment",
   "listing_id": "11",
   "title": "Children's Books and Illustrations",
   "ref_id": "43",
   "input": "Wow the kids are loving this! It's going until 3PM come down now. ",
   "comment_type": "listing",
   "user_id": "13",
   "fullname": "Morna Cassidy",
   "modified": "2010-02-09 10:48:45",
   "history": "16 days ago"
},
{
   "type": "comment",
   "listing_id": "13",
   "title": "Communication | Environment",
   "ref_id": "42",
   "input": "Whoa, this is one very cool installation.",
   "comment_type": "listing",
   "user_id": "12",
   "fullname": "John Doe",
   "modified": "2010-02-09 10:38:40",
   "history": "16 days ago"
},
{
   "type": "comment",
   "listing_id": "4",
   "title": "Cirque du Soleil : A Thrilling Ride Through KOOZA",
   "ref_id": "41",
   "input": "I\'ve never been to a Cirque du Soleil show, but I\'m pretty impressed by this event right now!",
   "comment_type": "listing",
   "user_id": "1",
   "fullname": "Nick Lloyd",
   "modified": "2010-02-09 10:36:35",
   "history": "16 days ago"
},
{
   "type": "image",
   "listing_id": null,
   "title": null,
   "ref_id": "599",
   "input": "where do people practice stuff like this?",
   "comment_type": null,
   "user_id": "1",
   "fullname": "Nick Lloyd",
   "modified": "2010-02-10 08:14:08",
   "history": "15 days ago"
},

{
   "type": "comment",
   "listing_id": "66",
   "title": "1000 Plates, 1000 Tastes",
   "ref_id": "40",
   "input": "Keep in mind there are 3 stations where you can buy food tickets. $5\/per ticket, or get a discount $20\/5 tickets. Bon Apetit!",
   "comment_type": "listing",
   "user_id": "14",
   "fullname": "Luminato Rep",
   "modified": "2010-02-09 10:35:13",
   "history": "16 days ago"
},
{
   "type": "comment",
   "listing_id": "66",
   "title": "1000 Plates, 1000 Tastes",
   "ref_id": "39",
   "input": "Stumbled upon this event and pleasantly surprised that it was part of Luminato. Just waiting in line for my food tickets right now. $5 per ticket will get a hearty sample portion at most booths. ",
   "comment_type": "listing",
   "user_id": "3",
   "fullname": "Steve Park",
   "modified": "2010-02-09 10:32:19",
   "history": "16 days ago"
},
{
   "type": "comment",
   "listing_id": null,
   "title": null,
   "ref_id": "38",
   "input": "Just want to say, that I really enjoyed the Luminato events that I attended. Once again everyone did a great job. I only have 1 negative comment, well mostly a suggestion for next year. The Big Band\/Swing night.\n\nAs a Swing dancer who attended last years AMAZING Count Basie Orchestra event at Dundas Square, and had the time of my life,I was super excited about attending this years event. All my dancer friends were excited and we all headed downtown to show Toronto what &quot;lindy hop&quot; and &quot;Big Band&quot; music is all about.\n\nSadly, I did not feel that we were able to do that this year. The band that performed was good, don't get me wrong but played very little REAL big band music. We got the beatles, we got Salsa music, we got Country music and we got ABBA. I was waiting for a Bollywood song to round out all the evening.\n",
   "comment_type": "event",
   "user_id": "12",
   "fullname": "John Doe",
   "modified": "2010-02-05 12:40:17",
   "history": "20 days ago"
}];

var data = [];
var l = streamData.length;

for (var i = 0; i < l; i++) {
   var a = streamData[i];

   var streamRow = Ti.UI.createTableViewRow();
   streamRow.height = 130;
   streamRow.hasDetail = true;
   streamRow.backgroundImage = _stream.rootPath + 'images/backgrounds/tableRows/table_bg.png';
   streamRow.data = a;

   if (a.title == '' || a.title == null) {
       a.title = currentEvent.title;
   }

   var title = Ti.UI.createLabel({
       text: a.title,
       left: 50,
       top: 2,
       width: 200,
       height: 30,
       color: '#333333',
       font: {
           fontSize: 16,
           fontWeight: 'bold'
       }
   });
   streamRow.add(title);

   var userProfilePic = Ti.UI.createImageView({
       url: appSettings.apiHost + '/images/profile?user_id=' + a.user_id + '&thumb=true',
       width: 40,
       height: 40,
       top: 5,
       left: 5
   });
   streamRow.add(userProfilePic);

   var userName = Ti.UI.createLabel({
       text: 'By: ' + a.fullname,
       left: 50,
       bottom: 5,
       height: 18,
       width: 160,
       color: '#777',
       font: {
           fontSize: 13,
           fontWeight: 'bold'
       }
   });
   streamRow.add(userName);

   var timestamp = Ti.UI.createLabel({
       text: a.history,
       right: 10,
       bottom: 5,
       width: 140,
       height: 18,
       color: '#999999',
       font: {
           fontSize: 11
       },
       textAlign: 'right'
   });
   streamRow.add(timestamp);

   if (a.type == 'comment') {

       var userInput = Ti.UI.createLabel({
           text: a.input,
           left: 50,
           top: 30,
           height: 75,
           width: 200,
           color: '#222',
           font: {
               fontSize: 13
           }
       });
     streamRow.add(userInput);
       streamRow.className = 'commentRow';
       data.push(streamRow);

   }

   else if (a.type == 'image') {

       var userInputView = Ti.UI.createView({
           left: 50,
           top: 30,
           height: 75
       });

       var userImage = Ti.UI.createImageView({
           url: appSettings.apiHost + '/images/display?id=' + a.ref_id + '&thumb=true',
           width: 60,
           height: 60,
           top: 5,
           left: 5
       });



       if (a.input != null && a.input != "") {
           var userCaption = Ti.UI.createLabel({
               text: '"' + a.input + '"',
               left: 70,
               top: 10,
               height: 50,
               width: 100,
               color: '#777',
               font: {
                   fontSize: 11
               }
           });
Ti.API.info('ADDING CAPTION ' + a.input +' caption object ' + userCaption.text)
           userInputView.add(userCaption);
           streamRow.className = 'imageWithCaptionRow';
       } else {
           streamRow.className = 'imageRow';
       }
       userInputView.add(userImage);
       streamRow.add(userInputView);
       data.push(streamRow);
   }


}

if (typeof streamTable != 'undefined') {
   streamTable.setData(data, {
       animationStyle: Titanium.UI.iPhone.RowAnimationStyle.UP
   });
} else {
   streamTable = Titanium.UI.createTableView({
       data: data,
       top: 85
   });
   streamWin.add(streamTable);
}
streamWin.open();
