class Musicline::Application < Sinatra::Base
  API_KEY = 'R2TFDDCFU7ZZUMTCR'

  get '/artists/:artist/similar' do

    params[:fMin] = (params[:fMin] || 0).to_i   / 100.0
    params[:fMax] = (params[:fMax] || 100).to_i / 100.0

    items = echo.artist(params[:artist]).similar(
      :min_familiarity => params[:fMin],
      :max_familiarity => params[:fMax]
    )['artists'].map do |row|
      row['name']
    end

    JSON.dump(items)
  end

  def echo
    @echo ||= Echonest(API_KEY)
  end
end
