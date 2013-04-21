// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-
/*
 * Author: 
 * fortime <palfortime@gmail.com>
 *
 * License:
 * This file is part of SSH_D-palfortime.gmail.com(SSH_D for short in the following).
 * 
 * SSH_D is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * SSH_D is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with SSH_D.  If not, see <http://www.gnu.org/licenses/>.
 * 
 */

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
const Logger = ThisExtension.imports.logger;
const Prompter = ThisExtension.imports.prompter;
const Prefs = ThisExtension.imports.prefs;

let logger = new Logger.Logger();
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
        this._gsettings = Prefs.getSettings();
    },

    _handleSSHDToggle: function(actor, event) {
        let msg = '';
        let handleFunction = null;
        if (prompt == null) {
            prompt = new Prompter.PasswdPrompt(this, this._onGetPasswd);
            logger.debug(prompt);
        }
        if (event) {
            msg = 'Connecting';
            prompt.open();
        } 
        else {
            msg = 'Disconnecting';
            handleFunction = this.disconnectSSHDProxy;
        }
        this.sendNotification(msg);
        if (handleFunction != null)
            handleFunction();
    },

    _onGetPasswd: function(object, passwd) {
        if (passwd != null && passwd != '')
            object.connectSSHDProxy(passwd);
        else
            object._sshdToggle.toggle();
    },

    connectSSHDProxy: function(passwd) {
        logger.debug('doing connection');
        this._runningMode = 'daemon';
        this._pidFile = this._gsettings.get_string(Prefs.PID_FILE_PATH_KEYNAME);
        this._localHost = this._gsettings.get_string(Prefs.LOCAL_HOST_KEYNAME);
        this._localPort = this._gsettings.get_int(Prefs.LOCAL_PORT_KEYNAME);
        this._relayAddress = this._localHost + ':' + this._localPort;
        this._remoteHost = this._gsettings.get_string(Prefs.REMOTE_HOST_KEYNAME);
        this._remotePort = this._gsettings.get_int(Prefs.REMOTE_PORT_KEYNAME);
        this._user = this._gsettings.get_string(Prefs.USER_KEYNAME);
        let scriptsPath = ThisExtension.dir.get_child('scripts').get_path();
        /*
        let [res, pid, inFD, outFD, errFD] = GLib.spawn_async_with_pipes(null, ['/tmp/test.sh'], null, 0, null); 
        */
        let [res, pid, inFD, outFD, errFD] = GLib.spawn_async_with_pipes(null, 
                [scriptsPath + '/sshdd.sh',
                    '-m' + this._runningMode,
                    '-f' + this._pidFile,
                    '-D' + this._relayAddress,
                    '-h' + this._remoteHost,
                    '-p' + this._remotePort,
                    '-u' + this._user],
                null, 0, null);
        let writer = new Gio.DataOutputStream({
            base_stream: new Gio.UnixOutputStream({fd: inFD})
        });
        let data = [passwd, ""].join("\n");
        writer.put_string(data, null);
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
let prompt = null;
let prompter = null;

function enable() {
    indicator = new SSHDProxyIndicator(); 
    Main.panel.addToStatusArea('sshdproxy', indicator, 2);
    //Main.panel._rightBox.insert_child_at_index(button, 0);
}

function disable() {
    //Main.panel._rightBox.remove_child(button);
    indicator.destroy();
    //prompter.disable();
}
