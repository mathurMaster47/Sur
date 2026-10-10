# Sur · सुर

Build your own sequence of stutis and aartis, read them page by page, and sing along with English-letter transliteration.

- Pick what you want to recite and in what order (for example Ganesh ji, then the main stutis, then Raj Bhog, then aarti)
- Long stutis can have many pages
- Type stutis in, or add pages from a **photo** (text is read on your device, nothing is uploaded)
- Shows the original script, English letters, or both
- North Indian scripts: Devanagari (Hindi, Marathi, Sanskrit, Nepali and more), Gujarati, Gurmukhi (Punjabi), Bengali/Assamese, Odia
- Works offline once opened, and can be installed to a phone home screen
- No API keys, no accounts yet (data is stored in the browser; export and import files to share)

## Run it locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000

## Put it on GitHub Pages

1. Create a new repository on GitHub (for example `sur`).
2. Upload all files in this folder to the repository root (drag and drop works in the GitHub web page, or use git).
3. Go to **Settings → Pages**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, and save.
4. After a minute your app is live at `https://<your-username>.github.io/<repository>/`.

Using git instead:

```
git init -b main
git add .
git commit -m "Sur"
git remote add origin https://github.com/<your-username>/sur.git
git push -u origin main
```

## Files

| File | Purpose |
|---|---|
| `index.html` | page shell |
| `app.js` | all screens: path builder, reader, library, add/edit, settings |
| `translit.js` | in-browser transliteration engine |
| `seed.js` | starter collections and placeholder stutis (replace with your own) |
| `styles.css` | look and feel |
| `sw.js`, `manifest.json`, `icon.svg` | offline support and install to home screen |

## Notes

- **Transliteration is rule based.** It is a good first guess, never perfect, so every page has an "Edit English" option and your fixes are saved.
- **Photo reading** uses Tesseract.js, loaded from a CDN the first time you use it (needs internet then). Always check the result.
- **Copyright:** traditional stutis are fine to share, but modern books and lyricists' compositions may be protected. Only share what you have the right to share.

## Next phase: shared uploads

Public uploads from other people need a shared database. The plan is Supabase (Postgres) with Google sign-in, report buttons and auto-hide after several reports. The app's data model (collections, stutis, pages, path) is already shaped to move into those tables.
