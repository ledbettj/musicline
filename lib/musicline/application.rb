class Musicline::Application < Sinatra::Base
  API_KEY = 'R2TFDDCFU7ZZUMTCR'

  get '/artists/:artist/similar' do

    params[:fMin] = (params[:fMin] || 0).to_i   / 100.0
    params[:fMax] = (params[:fMax] || 100).to_i / 100.0
    params[:rNum] = (params[:rNum] || 15).to_i

    items = echo.artist(params[:artist]).similar(
      :min_familiarity => params[:fMin],
      :max_familiarity => params[:fMax],
      :results         => params[:rNum]
    )['artists'].map do |row|
      row['name']
    end

    JSON.dump(items)
  end

  get '/artists/:artist/clip' do
    response = echo.song.search(
      :bucket => ['id:7digital-US', 'tracks'],
      :results => 5,
      :artist => params[:artist],
      :song_type => 'studio'
    )

    begin
      JSON.dump({:url => response['songs'].sample['tracks'].sample['preview_url']})
    rescue
      status 204
    end
  end

  private

  def echo
    @echo ||= Echonest(API_KEY)
  end
end
