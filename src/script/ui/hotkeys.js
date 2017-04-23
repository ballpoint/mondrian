import Range from 'geometry/range';
/*

  Mondrian.io hotkeys management

  This has to be way more fucking complicated than it should.
  Problems:
    • Holding down CMD on Mac mutes all successive keyups.
    • Pushing down key A and key B, then releasing key B, ceases to register key A continuing to be pressed
      so this uses a simulated keypress interval to get around that by storing all keys that are pressed
      and while there are any, executing them all on a 100 ms interval. It feels native, but isn't.

*/


let isDefaultQuarantined = () => { return false };

let hotkeys = {

  // Hotkeys is disabled when the user is focused on a quarantined
  // default-behavior area.
  listeners: {
    down: {},
    up: {},
  },

  on(dir, combination, handler) {
    this.listeners[dir][combination] = handler;
  },

  reset() {
    this.lastKeystroke = '';
    this.modifiersDown = [];
    this.keysDown = [];
  },

  disable() {
    return;
  },

  enable() {
    this.disabled = false;
    // Hackish
    this.cmdDown = false;
    return this;
  },

  modifiersDown: [],

  // Modifier key functions
  //
  // When the user pushes Alt, Shift, or Cmd, depending
  // on what they're doing, we might want
  // to change something.
  //
  // Example: when dragging a shape, hitting Shift
  // makes it start snapping to the closest 45°


  registerModifier(modifier) {
    if (!this.modifiersDown.has(modifier)) {
      this.modifiersDown.push(modifier);
    }
  },

  registerModifierUp(modifier) {
    if (this.modifiersDown.has(modifier)) {
      this.modifiersDown = this.modifiersDown.remove(modifier);
    }
  },

  keysDown: [],

  cmdDown: false,

  simulatedKeypressInterval: null,

  beginSimulatedKeypressTimeout: null,

  keypressIntervals: [],

  lastKeystroke: '',

  lastEvent: {},

  modifierCodes: {
    [8]: 'backspace',
    [16]: 'shift',
    [17]: 'ctrl',
    [18]: 'alt',
    [91]: 'cmd',
    [92]: 'cmd',
    [224]: 'cmd'
  },

  /*
    Strategy:

    Basically, don't persist keystrokes repeatedly if CMD is down. While CMD is down,
    anything else that happens just happens once and that's it.

    So CMD + A + C will select all and copy once, even is C is held down forever.
    Holding down Shift + LefArrow however will repeatedly nudge the selection left 10px.

    So we save all modifiers being held down, and loop all keys unless CMD is down.
  */

  setup() {
    // Map the ctrl key as cmd if the user is on windows.
    let fullKeystroke, key, keystroke;
    if (~navigator.appVersion.indexOf("Win")) {
      this.modifierCodes[17] = 'cmd';
      if (dom.body != null) {
        dom.body.setAttribute('os', 'windows');
      }
    }


    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        this.modifiersDown = [];
        this.keysDown = [];
      }
    });

    document.onkeydown = (e) => {
      let newStroke;

      if (isDefaultQuarantined(e.target)) {
        if (!e.target.hasAttribute("h")) {
          return true;
        }
      }

      // Stop immediately if hotkeys are disabled
      if (this.disabled) { return true; }

      // Parse the keystroke into a string we can read/map to a function
      keystroke = this.parseKeystroke(e);

      // Stop if we haven't recognized this keystroke via parseKeystroke
      if (keystroke === null) { return false; }

      console.log(keystroke);

      // Save this event for
      this.lastEvent = e;

      // Cmd has been pushed
      if (keystroke === 'cmd') {
        this.cmdDown = true; // Custom tracking for cmd
        this.registerModifier("cmd");
        return;

      } else if (['shift', 'alt', 'ctrl'].includes(keystroke)) {
        this.registerModifier(keystroke);

        // Stop registering previously registered keystrokes without this as a modifier.
        for (key of Array.from(this.keysDown)) {
          __guard__(this.listeners.up != null ? this.listeners.up[this.fullKeystroke(key, "")] : undefined, x => x.call(this.listeners.context, e));
        }
        return;

      } else {
        if (!this.keysDown.has(keystroke)) {
          newStroke = true;
          this.keysDown.push(keystroke);
        } else {
          newStroke = false;
        }
      }

      // By now, the keystroke should only be a letter or number.

      fullKeystroke = this.fullKeystroke(keystroke);
      //console.log "FULL: #{fullKeystroke}"

      if (fullKeystroke === "cmd-O") { e.preventDefault(); }

      if (((this.listeners.down != null ? this.listeners.down[fullKeystroke] : undefined) != null) || ((this.listeners.up != null ? this.listeners.up[fullKeystroke] : undefined) != null)) {

        if (this.keypressIntervals.length === 0) {

          // There should be no interval going.
          this.simulatedKeypress();
          this.keypressIntervals = [];

          // Don't start an interval when CMD is down
          if (this.cmdDown) {
            return;
          }

          // Just fill it with some bullshit so it doesnt pass the check
          // above for length == 0 while a beginSimulatedKeypress timeout
          // is pending.
          this.keypressIntervals = [0];

          if (this.beginSimulatedKeypressTimeout != null) {
            clearTimeout(this.beginSimulatedKeypressTimeout);
          }

          return this.beginSimulatedKeypressTimeout = setTimeout(() => {
            return this.keypressIntervals.push(setInterval((() => this.simulatedKeypress()), 100));
          }
          , 350);
        } else if (this.keypressIntervals.length > 0) {
          /*
            Allow new single key presses while the interval is getting set up.
            (This becomes obvious when you try nudging an element diagonally
            with upArrow + leftArrow, for example)
          */
          if (newStroke) { this.simulatedKeypress(); }

          return false; // Putting this here. Might break shit later. Seems to fix bugs for now.

        } else {
          return false; // Ignore the entire keypress if we are already simulating the keystroke
        }
      } else {
        if (this.listeners.ignoreAllOthers) {
          return false;
        } else {
          if ((this.listeners.blacklist != null) && (this.listeners.blacklist !== null)) {
            let chars = this.listeners.blacklist;
            let character = fullKeystroke;

            if (character.match(chars)) {
              if (this.listeners.inheritFromApp.has(character)) {
                this.sets.app.down[character].call(ui);
                this.listeners.context.$rep.blur();
                this.use("app");
              }
              return false;
            } else {
              return true;
            }
          }
        }
      }
    }
    
    document.onkeyup = (e) => {
      if (this.disabled) { return true; }

      keystroke = this.parseKeystroke(e);

      if (this.keysDown.length === 1) {
        this.clearAllIntervals();
      }

      if (keystroke === null) { return false; }

      __guard__(this.listeners.up != null ? this.listeners.up[keystroke] : undefined, x => x.call(this.listeners.context, e));

      if (this.modifiersDown.length > 0) {
        __guard__(this.listeners.up != null ? this.listeners.up[this.fullKeystroke(keystroke)] : undefined, x1 => x1.call(this.listeners.context, e));
      }

      // if is modifier, call up for every key down and this modifier

      if (this.isModifier(keystroke)) {
        for (key of Array.from(this.keysDown)) {
          __guard__(this.listeners.up != null ? this.listeners.up[this.fullKeystroke(key, keystroke)] : undefined, x2 => x2.call(this.listeners.context, e));
        }
      }


      __guard__(this.listeners.up != null ? this.listeners.up.always : undefined, x3 => x3.call(this.listeners.context, this.lastEvent));

      if (keystroke === 'cmd') { // CMD has been released!
        this.registerModifierUp(keystroke);
        this.keysDown = [];
        this.cmdDown = false;

        for (let hotkey of Object.keys(this.listeners.up || {})) {
          let action = this.listeners.up[hotkey];
          if (hotkey.mentions("cmd")) { action.call(this.listeners.context, e); }
        }

        this.lastKeystroke = ''; // Let me redo CMD strokes completely please
        return this.maintainInterval();

      } else if (['shift', 'alt', 'ctrl'].includes(keystroke)) {
        this.registerModifierUp(keystroke);
        return this.maintainInterval();
      } else {
        this.keysDown = this.keysDown.remove(keystroke);
        return this.maintainInterval();
      }
    };
  },


  clearAllIntervals() {
    for (let id of Array.from(this.keypressIntervals)) {
      clearInterval(id);
    }
    return this.keypressIntervals = [];
  },


  simulatedKeypress() {
    /*
      Since we delay the simulated keypress interval, often a key will be pushed and released before the interval starts,
      and the interval will start after and continue running in the background.

      If it's running invalidly, it won't be obvious because no keys will be down so nothing
      will happen, but we don't want an empty loop running in the background for god knows
      how long and eating up resources.

      This prevents that from happening by ALWAYS checking that this simulated press is valid
      and KILLING IT IMMEDIATELY if not.
    */


    this.maintainInterval();

    //console.log @keysDown.join(", ")

    // Assuming it is still valid, carry on and execute all hotkeys requested.

    if (this.keysDown.length === 0) { return; } // If it's just modifiers, don't bother doing any more work.

    return (() => {
      let result = [];
      for (let key of Array.from(this.keysDown)) {
        let fullKeystroke = this.fullKeystroke(key);

        if (this.cmdDown) {
          if (this.lastKeystroke === fullKeystroke) {
            // Don't honor the same keystroke twice in a row with CMD
            4;
          }
        }
            //return

        if ((this.listeners.down != null ? this.listeners.down[fullKeystroke] : undefined) != null) {
          if (this.listeners.down != null) {
            this.listeners.down[fullKeystroke].call(this.listeners.context, this.lastEvent);
          }
          this.lastKeystroke = fullKeystroke;
        }

        result.push(__guard__(this.listeners.down != null ? this.listeners.down.always : undefined, x => x.call(this.listeners.context, this.lastEvent)));
      }
      return result;
    })();
  },


  maintainInterval() { // Kills the simulated keypress interval when appropriate.
    if (this.keysDown.length === 0) {
      return this.clearAllIntervals();
    }
  },


  isModifier(key) {
    switch (key) {
      case "shift": case "cmd": case "alt":
        return true;
      default:
        return false;
    }
  },



  parseKeystroke(e) {

    if (this.modifierCodes[e.which] != null) {
      return this.modifierCodes[e.which];
    }

    let accepted = [
      new Range(9, 9), // Enter
      new Range(13, 13), // Enter
      new Range(65, 90), // a-z
      new Range(32, 32), // Space
      new Range(37, 40), // Arrow keys
      new Range(48, 57), // 0-9
      new Range(187, 190), // - + .
      new Range(219, 222) // [ ] \ '
    ];

    // If e.which isn't in any of the ranges, stop here.
    if (accepted.map(x => x.containsInclusive(e.which)).filter(x => x === true).length === 0) { return null; }

    // Certain keycodes we rename to be more clear
    let remaps = {
      [13]: 'enter',
      [32]: 'space',
      [37]: 'leftArrow',
      [38]: 'upArrow',
      [39]: 'rightArrow',
      [40]: 'downArrow',
      [187]: '+',
      [188]: ',',
      [189]: '-',
      [190]: '.',
      [219]: '[',
      [220]: '\\',
      [221]: ']',
      [222]: "'"
    };

    let keystroke = remaps[e.which] || String.fromCharCode(e.which);

    return keystroke;
  },

  fullKeystroke(key, mods) {
    if (mods == null) { mods = this.modifiersPrefix(); }
    return `${mods}${mods.length > 0 ? '-' : ''}${key}`;
  },


  /*
    Returns a string line 'cmd-shift-' or 'alt-cmd-shift-' or 'shift-'
    Always in ALPHABETICAL order. Modifier prefix order must match that of hotkey of the hotkey won't work.
    This is done so we can compare single strings and not arrays or strings, which is faster.
  */

  modifiersPrefix() {
    let mods = this.modifiersDown.sort().join('-');
    if (/Win/.test(navigator.platform)) {
      mods = mods.replace('ctrl', 'cmd');
    }
    return mods;
  }
};

hotkeys.setup();

export default hotkeys;


function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
