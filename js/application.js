/*jshint undef:true browser:true devel:true*/
/*global d3 _ getSpotifyApi*/

window.Musicline = window.Musicline || {};

(function(ml) {

  var Application = function(params) {
    this.familiarity = params.familiarity || [0, 100];
    this.growBy      = params.growBy      || 15;

    this.api    = getSpotifyApi();
    this.models = this.api.require('$api/models');

    this.vis = new ml.Visualization({
      nodeClick: this.nodeClick.bind(this)
    });

    var body = d3.select('body').node();

    body.addEventListener('dragenter', function(e) {
      return false;
    }, false);

    body.addEventListener('dragover', function(e) {

      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';

      return false;
    }, false);

    body.addEventListener('dragleave', function(e) {
      return false;
    }, false);

    body.addEventListener('dragend', function(e) {
      console.log('end', e);

    }, false);

    body.addEventListener('drop', function(e) {
      var item = e.dataTransfer.getData('Text');
      this.vis.clear();
      if (item.indexOf('playlist:') !== -1) {
        this.handlePlaylistDrop(item);
      } else if (item.indexOf('artist:') !== -1) {
        this.handleArtistDrop(item);
      } else {
        console.log("unhandled", item);
      }
      this.vis.redraw();
      return false;
    }.bind(this), false);


    this.models.application.observe(this.models.EVENT.LINKSCHANGED, this.handleDrop.bind(this));
    this.vis.redraw();
  };

  Application.prototype.handleDrop = function() {
    this.vis.clear();

    _(this.models.application.links).each(function(item) {
      if (item.indexOf('playlist:') !== -1) {
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

  Application.prototype.handleArtistDrop = function(artistCode) {

    this.models.Artist.fromURI(artistCode, function(artist) {
      if (!this.vis.findNode(artist.name)) {
        console.log('created', artist.name);
        var n = this.vis.createNode(artist.name);
        n.spent = true;
        this.addSimilar(n);
        this.play(n);
      } else {
        console.log('found', artist.name);
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

    d3.json(
      'http://developer.echonest.com/api/v4/artist/similar' +
        ml.util.toParam({
          name: from.name,
          min_familiarity: this.familiarity[0] / 100,
          max_familiarity: this.familiarity[1] / 100,
          results: this.growBy,
          api_key: ml.util.API_KEY
        }),

      function(similar) {
        similar = similar.response.artists;

        _(similar).each(function(artist){
          var node = (this.vis.findNode(artist.name) ||
                      this.vis.createNode(artist.name, from));

          this.vis.linkNodes(from, node);
        }.bind(this));

        this.vis.redraw();
      }.bind(this));
  };

  Application.prototype.play = function(d) {
    var app = this;
    var search = new this.models.Search(d.name, {
      searchArtists: false,
      searchAlbums:  false,
      searchPlaylists: false,
      searchTracks: true
    });

    var playlist = new this.models.Playlist();

    search.observe(this.models.EVENT.CHANGE, function() {
      search.tracks.forEach(function(track) {
        if (track.artists[0].name.toLowerCase() == d.name.toLowerCase()) {
          playlist.add(track);
        }
      });
      app.models.player.play(playlist.get(0), playlist);
    });

    search.appendNext();
  };

  ml.Application = Application;

})(window.Musicline);
