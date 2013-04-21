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
 * Additional:
 * Thist file bases on 'prefs.js' and 'lib.js' from transmission-daemon@patapon.info.
 */

const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const ExtensionUtils = imports.misc.extensionUtils;
const ThisExtension = ExtensionUtils.getCurrentExtension();
const Logger = ThisExtension.imports.logger;

const USER_KEYNAME = "user";
const REMOTE_HOST_KEYNAME = "remote-host";
const REMOTE_PORT_KEYNAME = "remote-port";
const LOCAL_HOST_KEYNAME = "local-host";
const LOCAL_PORT_KEYNAME = "local-port";
const PID_FILE_PATH_KEYNAME = "pid-file-path";
const DomainName = 'gnome-shell-extensions-ssh_d';
const SchemaName = 'org.gnome.shell.extensions.ssh_d';
const Gettext = imports.gettext.domain(DomainName);
const _ = Gettext.gettext;

let gsettings = null;
let settings;
let logger = new Logger.Logger();
logger.changeLogLevel(1);

function init() {
    returnGSettings();
    settings = {
        user: {label: _("Username"), help: _('Username for ssh'), type: 's'},
        remote_host: {label: _("RemoteHost"), help: _('Hostname or IP where ssh connects to'), type: 's'},
        remote_port: {label: _("RemotePort"), help: _('Port where ssh connects to'), type: 'i'},
        local_host: {label: _("LocalHost"), help: _('Hostname or IP where ssh listens to'), type: 's'},
        local_port: {label: _("LocalPort"), help: _('Port where ssh listens to'), type: 'i'},
        pid_file_path: {label: _("PidFilePath"), help: _('Path keeps the pid file'), type: 's'},
    }
}

function buildPrefsWidget() {
    let frame = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL,
                             border_width: 10 });
    let vbox = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL,
                            margin: 20, margin_top: 10 });
    let hbox;
    for (setting in settings) {
        if (settings[setting].type == 's')
            hbox = createStringSetting(setting);
        if (settings[setting].type == "i")
            hbox = createIntSetting(setting);
        if (settings[setting].type == "b")
            hbox = createBoolSetting(setting);
        vbox.add(hbox);
    }
    frame.add(vbox);
    frame.show_all();
    return frame;
}

function createStringSetting(setting) {
    let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL,
                            margin_top: 5});
    let setting_label = new Gtk.Label({label: settings[setting].label,
                                       xalign: 0 });
    let setting_string = new Gtk.Entry({text: gsettings.get_string(setting.replace(/_/g, '-'))});
    setting_string.connect('notify::text', function(entry) {
        gsettings.set_string(setting.replace(/_/g, '-'), entry.text);
    });

    if (settings[setting].mode == "passwd") {
        setting_string.set_visibility(false);
    }

    if (settings[setting].help) {
        setting_label.set_tooltip_text(settings[setting].help)
        setting_string.set_tooltip_text(settings[setting].help)
    }
    hbox.pack_start(setting_label, true, true, 0);
    hbox.add(setting_string);
    return hbox;
}

function createIntSetting(setting) {
    let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL,
                            margin_top: 5});
    let setting_label = new Gtk.Label({label: settings[setting].label,
                                       xalign: 0 });
    let adjustment = new Gtk.Adjustment({ lower: 1, upper: 65535, step_increment: 1});
    let setting_int = new Gtk.SpinButton({adjustment: adjustment,
                                          snap_to_ticks: true});
    setting_int.set_value(gsettings.get_int(setting.replace(/_/g, '-')));
    setting_int.connect('value-changed', function(entry) {
        gsettings.set_int(setting.replace(/_/g, '-'), entry.value);
    });
    if (settings[setting].help) {
        setting_label.set_tooltip_text(settings[setting].help)
        setting_int.set_tooltip_text(settings[setting].help)
    }
    hbox.pack_start(setting_label, true, true, 0);
    hbox.add(setting_int);
    return hbox;
}

function createBoolSetting(setting) {
    let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL,
                            margin_top: 5});
    let setting_label = new Gtk.Label({label: settings[setting].label,
                                       xalign: 0 });
    let setting_switch = new Gtk.Switch({active: gsettings.get_boolean(setting.replace(/_/g, '-'))});
    setting_switch.connect('notify::active', function(button) {
        gsettings.set_boolean(setting.replace(/_/g, '-'), button.active);
    });
    if (settings[setting].help) {
        setting_label.set_tooltip_text(settings[setting].help)
        setting_switch.set_tooltip_text(settings[setting].help)
    }
    hbox.pack_start(setting_label, true, true, 0);
    hbox.add(setting_switch);
    return hbox;
}

function returnGSettings() {
    if (gsettings == null) {
        initTranslations();
        gsettings = getSettings();
    }
    return gsettings;
}

function getSettings() {
    let schemaDir = ThisExtension.dir.get_child('schemas').get_path();

    if (GLib.file_test(schemaDir + '/gschemas.compiled', GLib.FileTest.EXISTS)) {
        // Extension installed in .local
        let schemaSource = Gio.SettingsSchemaSource.new_from_directory(schemaDir,
                                  Gio.SettingsSchemaSource.get_default(),
                                  false);
        let schema = schemaSource.lookup(SchemaName, false);
        return new Gio.Settings({ settings_schema: schema });
    }
    else {
        // Extension installed system-wide
        if (Gio.Settings.list_schemas().indexOf(SchemaName) == -1)
            throw "Schema \"%s\" not found.".format(SchemaName);
        return new Gio.Settings({ schema: SchemaName });
    }
}

function initTranslations() {
    let localeDir = ThisExtension.dir.get_child('locale').get_path();

    if (GLib.file_test(localeDir, GLib.FileTest.EXISTS)) {
        // Extension installed in .local
        imports.gettext.bindtextdomain(DomainName, localeDir);
    }
    else {
        // Extension installed system-wide
        imports.gettext.bindtextdomain(DomainName, ThisExtension.metadata.locale);
    }
}
