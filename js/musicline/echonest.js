/*jshint undef:true browser:true devel:true*/
/*global d3 _ getSpotifyApi*/

window.Musicline = window.Musicline || {};

(function(ml) {

  var baseUrl = "http://developer.echonest.com/api/v4/artist/similar";

  function toParam(obj) {
    var q = '?';
    for(var key in obj) {
      q += encodeURIComponent(key) + '=';
      q += encodeURIComponent(obj[key].toString()) + '&';
    }

    return q;
  }

  var Echonest = function(params) {
    this.apiKey  = params.apiKey;
  };

  Echonest.prototype.getSimilar = function(artistName, opts, callback) {
    opts = this.defaultOptions(opts);

    var query = toParam({
      name:            artistName,
      min_familiarity: opts.familiarity[0],
      max_familiarity: opts.familiarity[1],
      results:         opts.perPage,
      api_key:         this.apiKey
    });

    d3.json(baseUrl + query, function(data) {
      var artists = _.map(data.response.artists, function(row) {
        return row.name;
      });
      callback(artists);
    });
  };


  Echonest.prototype.defaultOptions = function(opts) {
    opts.familiarity = opts.familiarity || [0, 1];
    opts.perPage     = opts.perPage     || 15;
    return opts;
  };

  ml.Echonest = Echonest;

})(window.Musicline);
