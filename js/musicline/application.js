/*jshint undef:true browser:true devel:true*/
/*global d3 _ Spotify*/

window.Musicline = window.Musicline || {};

(function(ml) {

  var Application = function(params) {
    this.echo = new ml.Echonest({
      apiKey: 'R2TFDDCFU7ZZUMTCR'
    });

    this.vis = new ml.Visualization({
      nodeClick: this.nodeClick.bind(this)
    });

    this.dnd = new ml.DragHandler({
      onArtist:   function(artist) {
        if (!this.vis.findNode(artist.name)) {
          var n = this.vis.createNode(artist.name, this.dnd.dropEvent);
          n.spent = true;
          this.addSimilar(n);
          this.vis.redraw();
          this.play(n);
        }
      }.bind(this),
      onPlaylist: function(pl) {
        this.vis.clear();
        _.each(pl.tracks, function(track) {
          if (!this.vis.findNode(track.artists[0].name)) {
            var n = this.vis.createNode(track.artists[0].name, this.dnd.dropEvent);
            n.spent = true;
            this.addSimilar(n);
          }
          this.vis.redraw();
        }.bind(this));
      }.bind(this)
    });

    this.playlist = new Spotify.models.Playlist();
    this.vis.redraw();

    this._first = true;
  };

  Application.prototype.nodeClick = function(d) {
    if (!d.spent) {
      this.addSimilar(d);
      d.spent = true;
    }
    this.play(d);
  };

  Application.prototype.addSimilar = function(from) {

    this.echo.getSimilar(from.name, {}, function(artists) {
      _.each(artists, function(artist){
        var node = (this.vis.findNode(artist) || this.vis.createNode(artist, from));
        this.vis.linkNodes(from, node);
      }.bind(this));

      this.vis.redraw();
    }.bind(this));
  };

  Application.prototype.play = function(d) {
    var app = this;

    var search = new Spotify.models.Search(d.name, {
      searchArtists:   false,
      searchAlbums:    false,
      searchPlaylists: false,
      searchTracks:    true,
      pageSize:        10
    });

    search.observe(Spotify.models.EVENT.CHANGE, function() {
      var tracks = [];

      search.tracks.forEach(function(t) {
        tracks.push(t);
      });

      tracks = _.filter(tracks, function(track) {
        return track.artists[0].name.decodeForText().toLowerCase() == d.name.toLowerCase();
      });

      console.log("before shuffle");
      tracks = _(tracks).shuffle().take(3).value();
      console.log('after shuffle', tracks);

      _.each(tracks, function(track) {
        app.playlist.add(track);
        console.log('added', track);
      });

      if (app._first) {
        try {
          Spotify.models.player.play(tracks[0], app.playlist);
        }catch(err) {
          console.log("ERR", err);
        }
        app._first = false;
      }
    }.bind(this));


    search.appendNext();
  };

  ml.Application = Application;

})(window.Musicline);
