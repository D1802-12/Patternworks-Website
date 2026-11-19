# Patternworks website

A simple static website that shows SME developers the value of Patternworks and lets them browse the pattern book catalogue. There is no build step: it's plain HTML, CSS and JavaScript, so it runs on any static host (Vercel, Netlify, GitHub Pages).

## What's in it

| Page | Address | What it shows |
|---|---|---|
| Home | `/` | The value story: simpler design and faster feasibility, then shared demand and industrialised supply, with calls to action |
| Catalogue | `/#catalogue` | The pattern books, or all house types, with filters |
| Pattern book | `/#be-first-small-sites` and so on | The book's details, its house types, and a slot for each 3D model |
| Contact | `/#contact` | An enquiry form that opens a pre-filled email |

## Files

```
index.html          page shell (header, footer)
assets/
  data.js           content you edit: contact email, pattern books, house types, target figures
  app.js            page rendering, routing and the contact form
  styles.css        all styling; colours are variables at the top
  favicon.svg       browser tab icon
  images/           put pattern book images here
  models/           put 3D models (.glb) here, once they exist
```

## Editing content

Almost everything you'll want to change is in `assets/data.js`, and each field is explained in comments at the top of that file.

- **Contact email:** change `contactEmail`. It's currently a placeholder (`hello@patternworks.example`).
- **Add house types to a book:** add entries to that book's `types` list, copying the format of the Be First ones. Until a book has house types, its page shows "House types being added".
- **Mark a book as live:** change `status` to `'In the catalogue'` and `statusKey` to `'in'`.
- **Change the target figures:** edit `metrics`.

Homepage copy (headlines, the FAQ and so on) lives in the `home()` function in `assets/app.js`.

## Before going live

- Replace the placeholder contact email.
- Check the Be First house types (A, C, D, E) and floor areas against the book.
- Confirm the Edinburgh Home Demonstrator owner.
- Get permission from each book's owner before adding their images or drawings.
- Decide whether to keep the target figures on the homepage. They're business case targets that haven't been tested yet, and the page says so.

## Run it locally

Open `index.html` in a browser. Or, from this folder, run:

```
npx serve .
```

## Put it on GitHub and Vercel

1. Create a new repository on GitHub and upload the contents of this folder (keep `index.html` at the top level).
2. In Vercel, choose **Add New → Project** and import the repository.
3. Set **Framework Preset** to **Other**. Leave the build command empty and the output directory as the root.
4. Deploy. Every push to the main branch redeploys the site.

## Notes

- **Addresses:** pages use addresses like `/#catalogue`, so the site works on any static host without server configuration.
- **Contact form:** it doesn't store anything. It opens the visitor's email app with their details filled in. To collect enquiries in one place instead, point the form at a form service such as Formspree, or at a Vercel serverless function.
- **3D models:** each house type page has a framed slot marked "3D model to come", which currently shows an illustrative elevation drawing. The `models/` folder is ready for `.glb` files when the models are made.
