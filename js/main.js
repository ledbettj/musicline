/*jshint undef:true browser:true devel:true*/
/*global d3 _ getSpotifyApi*/

window.Musicline = window.Musicline || {};

(function(ml) {

  ml.instance = new ml.Application({
    rootName: 'Minus the Bear',
    familiarityRange: [0, 100],
    growBy: 15
  });

})(window.Musicline);
