function pad(n) {return n<10 ? '0'+n : n;};

function formatDuration(duration) {
  duration = Math.round(duration/1000);

  var d = Math.floor(duration/86400);
  var h = Math.floor(duration/3600%24);
  var m = Math.floor(duration/60%60);
  var s = Math.floor(duration%60);

  return (d !== 0 ? d+' day'+(d>1 ? 's' : '')+' ' : '')+pad(h)+'h'+pad(m)+'m'+pad(s)+'s';
};

var formatDate = function(date) {
  var day = date.getDate();
  var month = date.getMonth()+1;
  return pad(day)+'/'+pad(month)+'/'+date.getFullYear();
};

var formatTime = function(date) {
  return date.toLocaleTimeString('fr-FR', {hour12: false});
};

var format = function(date) {
  return formatDate(date)+' '+formatTime(date);
};

var now = function() {
  return format(new Date());
};

module.exports = {now: now, format: format, formatDate: formatDate, formatTime: formatTime, formatDuration};
