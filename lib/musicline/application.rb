class Musicline::Application < Sinatra::Base
  API_KEY = 'R2TFDDCFU7ZZUMTCR'

  get '/artists/:artist/similar' do
    items = echo.artist(params[:artist]).similar['artists'].map do |row|
      row['name']
    end

    JSON.dump(items)
  end

  def echo
    @echo ||= Echonest(API_KEY)
  end
end
