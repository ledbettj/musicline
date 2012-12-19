
(function() {
  var api = getSpotifyApi();
  var models = api.require("$api/models");

  window.Spotify = {
    api:    api,
    models: models
  };

})();
