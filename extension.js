const GLib = imports.gi.GLib;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const St = imports.gi.St;
const ExtensionUtils = imports.misc.extensionUtils;
const Util = imports.misc.util;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const MessageTray = imports.ui.messageTray;
const Tweener = imports.ui.tweener;

const ThisExtension = ExtensionUtils.getCurrentExtension();

Logger.prototype = {
    _init: function() {
        this._levelMap = {
                'test' : 1,
                'debug' : 2, 
                'warn' : 3, 
                'error' : 4};
    },
    _logLevel: 1,
    changeLogLevel: function(targetLevel) {
        this._logLevel = targetLevel;
    },
    debug: function(msg) {
        this.log_('debug', msg);
    },
    error: function(msg) {
        this.log_('error', msg);
    },
    log_: function(type, msg) {
        let typeLevel = this._levelMap[type];
        if (typeLevel >= this._logLevel)
            log(type + ": " + msg);
    },
    test: function(msg) {
        this.log_('test', msg);
    },
    warn: function(msg) {
        this.log_('warn', msg);
    }
}

function Logger() {
    this._init();
}

let logger = new Logger();
logger.changeLogLevel(1);

SSHDProxyIndicator.prototype = {
    __proto__: PanelMenu.Button.prototype,

    _init: function() {
		PanelMenu.Button.prototype._init.call(this, St.Align.START);
        
        // add our icons path for searching
        Gtk.IconTheme.get_default().append_search_path(ThisExtension.dir.get_child('icons').get_path());

        // add icon
        this._proxyIcon = new St.Icon({icon_name: 'proxy-enabled-symbolic', 
            style_class: 'system-status-icon'});
        this._layoutManager = new St.BoxLayout({vertical: false, 
            style_class: 'sshdproxy-container'});
        this._layoutManager.add(this._proxyIcon);
        this.actor.add_actor(this._layoutManager);
        this._proxyIcon.show();

        // add sub menu
        this._sshdToggle = new PopupMenu.PopupSwitchMenuItem(_('SSHD'));
        this._sshdToggle.connect('toggled', Lang.bind(this, this._handleSSHDToggle));
        this.menu.addMenuItem(this._sshdToggle);
    },

    _handleSSHDToggle: function(actor, event) {
        let msg = '';
        let handleFunction;
        if (event) {
            msg = 'Connecting';
            handleFunction = this.connectSSHDProxy;
        } 
        else {
            msg = 'Disconnecting';
            handleFunction = this.disconnectSSHDProxy;
        }
        this.sendNotification(msg);
        handleFunction();
    },

    connectSSHDProxy: function() {
        logger.debug('doing connection');
        this._runningMode = 'daemon';
        this._pidFile = '/tmp/sshdd.pid';
        this._relayAddress = '127.0.0.1:7221';
        this._host = '127.0.0.1';
        this._port = '8888';
        this._user = 'f_public';
        let scriptsPath = ThisExtension.dir.get_child('scripts').get_path();
        Util.spawn([scriptsPath + '/sshdd.sh',
                '-m' + this._runningMode,
                '-f' + this._pidFile,
                '-D' + this._relayAddress,
                '-h' + this._host,
                '-p' + this._port,
                '-u' + this._user]);
    },

    disconnectSSHDProxy: function() {
        logger.debug('doing disconnection');
        this._pidFile = '/tmp/sshdd.pid';
        let scriptsPath = ThisExtension.dir.get_child('scripts').get_path();
        Util.spawn([scriptsPath + '/sshdd.sh',
                '-mkiller',
                '-f' + this._pidFile]);
    },

    sendNotification: function(msg) {
        logger.debug(msg);
        let source = new MessageTray.SystemNotificationSource();
        Main.messageTray.add(source);
        let notification;
        notification = new MessageTray.Notification(source, msg, null);
        notification.setTransient(true);
        notification.setResident(false);
        source.notify(notification);
    }
}

function SSHDProxyIndicator() {
    this._init();
}

function init() {
}

let indicator;

function enable() {
    indicator = new SSHDProxyIndicator(); 
    Main.panel.addToStatusArea('sshdproxy', indicator, 2);
    //Main.panel._rightBox.insert_child_at_index(button, 0);
}

function disable() {
    //Main.panel._rightBox.remove_child(button);
    indicator.destroy();
}
