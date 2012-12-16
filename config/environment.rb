# Get lib into the load path
$LOAD_PATH.unshift(File.expand_path('../../lib', __FILE__))

require 'rubygems'
require 'bundler/setup'
require 'echonest'

requireables = [:default]
Bundler.require(*requireables)

require 'musicline'
