/**********************************************
 * Copyright (C) 2014 Lukas Laag
 * This file is part of dictaphone.js.
 * 
 * dictaphone.js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * dictaphone.js is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with dictaphone.js.  If not, see http://www.gnu.org/licenses/
 **********************************************/
define([], function() {
  function ViewStack() {
    this.stack = [];
  }

  ViewStack.prototype.peek = function peek() {
    var len = this.stack.length;
    return len ? this.stack[len - 1] : null;
  };

  ViewStack.prototype.findView = function findView(view) {
    var i, len, entry;
    for (i = 0, len = this.stack.length; i < len; i++) {
      entry = this.stack[i];
      if (entry.view === view) {
        return i;
      }
    }
    return -1;
  };

  ViewStack.prototype.showMenu = function showMenu() {
    var topEntry = this.peek(),
      len = this.stack.length;
    if (topEntry) {
      if (topEntry.replace) {
        this.display([
          ////////////////////////////////////////////////////////////
          // Show the menu with transition
          ////////////////////////////////////////////////////////////
          { view: topEntry.view, trans:true },
          { view: topEntry.view, hpos: 'hmid' },
          { view: topEntry.view, trans:false }
        ]);
      } else if (len > 1) {
        ////////////////////////////////////////////////////////////
        // Remove the view
        ////////////////////////////////////////////////////////////
        this.stack.splice(len - 1, 1);
        this.display([{ view: this.stack[len - 2].view, visible:true, trans:false},
          { view: topEntry.view, trans:true},
          { view: topEntry.view,  hpos: 'hright'},
          { view: topEntry.view,  trans:false}]);
      }
    }
  };

  ViewStack.prototype.showView = function showView(view, replace, callback) {
    var topEntry = this.peek(),
      entry = {view:view, replace: replace},
      len = this.stack.length,
      index = this.findView(view),
      i, states = [];

    if (!topEntry) {
      ////////////////////////////////////////////////////////////
      // Nothing is currently displayed, show the view without transition
      ////////////////////////////////////////////////////////////
      this.stack.push(entry);
      this.display([
        { view: view, visible: false, trans:false, hpos: 'hleft', zpos: 'zmid' },
        { view: view, visible: true }
      ], callback);
      return;
    }
    if (topEntry.view === view && view.hasClass('hmid')) {
      ////////////////////////////////////////////////////////////
      // Hide the menu
      ////////////////////////////////////////////////////////////
      this.display([
        // Show the menu with transition
        { view: topEntry.view, trans:true },
        { view: topEntry.view, hpos: 'hleft' },
        { view: topEntry.view, trans:false }
      ], callback);
      return;
    }
    if (index !== -1 && !replace) {
      ////////////////////////////////////////////////////////////
      // The view is already in the stack, obscured by other views
      // Remove the obscuring views
      ////////////////////////////////////////////////////////////
      for (i = index + 1; i < len - 1; i++) {
        states.push({ view: this.stack[i].view, visible:false, trans:false});
      }
      states.push({ view: this.stack[index].view, visible:true, trans:false});
      if (index < len - 1) {
        states.push({ view: this.stack[len - 1].view, trans:true});
        states.push({ view: this.stack[len - 1].view,  hpos: 'hright'});
        states.push({ view: this.stack[len - 1].view,  trans:false});
      }
      this.stack.splice(index + 1, len - (index + 1));
      this.display(states, callback);
      return;
    }

    if (topEntry.view === view && typeof view.lazyRender === 'function') {
      ////////////////////////////////////////////////////////////
      // Necessary hack because of seekbars
      ////////////////////////////////////////////////////////////
      this.display([
        { view: view, visible: true }
      ], callback);

    } else {

      ////////////////////////////////////////////////////////////
      // Make the new view appear from the right
      // to obscure the topView
      ////////////////////////////////////////////////////////////
      if (replace) {
        this.stack[this.stack.length - 1] = entry;
      } else {
        this.stack.push(entry);
      }
      this.display([
        { view: view, visible: false, trans:false, hpos: 'hright', zpos: 'ztop' },
        { view: view, visible: true, trans:true },
        { view: view, hpos: 'hleft' },
        { view: topEntry.view, visible: false },
        { view: view, trans:false, zpos: 'zmid' }
      ], callback);
    }
  };

  ViewStack.prototype.display = function display(states, callback) {
    var state;
    if (states.length) {
      state = states.shift();
      if (state.hasOwnProperty('hpos')) {
        state.view.setHPos(state.hpos);
      }
      if (state.hasOwnProperty('zpos')) {
        state.view.setZPos(state.zpos);
      }
      if (state.hasOwnProperty('visible')) {
        state.view.setVisible(state.visible);
        // Necessary hack because of seekbars
        // The view must be displayed so that the seekbars have
        // proper dimensions for initialization
        if (state.visible && typeof state.view.lazyRender === 'function') {
          state.view.lazyRender();
        }
      }
      if (state.hasOwnProperty('trans')) {
        state.view.setHTransition(state.trans);
      }
      if (state.hasOwnProperty('hpos') && state.view.hasHTransition()) {
        state.view.deferTransition(this.display.bind(this, states, callback));
      } else {
        state.view.defer(this.display.bind(this, states, callback));
      }
    } else if (typeof(callback) === 'function') {
      callback();
    }
  };
  return new ViewStack();
});
