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

    this.dnd = new ml.DragHandler({});

    this.dnd.onArtist = function(artist) {
      this.maybeCreateArist(artist.name, this.dnd.dropEvent);
    }.bind(this);

    this.dnd.onPlaylist = function(pl) {
      _.each(pl.tracks, function(track) {
        this.maybeCreateArist(track.artists[0].name, this.dnd.dropEvent);
      }.bind(this));
      this.vis.redraw();
    }.bind(this);

    this.dnd.onTrack = function(track) {
      this.maybeCreateArist(track.artists[0].name, this.dnd.dropEvent);
      this.vis.redraw();
    }.bind(this);

    this.playlist = new Spotify.models.Playlist();
    this.vis.redraw();


    Spotify.models.player.observe(Spotify.models.EVENT.CHANGE, function(e) {
      var track = null, n = null;
      if (e.type == "playerStateChanged") {
        d3.select('.animation').remove();
        if (e.data.curtrack && (track = Spotify.models.player.track) &&
            (n = this.vis.findNode(track.artists[0].name))) {
          this.vis.pulseOn(n);
        } else {
          this.vis.pulseOff();
        }
      }
    }.bind(this));

    this._first = true;
  };

  Application.prototype.maybeCreateArist = function(name, parent) {
    if (!this.vis.findNode(name)) {
      var n = this.vis.createNode(name, parent);
      n.spent = true;
      this.addSimilar(n);
      this.play(n);
    }
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


  Application.prototype.restart = function() {
    this.vis.clear();
    this.vis.redraw();
    this.playlist = new Spotify.models.Playlist();
    this._first = true;
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
