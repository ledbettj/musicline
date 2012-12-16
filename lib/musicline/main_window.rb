require 'gir_ffi-gtk3'

class Musicline::MainWindow < Gtk::Window
  def initialize(*args)
    super
    require 'pry'
    binding.pry
    GObject.signal_connect(self, 'destroy') do
      Gtk.main_quit
    end

  end
end
