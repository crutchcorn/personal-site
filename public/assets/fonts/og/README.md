# Open Graph fonts

These static TrueType instances are generated from the site's existing local
variable fonts for Satori's Open Graph image. Satori chooses a registered font
file for each weight; fixed instances preserve the intended weight and optical
size in the generated image.

| File | Source | Pinned axes |
| --- | --- | --- |
| `manrope-400.ttf` | `../manrope-variable.ttf` | `wght=400` |
| `manrope-500.ttf` | `../manrope-variable.ttf` | `wght=500` |
| `manrope-600.ttf` | `../manrope-variable.ttf` | `wght=600` |
| `newsreader-italic-500-72pt.ttf` | `../newsreader-italic-variable.ttf` | `wght=500`, `opsz=72` |

The source Manrope font has a `wght` axis from 200 to 800, defaulting to 200.
Newsreader Italic has `wght` from 200 to 800, defaulting to 400, and `opsz` from
6 to 72, defaulting to 18. The Newsreader instance uses its largest optical size
for the card's display typography. No variable axes remain in these output files.

Both families remain licensed under the SIL Open Font License 1.1. Their original
copyright and license metadata are retained in each font. The full license files
are [Manrope OFL](../manrope-OFL.txt) and [Newsreader OFL](../newsreader-OFL.txt).
Upstream sources are [Google Fonts Manrope](https://github.com/googlefonts/manrope)
and [Production Type Newsreader](https://github.com/productiontype/Newsreader).

To regenerate from the repository root with Python and fontTools 4.66.1:

```sh
python3 -m venv /private/tmp/personal-site-og-fonts-venv
/private/tmp/personal-site-og-fonts-venv/bin/python -m pip install fonttools==4.66.1
/private/tmp/personal-site-og-fonts-venv/bin/python -m fontTools.varLib.instancer public/assets/fonts/manrope-variable.ttf wght=400 --update-name-table --no-recalc-timestamp -o public/assets/fonts/og/manrope-400.ttf
/private/tmp/personal-site-og-fonts-venv/bin/python -m fontTools.varLib.instancer public/assets/fonts/manrope-variable.ttf wght=500 --update-name-table --no-recalc-timestamp -o public/assets/fonts/og/manrope-500.ttf
/private/tmp/personal-site-og-fonts-venv/bin/python -m fontTools.varLib.instancer public/assets/fonts/manrope-variable.ttf wght=600 --update-name-table --no-recalc-timestamp -o public/assets/fonts/og/manrope-600.ttf
/private/tmp/personal-site-og-fonts-venv/bin/python -m fontTools.varLib.instancer public/assets/fonts/newsreader-italic-variable.ttf wght=500 opsz=72 --update-name-table --no-recalc-timestamp -o public/assets/fonts/og/newsreader-italic-500-72pt.ttf
```

Font generation is a maintenance step. Normal development and builds use the
checked-in static files and do not require Python or fontTools.
