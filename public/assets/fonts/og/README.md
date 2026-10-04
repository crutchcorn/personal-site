# Open Graph fonts

These static TrueType instances are generated from the site's existing local
variable fonts for Satori's Open Graph image. Satori chooses a registered font
file for each weight; fixed instances preserve the intended weight in the
generated image.

| File              | Source                    | Pinned axes |
| ----------------- | ------------------------- | ----------- |
| `manrope-400.ttf` | `../manrope-variable.ttf` | `wght=400`  |
| `manrope-500.ttf` | `../manrope-variable.ttf` | `wght=500`  |
| `manrope-600.ttf` | `../manrope-variable.ttf` | `wght=600`  |

The source Manrope font has a `wght` axis from 200 to 800, defaulting to 200.
No variable axes remain in these output files.

Manrope remains licensed under the SIL Open Font License 1.1. Its original
copyright and license metadata are retained in each font. The full license file
is [Manrope OFL](../manrope-OFL.txt). The upstream source is
[Google Fonts Manrope](https://github.com/googlefonts/manrope).

To regenerate from the repository root with Python and fontTools 4.66.1:

```sh
python3 -m venv /private/tmp/personal-site-og-fonts-venv
/private/tmp/personal-site-og-fonts-venv/bin/python -m pip install fonttools==4.66.1
/private/tmp/personal-site-og-fonts-venv/bin/python -m fontTools.varLib.instancer public/assets/fonts/manrope-variable.ttf wght=400 --update-name-table --no-recalc-timestamp -o public/assets/fonts/og/manrope-400.ttf
/private/tmp/personal-site-og-fonts-venv/bin/python -m fontTools.varLib.instancer public/assets/fonts/manrope-variable.ttf wght=500 --update-name-table --no-recalc-timestamp -o public/assets/fonts/og/manrope-500.ttf
/private/tmp/personal-site-og-fonts-venv/bin/python -m fontTools.varLib.instancer public/assets/fonts/manrope-variable.ttf wght=600 --update-name-table --no-recalc-timestamp -o public/assets/fonts/og/manrope-600.ttf
```

Font generation is a maintenance step. Normal development and builds use the
checked-in static files and do not require Python or fontTools.
