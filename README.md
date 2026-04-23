# Pro Fence Website Refresh

This project is now a lightweight multi-page static site for `caprofence.com`.

## Pages

- `index.html` - premium home page
- `about.html` - why clients should choose Pro Fence Company
- `services.html` - detailed service overview
- `gallery.html` - HD-style gallery with large lightbox
- `contact.html` - estimate request and direct contact page

## Why this setup is better

- Fancier visual design with a stronger premium feel
- Multiple pages instead of everything stacked into one
- Better sales messaging around quality, range, and professionalism
- Lighter and cheaper to host than a heavy site builder or WordPress setup
- Easier to update with your own logo and project photos

## Replace the logo

1. Put your real logo file in `assets/`
2. Update each page to point to that file
3. Or replace `assets/logo-placeholder.svg`

## Replace the gallery images

1. Put your real high-resolution images in `assets/gallery/`
2. Update the image paths in `index.html` and `gallery.html`
3. Replace the placeholder titles and descriptions with real project details

Example image path:

```html
<img src="assets/gallery/backyard-fence-01.jpg" alt="Backyard cedar privacy fence">
```

## Contact form note

The current estimate form on `contact.html` opens the user's email app with a pre-filled message to `profence@caprofence.com`.

If you want later, we can hook it to:

- Formspree
- Netlify Forms
- A custom email handler

## Suggested next steps

- Add your real logo
- Add your real gallery photos
- Add testimonials
- Connect the form to a live lead capture service
- Deploy to a low-cost static host
