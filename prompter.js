// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-
/*
 * Author: fortime <palfortime@gmail.com>
 *
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

const Lang = imports.lang;
const Shell = imports.gi.Shell;
const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const Pango = imports.gi.Pango;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Gcr = imports.gi.Gcr;

const CheckBox = imports.ui.checkBox;
const ModalDialog = imports.ui.modalDialog;
const ShellEntry = imports.ui.shellEntry;

const ProxyPasswordDialog = new Lang.Class({
    Name: 'ProxyPasswordDialog',
    Extends: ModalDialog.ModalDialog,

    _init: function(message, flags) {
        let strings = message.split('\n');
        this.parent({ styleClass: 'prompt-dialog' });

        let mainContentBox = new St.BoxLayout({ style_class: 'prompt-dialog-main-layout',
                                                vertical: false });
        this.contentLayout.add(mainContentBox);

/*
        let icon = _createIcon(gicon);
        mainContentBox.add(icon,
                           { x_fill:  true,
                             y_fill:  false,
                             x_align: St.Align.END,
                             y_align: St.Align.START });
*/

        this._messageBox = new St.BoxLayout({ style_class: 'prompt-dialog-message-layout',
                                              vertical: true });
        mainContentBox.add(this._messageBox,
                           { y_align: St.Align.START, expand: true, x_fill: true, y_fill: true });

        let subject = new St.Label({ style_class: 'prompt-dialog-headline' });
        this._messageBox.add(subject,
                             { y_fill:  false,
                               y_align: St.Align.START });
        if (strings[0])
            subject.set_text(strings[0]);

        let description = new St.Label({ style_class: 'prompt-dialog-description' });
        description.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;
        description.clutter_text.line_wrap = true;
        this._messageBox.add(description,
                            { y_fill:  true,
                              y_align: St.Align.START });
        if (strings[1])
            description.set_text(strings[1]);

        this._passwordBox = new St.BoxLayout({ vertical: false, style_class: 'prompt-dialog-password-box' });
        this._messageBox.add(this._passwordBox);
        this._passwordLabel = new St.Label(({ style_class: 'prompt-dialog-password-label',
                                              text: _("Password") }));
        this._passwordBox.add(this._passwordLabel, { y_fill: false, y_align: St.Align.MIDDLE });
        this._passwordEntry = new St.Entry({ style_class: 'prompt-dialog-password-entry',
                                             text: "",
                                             can_focus: true});
        ShellEntry.addContextMenu(this._passwordEntry, { isPassword: true });
        this._passwordEntry.clutter_text.connect('activate', Lang.bind(this, this._onEntryActivate));
        this._passwordEntry.clutter_text.set_password_char('\u25cf'); // ● U+25CF BLACK CIRCLE
        this._passwordBox.add(this._passwordEntry, {expand: true });
        this.setInitialKeyFocus(this._passwordEntry);
        this._errorMessageLabel = new St.Label({ style_class: 'prompt-dialog-error-label',
                                                 text: _("Sorry, that didn\'t work. Please try again.") });
        this._errorMessageLabel.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;
        this._errorMessageLabel.clutter_text.line_wrap = true;
        this._errorMessageLabel.hide();
        this._messageBox.add(this._errorMessageLabel);

        let buttons = [{ label: _("Cancel"),
                         action: Lang.bind(this, this._onCancelButton),
                         key:    Clutter.Escape
                       },
                       { label: _("Unlock"),
                         action: Lang.bind(this, this._onUnlockButton),
                         default: true
                       }];

        this.setButtons(buttons);
    },

    reaskPassword: function() {
        this._passwordEntry.set_text('');
        this._errorMessageLabel.show();
    },

    _onCancelButton: function() {
        this.emit('response', '');
        this.close();
    },

    _onUnlockButton: function() {
        this._onEntryActivate();
    },

    _onEntryActivate: function() {
		this.emit('response', 
            this._passwordEntry.get_text());
    }
});

PasswdPrompt.prototype = {
    __proto__: ProxyPasswordDialog.prototype,
    
    _init: function(object, cb) {
        ProxyPasswordDialog.prototype._init.call(this, _("Sorry, I can't find how to fetch password from keyring.\nThis is a simple password prompter."), true);
        this._cbObject = object;
        this._cb = cb;

        // response
        this._responseId = this.connect('response', Lang.bind(this, this._onResponse));
    },

    _onResponse: function(object, passwd) {
        this._cb(this._cbObject, passwd);
        this.close();
    }
};

function PasswdPrompt(object, cb) {
    this._init(object, cb);
}
