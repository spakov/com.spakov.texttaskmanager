// glyphs.js — maps a window to a text "icon" and a color. Put this next to
// Task.qml (contents/ui/) and import it with:
//   import "glyphs.js" as Glyphs

// Load this file once and share it across every task button, instead of
// loading a fresh copy per button.
.pragma library

// Catppuccin Mocha — palette v1.8.0
const Mocha = {
  // Accents
  rosewater: "#f5e0dc",
  flamingo:  "#f2cdcd",
  pink:      "#f5c2e7",
  mauve:     "#cba6f7",
  red:       "#f38ba8",
  maroon:    "#eba0ac",
  peach:     "#fab387",
  yellow:    "#f9e2af",
  green:     "#a6e3a1",
  teal:      "#94e2d5",
  sky:       "#89dceb",
  sapphire:  "#74c7ec",
  blue:      "#89b4fa",
  lavender:  "#b4befe",

  // Text
  text:      "#cdd6f4",
  subtext1:  "#bac2de",
  subtext0:  "#a6adc8",

  // Overlays
  overlay2:  "#9399b2",
  overlay1:  "#7f849c",
  overlay0:  "#6c7086",

  // Surfaces
  surface2:  "#585b70",
  surface1:  "#45475a",
  surface0:  "#313244",

  // Backgrounds
  base:      "#1e1e2e",
  mantle:    "#181825",
  crust:     "#11111b"
};

// --- Rule tables, checked top to bottom; the first match wins. ---

// 1. Title rules: a regular expression tested against the window title. Useful
//    when one app (e.g. a browser) hosts many different things. /.../i means
//    "case-insensitive".
const titleRules = [
  { match: /settings$/i, glyph: "", color: Mocha.overlay2 },
  //{ match: /youtube/i, glyph: "\uf16a", color: Mocha.red }, // youtube
  //{ match: /github/i, glyph: "\uf09b", color: Mocha.text }, // github
  //{ match: /\.(md|txt)\b/i, glyph: "\uf15c", color: Mocha.lavender } // text file
];

// 2. App ID rules: exact desktop-file ID (what model.AppId reports).
const appIdRules = {
  "Claude-com.anthropic.Claude": { glyph: "", color: Mocha.peach },
  "com.discordapp.Discord": { glyph: "", color: Mocha.mauve },
  "com.onepassword.OnePassword": { glyph: "", color: Mocha.blue },
  "io.github.DenysMb.Kontainer": { glyph: "", color: Mocha.green },
  "io.gitlab.librewolf-community": { glyph: "󰖟", color: Mocha.sapphire },
  "md.obsidian.Obsidian": { glyph: "", color: Mocha.mauve },
  "net.lutris.Lutris": { glyph: "󰺶", color: Mocha.peach },
  "org.kde.dolphin": { glyph: "", color: Mocha.maroon },
  "org.kde.konsole": { glyph: "", color: Mocha.pink },
  "org.mozilla.thunderbird": { glyph: "", color: Mocha.sky },
  "steam": { glyph: "", color: Mocha.blue }
};

// 3. App name rules: lowercase app name, a fallback when the ID is
//    odd/missing.
const appNameRules = {
  //"chromium": { glyph: "\uf268", color: Mocha.blue },
  //"thunderbird": { glyph: "\uf0e0", color: Mocha.teal },
  //"spotify": { glyph: "\uf001", color: Mocha.green }
};

// 4. Used when nothing above matches.
const fallback = { glyph: "", color: Mocha.overlay0 };

// --- The function Task.qml calls. ---
function lookup(appId, appName, title) {
  // Guard against missing values: (x || "") turns undefined/null into "".
  appId   = appId   || "";
  appName = (appName || "").toLowerCase();
  title   = title   || "";

  for (let i = 0; i < titleRules.length; i++) {
      if (titleRules[i].match.test(title))
          return titleRules[i];
  }
  if (appId in appIdRules)
      return appIdRules[appId];
  if (appName in appNameRules)
      return appNameRules[appName];
  return fallback;
}
