/*jshint undef:true browser:true devel:true*/
/*global d3 _ getSpotifyApi*/

window.Musicline = window.Musicline || {};

(function(ml) {
  ml.util = {
    API_KEY: 'R2TFDDCFU7ZZUMTCR',

    toParam:  function(object) {
      var q = '?';
      for(var key in object) {
        q += encodeURIComponent(key) + '=';
        q += encodeURIComponent(object[key].toString()) + '&';
      }

      return q;
    }
  };

})(window.Musicline);
