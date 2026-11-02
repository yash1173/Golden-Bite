# Visual assets

All product imagery and fonts are bundled locally so the deployed website does not depend on a photo CDN.

## Generated hero

`public/images/meal.png` was created with the **built-in image-generation tool**, preserving its transparent background. It is used for the homepage hero and sample meal product. It is illustrative artwork, not a photo of an actual restaurant product.

Final prompt:

> Use case: product-mockup. Asset type: transparent hero image for an upscale friendly fast food ordering website. Photorealistic commercial food photography: one large delicious double smash cheeseburger with golden sesame brioche bun, melted cheddar, crisp lettuce, pickles and sauce in the foreground, a small unbranded red carton of golden French fries behind it on the right and an unbranded red cold drink cup with white lid in the back left. A few scattered fries. Front three-quarter view, entire group fully visible and centered with generous breathing room, no clipping. Crisp warm studio light, incredibly appetizing food textures, realistic proportions. Isolate the whole arrangement on genuinely transparent background with subtle contact shadow only. No text, no logos, no typography, no watermark. Landscape grouping.

## Sample product photos

Photos from Unsplash, downloaded as local JPEGs. Replace with your actual product photography and descriptions for a live restaurant menu. [Unsplash license](https://unsplash.com/license).

| Local file    | Source image                                                 |
| ------------- | ------------------------------------------------------------ |
| `classic.jpg` | https://images.unsplash.com/photo-1568901346375-23c9450c58cd |
| `chicken.jpg` | https://images.unsplash.com/photo-1606755962773-d324e0a13086 |
| `veggie.jpg`  | https://images.unsplash.com/photo-1520072959219-c595dc870360 |
| `fries.jpg`   | https://images.unsplash.com/photo-1573080496219-bb080dd4f877 |
| `bites.jpg`   | https://images.unsplash.com/photo-1562967914-608f82629710    |
| `cola.jpg`    | https://images.unsplash.com/photo-1581636625402-29b2a704ef13 |
| `shake.jpg`   | https://images.unsplash.com/photo-1572490122747-3968b75cc699 |
| `cookie.jpg`  | https://images.unsplash.com/photo-1499636136210-6f4ee915583e |

## Fonts and icons

DM Sans and Barlow Condensed are bundled from Google Fonts under the SIL Open Font License; license texts are in `public/fonts/`. The local font filenames end in `.woff2` but retain their source TrueType format, correctly identified in `fonts.css`.

Interface icons use the open-source Lucide React package. The Golden Bite burger mark is a small CSS graphic. No McDonald’s logo or assets are used.
