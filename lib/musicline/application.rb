class Musicline::Application < Sinatra::Base
  API_KEY = 'R2TFDDCFU7ZZUMTCR'

  get '/artist/:artist/similar' do
    JSON.dump(echo.artist(params[:artist]).similar['artists'])
  end

  def echo
    @echo ||= Echonest(API_KEY)
  end
end
