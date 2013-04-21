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
