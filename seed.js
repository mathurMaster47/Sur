/* Starter collections and placeholder stutis.
 * The sample text below is only a placeholder so you can see how pages work.
 * Replace it with the stutis from your own books (Library > Edit).
 */
window.SUR_SEED = {
  collections: [
    { id: 'c-ganesh',   name: 'Ganesh Ji · गणेश जी',            builtin: true },
    { id: 'c-navratri', name: 'Navratri Stuti · नवरात्रि स्तुति', builtin: true },
    { id: 'c-rajbhog',  name: 'Raj Bhog · राज भोग',              builtin: true },
    { id: 'c-aarti',    name: 'Aarti · आरती',                    builtin: true },
    { id: 'c-mine',     name: 'My Stutis · मेरी स्तुतियाँ',       builtin: false }
  ],
  stutis: [
    {
      id: 's-ganesh-1', collectionId: 'c-ganesh', title: 'Sample – Ganesh stuti (replace me)',
      deity: 'Ganesh', category: 'stuti', lang: 'hi',
      pages: [
        { text: 'यह एक नमूना पृष्ठ है।\nअपनी पुस्तक से गणेश स्तुति यहाँ लिखें।', translit: null }
      ]
    },
    {
      id: 's-navratri-1', collectionId: 'c-navratri', title: 'Sample – Navratri stuti (replace me)',
      deity: 'Durga', category: 'stuti', lang: 'hi',
      pages: [
        { text: 'यह पहला पृष्ठ है।\nलंबी स्तुति को कई पृष्ठों में बाँटा जा सकता है।', translit: null },
        { text: 'यह दूसरा पृष्ठ है।\nआगे बढ़ने के लिए अगला दबाएँ।', translit: null }
      ]
    },
    {
      id: 's-rajbhog-1', collectionId: 'c-rajbhog', title: 'Sample – Raj Bhog (replace me)',
      deity: 'Durga', category: 'stuti', lang: 'hi',
      pages: [
        { text: 'यहाँ राज भोग की स्तुति लिखें।', translit: null }
      ]
    },
    {
      id: 's-aarti-1', collectionId: 'c-aarti', title: 'Sample – Aarti (replace me)',
      deity: 'Durga', category: 'aarti', lang: 'hi',
      pages: [
        { text: 'यहाँ आरती लिखें।\nहर पंक्ति नई पंक्ति में रखें।', translit: null }
      ]
    }
  ]
};
