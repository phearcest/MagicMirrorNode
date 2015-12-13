var Speakable = require('speakable');
request = require('request');
var API_KEY = 'AIzaSyBOnL9Spiavyf2E8IfSVdIlYbqdUIRQHsc';
var KEY_WORD = 'silver';

//Setup socket.io
var io = require('socket.io').listen(3000);
io.set('origins', 'http://localhost:80');

io.on('connection', function(socket){
  console.log('a user connected');
});

// Setup google speech
var speakable = new Speakable({key: API_KEY});

var previousCommandArray = [];


function sendData(data, type)
{
  console.log('Sending ' + type);

  io.sockets.emit(type, data);
}

speakable.on('speechStart', function() {
  console.log('onSpeechStart');
});

speakable.on('speechStop', function() {
  console.log('onSpeechStop');
  speakable.recordVoice();
});

speakable.on('speechReady', function() {
  console.log('onSpeechReady');
});

speakable.on('error', function(err) {
  console.log('onError:');
  console.log(err);
  speakable.recordVoice();
});

speakable.on('speechResult', function(spokenWords) {
  console.log('onSpeechResult:')
  console.log(spokenWords);
  
  console.log(previousCommandArray);

  // if the previous command was only the key word preform the task
  if (previousCommandArray.length === 1 && previousCommandArray[0] === KEY_WORD) {

      if (spokenWords[0] === 'show' && spokenWords[1] === 'me'  && spokenWords.length > 2) {
        console.log('SEARCHING IMAGES');

        var searchQuery = '';
        for (i = 2, len = spokenWords.length; i < len; i++) {
          searchQuery = searchQuery + spokenWords[i] + ' '
        }
        searchQuery = searchQuery.substring(0, searchQuery.length - 1);

        var q = searchQuery;
        var results=2;
        var searchURL = 'https://ajax.googleapis.com/ajax/services/search/images?callback=processResults&rsz='+results+'&v=1.0&q='+escape(q)+'&imgsz=large&safe=off';
        request(searchURL, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            while(body.charAt(0) !== '{'){
              body = body.substr(1);
            }
            body = body.substring(0, body.length - 1);

            var data = JSON.parse(body);
            var pictures = data.responseData.results;

            var imageHTML = ''

            for (i = 0, len = pictures.length; i < len; i++) {
              picture = pictures[i];
              if (picture.url === 'http://spanish.fansshare.com/photos/scarlettjohansson/scarlett-johansson-boobs-pic-hot-2044943452.jpg') {
                picture.url = 'http://cdn23.us1.fansshare.com/photos/scarlettjohansson/scarlett-johansson-boobs-pic-hot-712435720.jpg';
                imageHTML = imageHTML + '<img src="'+picture.url+'" width="50%" />';
              } else {
                imageHTML = imageHTML + '<img src="'+picture.url+'" width="50%" />';
              }
            }
            
            sendData(imageHTML, 'images');
          }
        })
      } else {
        var sentance = spokenWords.slice(0, spokenWords.length).join(' ');
        sendData(sentance, 'command');
      }
  		// TODO: Integrate preforming commands
  } 
  // if the command starts with the ketword
  else if (spokenWords[0] === KEY_WORD) {

    // if it is more than the key word preform the task
  	if (spokenWords.length > 1) {
  		console.log('Preforming command');
      var sentance = spokenWords.slice(0, spokenWords.length).join(' ')
      sendData(sentance, 'command');
  		// TODO: Integrate preforming commands
  	} 
    // if it is just the keyword preform the next spoken words
    else {
  		sendData('How can I help?', 'ready');
  		// TODO: Send ready signal
  	}

	} 
  // if okay is the only word spoken dismiss what is currently on the screen
  else if (spokenWords.length === 1 && spokenWords[0] === 'okay') {
    sendData('', 'dismiss');
  }

	previousCommandArray = spokenWords;

});

speakable.recordVoice();
