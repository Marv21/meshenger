localStorage.clear();


//These need to be obtained from the node
var ownId, ownColor, ownAlias;

/*
 * INIT
 */

document.addEventListener('DOMContentLoaded', function(){

  function update(){
    if ( !ownId ){
      getOwnId();
    }
    if ( !ownAlias){
   getOwnAlias();
    }
    checkInbox();
    // also check for outbox items on interval,
    // necessary in case connection is lost and messages are not yet sent
    checkOutbox();
  }

  document.getElementById('message-form').onsubmit = onSubmitMessage;

  //update everything to initialize
  updateInboxView();
  update();

  //check for new messages every 7 seconds
  window.setInterval( update, 7000 );

  initState();
  initPhotoStuff(); //all photostuff is found in photostuff.js
});

/*
 * STATE CHANGES
 */

function initState(){
  showOverview();

  document.getElementById('new-photo').onclick = showNewPhoto;
  document.getElementById('new-message').onclick = showNewMessage;
  document.getElementById('message-back').onclick = showOverview;
  document.getElementById('photo-back').onclick = showOverview;
}

function showNewPhoto(){
  document.getElementById('photo-page').style.display = "block";
  document.getElementById('overview-page').style.display = "none";
  document.getElementById('message-page').style.display = "none";
  document.getElementById('fileInput').click();
}

function showNewMessage(){
  document.getElementById('photo-page').style.display = "none";
  document.getElementById('overview-page').style.display = "none";
  document.getElementById('message-page').style.display = "block";
}

function showOverview(){
  document.getElementById('photo-page').style.display = "none";
  document.getElementById('overview-page').style.display = "block";
  document.getElementById('message-page').style.display = "none";
}

/*
 * OUTBOX STUFF
 */
function onSubmitMessage(){
  var msg = document.getElementById('message').value.replace(/\r?\n/g, "<br />");
  if ( !msg || msg === "" ) { /* prevent sending of empty messages */
   return false;
  }
  var namm =  document.getElementById('name').value;
  if ( !namm || namm === "" || namm.length > 20) { /* prevent too long usernames */
   namm = "anonymous";
  }
  addOutboxItem( namm, "<p class='text-message'>"+msg+"</p>" );
  return false;
}

function addOutboxItem( namm, message ){
  var outStr = localStorage.getItem( 'outbox' ) || '';
  var newMsgs = {};
  var ddata = new Date().getTime();
  var alias = ownAlias;
  
  var contento = {
    "time" : ddata,
    "message" : message,
    "name" : namm,
    "node" : "local",
    "alias": alias,
    "hops" : "0"
  };
  newMsgs.message = contento;

  localStorage.setItem( 'outbox', JSON.stringify(newMsgs) );
  checkOutbox();
  document.getElementById('message').value = '';

  showOverview();
}

function checkOutbox() {
        var outStr = localStorage.getItem( 'outbox' );
  if ( ! outStr ) {
    return;
  }
  var lines = outStr.split( /\n/ );
  for ( var i in lines ) {
    if ( lines[i].length === 0 ) {
      continue;
    }
    var obj = JSON.parse(lines[i]);
    var ts = obj.message.time;
    delete obj.message.time;
    var msg = JSON.stringify(obj.message);
    sendMessage( ts, msg );
  }
}
function sendMessage( timestamp, message ) {
  var xhr = new XMLHttpRequest();
  var data = 'time=' + encodeURIComponent( timestamp ) +
    '&message=' + encodeURIComponent( message );

  xhr.onreadystatechange = function(){
    if ( xhr.readyState == 4){
        if ( xhr.status == 200 ) {
          removeOutboxItem( timestamp );
        }
    }
  };

  xhr.open('POST', 'send', true);
  xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  xhr.setRequestHeader('If-Modified-Since', 'Sat, 1 Jan 2005 00:00:00 GMT');
  xhr.send(data);
}
function removeOutboxItem( timestamp ) {
  var outStr = localStorage.getItem( 'outbox' ) || '';
  var lines = outStr.split( /\n/ );
  for ( var i in lines ) {
                var obj = JSON.parse(lines[i]);
    var ts = obj.message.time;
    if ( ts === timestamp ) {
      lines.splice( i, 1 );
      break;
    }
  }
  var newOutStr = lines.join('\n');
  localStorage.setItem('outbox', newOutStr);
}

/*
 * INBOX STUFF
 */


function updateInboxView() {
var localStorageArray = [];
  var contentString = '';

  if (localStorage.length>0) {
    for (i=0;i<localStorage.length;i++){

      element=localStorage.getItem(localStorage.key(i));

      if ( localStorage.key(i).length < 10 || element === 'outbox' ) {
        continue;
      }
      try {
        elementj = JSON.parse(element);
      } catch (e) {
        continue;
      }

      localStorageArray[i] = {
        time:localStorage.key(i),
        user:elementj.name,
        message:elementj.message,
        node:elementj.node,
        hops:elementj.hops,
        alias:elementj.alias
      };
    }
  }
  orderStorage = localStorageArray.sort(function(a,b) { return b.time - a.time; } );

  for(var i in orderStorage) {
    if ( i.length === 0 || i === 'outbox' ) {
            continue;
    }

    var datereadable = getReadableDate( new Date(parseInt(orderStorage[i].time)) );
    var color = getNodeColor( orderStorage[i].node );
    contentString += '<li><div class="message-block" style="background-color:'+color+'">'+
      '<div class="date-sender">On ' + datereadable +
      ' <b>' + parseEmoticons(orderStorage[i].user) +'</b> wrote:</div>' +
      '<div class="message-text">' + parseEmoticons( orderStorage[i].message ) + '</div>' + //parseEmoticons is found in emoji.js
      ' <div class="nodehops"><div class="node '+orderStorage[i].node+'">from '+orderStorage[i].alias + '</div>' +
      ' <div class="hops '+orderStorage[i].hops+'">via '+orderStorage[i].hops+' nodes</div></div></div></li>';
  }
  document.getElementById( 'inbox' ).innerHTML = contentString;
}

function getReadableDate( date ) {
  var day = date.getDate();
  if (day < 10) day = '0' + day;
  var month = date.getMonth()+1;
  if (month < 10) month = '0' + month;
  var year = date.getFullYear();
  var hrs = date.getHours();
  if (hrs < 10) hrs = '0' + hrs;
  var min = date.getMinutes();
  if (min < 10) min = '0' + min;

  return day + '/' + month + '/' + year + ' ' + hrs + ':' + min;
}
function getNodeColor( nodeId ) {
  if( nodeId === 'local' ) {
    return ownColor || '#fff';
  }
  return colorLuminance(nodeId.substr(0,6), 0.5);
}
function colorLuminance(hex, lum) {

  // validate hex string
  hex = String(hex).replace(/[^0-9a-f]/gi, '');
  if (hex.length < 6) {
    hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  }
  lum = lum || 0;

  // convert to decimal and change luminosity
  var rgb = "#", c, i;
  for (i = 0; i < 3; i++) {
    c = parseInt(hex.substr(i*2,2), 16);
    c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
    rgb += ("00"+c).substr(c.length);
  }

  return rgb;
}

function onMessageDownload( msg, filename ) {
  if ( localStorage.getItem( filename ) === null ) {
    localStorage.setItem( filename, msg );
  }
  updateInboxView();
}
function onIndex( index ) {
  var lines = index.split( /\n/ );
  var k,i,l,f;
  for( k in localStorage){
    l = 1;
    for ( i in lines ) {
      f = lines[i];
      if (f == k){ l = 0; }
    }
    if (l == 1){
      localStorage.removeItem(k);
    }
  }
  updateInboxView();

  for ( i in lines ) {
    var fname = lines[i];
    if ( localStorage.getItem( fname ) === null ) {
      //localStorage.setItem( ts, lines[i].substr(lines[i].indexOf(' ')) );
      downloadMessage( fname );
    }

  }

}
function downloadMessage(filename) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function(){
    if (xhr.readyState == 4 && xhr.status == 200){
      onMessageDownload( xhr.responseText, filename );
    }
  };
  xhr.open( "GET", 'msg/'+filename, true);
  xhr.send();

}
function checkInbox() {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function(){
    if (xhr.readyState == 4 && xhr.status == 200){
      onIndex( xhr.responseText );
    }
  };
  xhr.open( "GET", 'index', true);
  xhr.send();
}
function getOwnId() {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function(){
    if (xhr.readyState == 4 && xhr.status == 200){
      ownId = xhr.responseText;
      ownColor = getNodeColor( ownId );
    }
  };
  xhr.open( "GET", 'id', true);
  xhr.send();
}

function getOwnAlias() {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function(){
    if (xhr.readyState == 4 && xhr.status == 200){
      ownAlias = xhr.responseText;
    }
  };
  xhr.open( "GET", 'alias', true);
  xhr.send();
}

