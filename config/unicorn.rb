worker_processes 4

pid "/var/run/vitrue/trey.pid"

preload_app(true)

before_exec do
  Trey.just_about_to_fork
end

after_fork do |server, worker|
  Trey.just_forked
end
