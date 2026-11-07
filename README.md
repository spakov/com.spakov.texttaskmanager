## Overview
- Like the Icons-and-Text Task Manager, but with text-based "icons" instead of actual icons.
- Heavily customizable; Glyphs.js maps windows to "icons."
- Requires modifications to the KDE Plasma source code.
- Plasma-Dev Distrobox container holds an environment containing what is needed.
	- `distrobox.ini` is located at `~/.var/app/com.spakov.Plasma-Dev`
## Plasma-Dev
- Contains things required to build KDE Plasma.
- Source code is in `~/Projects/plasma-desktop`.
- Rebase to the version of Plasma installed on the system, which can be obtained with `plasmashell --version`. Note that it's necessary to select both the proper branch and tag.
### Customizing Glyphs.js
``` sh
cd ~/Projects/plasma-desktop
vi applets/taskmanager/Glyphs.js
```
Rebuild and copy the library after customizing.
### Building
``` sh
cd ~/Projects/plasma-desktop
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --target com.spakov.org.kde.plasma.taskmanager -j$(nproc)
```

> [!note]
> Remember, this needs to happen on the Distrobox! In fact, building is the *only* thing that happens on the Distrobox.
### Copying the compiled library
``` sh
cp build/bin/plasma/applets/com.spakov.org.kde.plasma.taskmanager.so ~/.local/lib64/qt6/plugins/plasma/applets/
```

> [!note]
> Remember, this needs to happen *off* the Distrobox!
## Using Text Task Manager
Edit the panel configuration, add a widget like any other built-in widget, select Text Task Manager.
### Reloading Plasma after copying the library
``` sh
systemctl --user restart plasma-plasmashell
```
### Getting Qt to recognize the library
This should only need to happen one time:
``` sh
echo 'QT_PLUGIN_PATH=${HOME}/.local/lib64/qt6/plugins' > ~/.config/environment.d/qt-plugins.conf
```
## Managing it the Eas(ier) Way
`~/Projects/com.spakov.texttaskmanager` is the patch repository and also contains `Glyphs.js`. Claude wrote a very helpful `build.sh` that automates these updates. Note that this will delete and recreate `~/Projects/plasma-desktop`.

To update `Glyphs.json`, simply update directly in `~/Projects/com.spakov.texttaskmanager/Glyphs.json` and run `build.sh` in the Distrobox.

To build a new *patch*, things are actually pretty straightforward.
> [!todo]
> This probably works for Plasma updates as well, but verify that.
1. Change to `~/Projects/plasma-desktop` and make your changes.
2. Commit changes (but don't push).
> [!warning]
> Don't forget to keep `Glyphs.js` *out of* source control.
3. Run `git format-patch v6.8.2 -o ~/Projects/com.spakov.texttaskmanager/patches/` (replacing version number to target the correct Plasma version). `cd`, since this is about to be deleted anyway.
4. Run the `com.spakov.texttaskmanager` build.
> [!note]
> Remember, this needs to happen on the Distrobox!
5. Make sure everything looks right. If so, add to version control, and you're done.
6. If everything doesn't look right, remove the latest broken patch(es) from `~/Projects/com.spakov.texttaskmanager/patches`, then re-run the build. Start at Step 1.
## Notes from Claude
There are two established ways to manage this.

1. **Fork with a branch:** push your full `plasma-desktop` clone to your own remote, keep your commits on a branch, and run `git rebase --onto <new tag> <old tag>` when Plasma updates. This is simple, but you're hosting a large repository to carry about four commits.
2. **Patch queue:** keep a small repo with just your patches and a build script that clones upstream at a tag and applies them. This is how Fedora and Arch packages carry changes against upstream projects.

I'd go with the patch queue. Your changes are tiny, you already rebuild for every Plasma release, and you can split the code changes, which rarely change, from your glyph map, which you'll edit constantly. A layout like this:

```
plasma-texttasks/
├── patches/
│   ├── 0001-Rename-applet-ID.patch
│   └── 0002-Replace-icons-with-text-glyphs.patch
├── glyphs.js      ← kept outside the patches; the script copies it in
├── build.sh
└── LICENSE        ← plasma-desktop is GPL-2.0-or-later, so your fork is too
```

**Creating the patches.** In your current working clone, commit your changes as logical commits, leaving `glyphs.js` out. The patch still adds the CMake entry and the import that reference it. Then export the commits relative to the tag:

```
git format-patch v6.X.Y -o ~/plasma-texttasks/patches
```

**Upgrading when Plasma updates.** In a working clone:

```
git config rerere.enabled true      # once; git remembers how you resolved each conflict
git checkout -b texttasks v6.NEW.TAG
git am ~/plasma-texttasks/patches/*.patch
# on conflict: fix the files, git add them, then git am --continue
git format-patch v6.NEW.TAG -o ~/plasma-texttasks/patches   # clear the old patches out first
```

Then commit the refreshed patches in your small repo. Most upgrades will apply cleanly and you won't need to touch anything.

I've also written a `build.sh` that runs the whole cycle from inside the distrobox. It asks the host which Plasma version it has, does a shallow clone of that tag, applies your patches, copies in `glyphs.js`, builds only your target, installs the `.so` into `~/.local`, and restarts plasmashell on the host. That way you can't build against the wrong version by accident. Set `ID` and the `glyphs.js` destination path at the top to match your setup; I've marked both.

Each run does a clean, shallow clone, which is reliable but means a full CMake configure every time. If that gets slow, keep the `WORK` directory between runs and only re-clone when the version changes.

If `git am` reports a conflict during a build, the script stops. Do the upgrade steps in a working clone to refresh the patches, then run `build.sh` again.