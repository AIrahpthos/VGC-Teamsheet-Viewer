# VGC Teamsheet Viewer

An iPad-friendly viewer for Pokémon VGC teamsheets from RK9 and tournament PDFs.

## Use

Select an RK9 tournament, search for a player, and open their published teamsheet.

For a tournament PDF, select **Import PDF** and choose the file. Once imported, search by player name as usual. The English teams appear in the same compact card layout, including Tera types or Stat Alignment, abilities, items and moves. The original page number appears beside each player.

The most recently imported PDF roster is saved on that browser/device and restored after refreshing. Choose an RK9 tournament from the tournament selector to switch back; the imported PDF remains in that selector. Importing another PDF replaces the saved PDF roster. **Remove saved PDF** clears it. Each iPad must import its own copy; imported data is not uploaded or shared between devices.

## Features

- Searches public RK9 tournament rosters and imported PDF player lists
- Displays six Pokémon together in a compact layout
- Supports Scarlet/Violet and Champions sheets from RK9
- Imports text-based multilingual RK9 tournament PDFs in the Scarlet/Violet or Champions table layouts
- Clearly marks blank or unreadable sheets and reports unsupported pages
- Preserves empty move slots, including Ditto's single move
- Ignores accents and letter case when searching names
- No RK9 account or login required

## Notes

PDF import currently requires the English, six-column table layout; scanned images and other PDF formats are not supported. Limits are 40 MB and 2,000 pages. Blank sheets do not contain teams to recover. The imported roster remains searchable without reaching RK9, although loading the app and Pokémon artwork may still require internet access. Browser storage can be cleared by the browser or user.

This is an unofficial viewer and is not affiliated with RK9, Pokémon, Nintendo, Game Freak or The Pokémon Company.

## Install on iPad and use offline

1. Open the deployed viewer in Safari while connected to the internet (complete any hosting login first).
2. Choose **Share → Add to Home Screen** and enable **Open as Web App** if offered.
3. Launch **Team Sheet** from its Home Screen icon while still online. Wait for **Ready offline** before disconnecting.
4. Import the tournament PDF inside that installed app. The saved roster is restored when the app reopens. You can also import another supported PDF from Files while offline, provided the file is downloaded to the iPad.

Offline setup saves the viewer, PDF parser, PDF worker, fonts and character maps. PDF import, player search and team display work without contacting the host or RK9. Artwork is not cached by this feature; missing images fall back to numbered placeholders. Live RK9 lookups still need internet. Initial installation and app updates require access to the host, including any hosting login.

Safari and the installed Home Screen app may have separate storage: import your PDF in the installed app. Keep the original PDF in Files so you can reimport it if iPadOS or the user clears website data. The viewer saves the parsed teams, not another copy of the source PDF.

Updates download online and activate after all viewer windows close. If offline setup fails, reopen online to retry; do not disconnect until **Ready offline** appears. Production builds generate a versioned service worker from every built client asset (`scripts/prepare-offline.mjs`); the development server does not install offline support. No App Store or Apple developer membership is required.
