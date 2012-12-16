require File.expand_path('../config/environment', __FILE__)

# Start the service & resque-web server
run Rack::URLMap.new(
  '/' => Musicline::Application
)
