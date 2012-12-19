/*jshint undef:true browser:true devel:true*/
/*global d3 _ Spotify*/

window.Musicline = window.Musicline || {};

(function(ml) {

  var DragHandler = function(params) {
    var stub = function() {};

    this.onArtist   = params.onArtist   || stub;
    this.onPlaylist = params.onPlaylist || stub;
    this.onAlbum    = params.onAlbum    || stub;
    this.onUser     = params.onUser     || stub;
    this.onTrack    = params.onTrack    || stub;

    this.installHTML5Handler();
    this.installSpotifyHandler();
  };

  DragHandler.prototype.installHTML5Handler = function() {
    var body = d3.select('body').node();

    body.addEventListener('dragenter', function(e) { return false; }, false);
    body.addEventListener('dragleave', function(e) { return false; }, false);
    body.addEventListener('dragend',   function(e) { }, false);
    body.addEventListener('dragover',  function(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      return false;
    }, false);

    body.addEventListener('drop', function(e) {
      var uri = e.dataTransfer.getData('Text');
      this.dropEvent = e;
      this.dispatchUri(uri);
      return false;
    }.bind(this));
  };

  DragHandler.prototype.installSpotifyHandler = function() {
    Spotify.models.application.observe(Spotify.models.EVENT.LINKSCHANGED, function() {
      this.dropEvent = null;
      _.each(Spotify.models.application.links, this.dispatchUri.bind(this));
    }.bind(this));
  };

  DragHandler.prototype.dispatchUri = function(uri) {
    if (uri.match(/^http:\/\//)) {
      uri = uri
        .replace('http://open.spotify.com', 'spotify')
        .replace(/\//g, ':');
    }

    console.log("DROP", uri);
    if (uri.indexOf('playlist:') !== -1) {
      Spotify.models.Playlist.fromURI(uri, this.onPlaylist);
    } else if (uri.indexOf('artist:') !== -1) {
      Spotify.models.Artist.fromURI(uri, this.onArtist);
    } else if (uri.indexOf('track:') !== -1) {
      Spotify.models.Track.fromURI(uri, this.onTrack);
    } else if (uri.indexOf('album:') !== -1) {
      Spotify.models.Album.fromURI(uri, this.onAlbum);
    } else if (uri.indexOf('user:') !== -1) {
      Spotify.models.User.fromURI(uri, this.onUser);
    } else {

    }
  };

  ml.DragHandler = DragHandler;

})(window.Musicline);
