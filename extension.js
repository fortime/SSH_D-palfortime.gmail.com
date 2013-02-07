const GLib = imports.gi.GLib;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const St = imports.gi.St;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const Tweener = imports.ui.tweener;
const ExtensionUtils = imports.misc.extensionUtils;

const ThisExtension = ExtensionUtils.getCurrentExtension();

let text, button;
let indicator;

SSHDProxyIndicator.prototype = {
    __proto__: PanelMenu.Button.prototype,

    _init: function() {
		PanelMenu.Button.prototype._init.call(this, St.Align.START);
	    // __proto__._init.call(this, St.Align.START);
        
        // add our icons path for searching
        Gtk.IconTheme.get_default().append_search_path(ThisExtension.dir.get_child('icons').get_path());

        this.proxyIcon = new St.Icon({icon_name: "proxy-enabled-symbolic", 
            style_class: 'system-status-icon'});
        this.layoutManager = new St.BoxLayout({vertical: false, 
            style_class: 'ssdproxy-container'});
        this.layoutManager.add(this.proxyIcon);
        this.actor.add_actor(this.layoutManager);
        this.proxyIcon.show();
    }
}

function SSHDProxyIndicator() {
    this._init();
}

function init() {
}

function enable() {
    indicator = new SSHDProxyIndicator(); 
    Main.panel.addToStatusArea('sshdproxy', indicator, 2);
    //Main.panel._rightBox.insert_child_at_index(button, 0);
}

function disable() {
    //Main.panel._rightBox.remove_child(button);
    indicator.destroy();
}
