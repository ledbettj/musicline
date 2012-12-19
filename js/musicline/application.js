/*jshint undef:true browser:true devel:true*/
/*global d3 _ getSpotifyApi*/

window.Musicline = window.Musicline || {};

(function(ml) {

  var Application = function(params) {
    this.familiarity = params.familiarity || [0, 100];
    this.growBy      = params.growBy      || 15;

    this.api    = getSpotifyApi();
    this.models = this.api.require('$api/models');
    this.dnd    = this.api.require('$util/dnd');


    this.echo = new ml.Echonest({
      apiKey: 'R2TFDDCFU7ZZUMTCR'
    });


    this.vis = new ml.Visualization({
      nodeClick: this.nodeClick.bind(this)
    });

    this.playlist = new this.models.Playlist();

    this.addHTML5DropHandlers();

    this.models.application.observe(this.models.EVENT.LINKSCHANGED, this.handleDrop.bind(this));
    this.vis.redraw();

    this._first = true;
  };

  Application.prototype.addHTML5DropHandlers = function() {
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
      var item = e.dataTransfer.getData('Text');
      if (item.indexOf('playlist:') !== -1) {
        this.vis.clear();
        this.handlePlaylistDrop(item);
      } else if (item.indexOf('artist:') !== -1) {
        this.handleArtistDrop(item, e);
      } else {
        console.log("unhandled", item);
      }
      this.vis.redraw();
      return false;
    }.bind(this), false);
  };

  Application.prototype.handleDrop = function() {

    _(this.models.application.links).each(function(item) {
      if (item.indexOf('playlist:') !== -1) {
        this.vis.clear();
        this.handlePlaylistDrop(item);
      } else if (item.indexOf('artist:') !== -1) {
        this.handleArtistDrop(item);
      } else {
        console.log("unhandled", item);
      }
    }.bind(this));

    this.redraw();
  };

  Application.prototype.handlePlaylistDrop = function(plCode) {
    var pl = this.models.Playlist.fromURI(plCode);
    var newNodes = [];

    _(pl.tracks).each(function(track) {
      if (!this.vis.findNode(track.artists[0].name)) {
        var n = this.vis.createNode(track.artists[0].name);
        newNodes.push(n);
      }
    }.bind(this));

    _(newNodes).each(function(n) {
      n.spent = true;
      this.addSimilar(n);
    }.bind(this));

  };

  Application.prototype.handleArtistDrop = function(artistCode, e) {

    this.models.Artist.fromURI(artistCode, function(artist) {
      if (!this.vis.findNode(artist.name)) {
        var n = this.vis.createNode(artist.name, e);
        n.spent = true;
        this.addSimilar(n);
        this.play(n);
      } else {
      }
    }.bind(this));


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

    var search = new this.models.Search(d.name, {
      searchArtists:   false,
      searchAlbums:    false,
      searchPlaylists: false,
      searchTracks:    true,
      pageSize:        10
    });

    search.observe(this.models.EVENT.CHANGE, function() {
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
          app.models.player.play(tracks[0], app.playlist);
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
