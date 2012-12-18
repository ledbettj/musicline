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

    this.addSimilar(this.vis.createNode('Minus the Bear'));
    this.vis.redraw();
  };

  Application.prototype.nodeClick = function(d) {
    if (!d.spent) {
      this.addSimilar(d);
      d.spent = true;
    }
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
