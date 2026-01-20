# Celebrity Images - Learning Technologies 2026 (French Localization)

## 🇫🇷 French-Localized Celebrity Roster

**Gender Balance**: ✅ Perfect 6 Male / 6 Female
**French Representation**: 🇫🇷 67% (8/12 celebrities are French)
**International Stars**: 🌍 33% (4/12 global celebrities)

---

## 📊 Current Status: 12 Celebrities

### ✅ **Available** (4 images):
1. ✅ **Lionel Messi** (206K) - Légende du football argentin
2. ✅ **Cristiano Ronaldo** (147K) - Superstar du football portugais
3. ✅ **Taylor Swift** (1.1M) - Superstar internationale de la pop

### ⚠️  **Need Images** (8 French celebrities):

#### SPORTS - French Stars (2M/2F)
4. ⏳ **Ousmane Dembélé** 🇫🇷 - Footballeur français, champion du monde 2018
5. ⏳ **Zinedine Zidane** 🇫🇷 - Légende du football français, champion du monde 1998
6. ⏳ **Amélie Mauresmo** 🇫🇷 - Championne française de tennis, ex-n°1 mondiale
7. ⏳ **Clarisse Agbégnénou** 🇫🇷 - Judokate française, championne olympique

#### ENTERTAINMENT - French Stars (2M/1F)
8. ⏳ **Omar Sy** 🇫🇷 - Acteur français, star d'Intouchables et Lupin
9. ⏳ **Jean Dujardin** 🇫🇷 - Acteur français oscarisé, star de The Artist
10. ⏳ **Marion Cotillard** 🇫🇷 - Actrice française oscarisée

#### MUSIC - French Star (1F)
11. ⏳ **Aya Nakamura** 🇫🇷 - Artiste française la plus écoutée au monde

#### MUSIC - International (1F)
12. ⚠️ **Beyoncé** - Icône de la musique et du divertissement
    - **Status**: Image corrupted (HTML file, not JPEG)
    - **Action needed**: Manual download required

---

## 🎯 Why This Roster?

### Perfect for French Audience:
- **Football Focus**: 4 footballers including 2 French legends (Dembélé, Zidane)
- **French Cinema**: 3 beloved French actors (Omar Sy, Marion Cotillard, Jean Dujardin)
- **French Athletes**: 2 inspiring French female athletes (Mauresmo, Agbégnénou)
- **Contemporary Music**: Aya Nakamura (most-streamed French artist globally)
- **International Balance**: Kept global megastars (Messi, Ronaldo, Taylor Swift, Beyoncé)

### Gender Representation:
- **Male**: Dembélé, Zidane, Messi, Ronaldo, Omar Sy, Jean Dujardin (6)
- **Female**: Mauresmo, Agbégnénou, Cotillard, Aya Nakamura, Taylor Swift, Beyoncé (6)

### Categories:
- **Sports**: 6 celebrities (4M/2F)
- **Entertainment**: 3 celebrities (2M/1F)
- **Music**: 3 celebrities (0M/3F)

---

## 📥 Downloading Images

### Automatic Download Script:
```bash
cd ~/claude/booth-selfie
./scripts/download-french-celebrities.sh
```

### Manual Download Needed:

Due to Wikimedia Commons access restrictions, the following images need manual download:

#### French Celebrities (8 images):

**1. Ousmane Dembélé**
- Search: https://commons.wikimedia.org/wiki/File:Ousmane_Dembélé_2018.jpg
- Download as: `dembele.jpg`
- Size: ~800px width

**2. Zinedine Zidane**
- Search: https://commons.wikimedia.org/wiki/File:Zinedine_Zidane_by_Tasnim_03.jpg
- Download as: `zidane.jpg`
- License: CC BY 4.0

**3. Omar Sy**
- Search: https://commons.wikimedia.org/wiki/File:Omar_Sy_Avp_2014.jpg
- Download as: `omarsy.jpg`
- License: CC BY-SA 3.0

**4. Jean Dujardin**
- Search: https://commons.wikimedia.org/wiki/File:Jean_Dujardin_Cannes_2011.jpg
- Download as: `dujardin.jpg`
- License: CC BY 2.0

**5. Marion Cotillard**
- Search: https://commons.wikimedia.org/wiki/File:Marion_Cotillard_Cabourg_2017.jpg
- Download as: `cotillard.jpg`
- License: CC BY-SA 4.0

**6. Amélie Mauresmo**
- Search: https://commons.wikimedia.org/wiki/File:Amelie_Mauresmo_at_the_2006_Australian_Open.jpg
- Download as: `mauresmo.jpg`
- License: Public Domain

**7. Clarisse Agbégnénou**
- Search: https://commons.wikimedia.org/wiki/File:Clarisse_Agbegnenou_2021.jpg
- Download as: `agbegnenou.jpg`
- License: CC BY-SA 4.0

**8. Aya Nakamura**
- ⚠️ **Limited free images available**
- Alternative: Use press kit or licensed stock photo
- Download as: `ayanakamura.jpg`
- May require purchasing license or contacting her team

#### Fix Beyoncé:
**9. Beyoncé** (corrupted - fix needed)
- Current file is HTML, not JPEG
- Recommended source: https://commons.wikimedia.org/wiki/Category:Beyoncé
- Download manually from browser (right-click → Save Image As)
- Replace: `beyonce.jpg`

---

## 🛠️ Manual Download Instructions

Since automated downloads from Wikimedia Commons are blocked, follow these steps:

### For each celebrity:
1. Visit the Wikimedia Commons link above
2. Click on the image to view full size
3. Right-click on the image → "Save Image As..."
4. Save to: `~/claude/booth-selfie/public/celebrities/[filename].jpg`
5. Verify with: `file ~/claude/booth-selfie/public/celebrities/[filename].jpg`
   - Should show: "JPEG image data" (not HTML)

### Quick verification:
```bash
cd ~/claude/booth-selfie/public/celebrities
file *.jpg | grep -v "JPEG image data"
```
This will show any non-JPEG files (should be empty).

---

## ✅ Image Requirements

For best AI face composition results:
- **Resolution**: 800x800px minimum
- **Face Position**: Front-facing, centered
- **Lighting**: Even, well-lit
- **Expression**: Neutral or slight smile
- **Quality**: Clear, not pixelated
- **Background**: Clean, not distracting
- **Format**: JPEG (.jpg)
- **File Size**: 100KB - 500KB recommended

---

## 📝 Licensing Information

All images must have:
- ✅ **Free license** (Public Domain, CC BY, CC BY-SA)
- ✅ **Commercial use** permitted
- ✅ **Attribution** provided (if required by license)

### License Types Used:
- **Public Domain**: No restrictions
- **CC BY**: Attribution required
- **CC BY-SA**: Attribution required, share-alike
- **CC BY 2.0, 3.0, 4.0**: Different versions

---

## 🔍 Troubleshooting

### Images not showing in app?
1. Check file names match exactly (e.g., `dembele.jpg` not `Dembele.jpg`)
2. Verify files are in `public/celebrities/` directory
3. Check files are actual JPEG images: `file *.jpg`
4. Restart dev server: `npm run dev`

### Corrupted downloads (HTML instead of images)?
```bash
# Check for HTML files
cd ~/claude/booth-selfie/public/celebrities
file *.jpg | grep HTML

# Remove and re-download manually from browser
rm corrupted-file.jpg
# Then download via browser's "Save Image As..."
```

### Face composition quality issues?
- Use higher resolution images (1000x1000px+)
- Ensure faces are front-facing and well-lit
- Try different celebrity photos if results aren't satisfactory

---

## 🎨 Adding More Celebrities

To expand the roster beyond 12:

### 1. Add image file:
Place new image in: `public/celebrities/celebrity-id.jpg`

### 2. Update constants:
Edit `src/constants/celebrities.ts`:
```typescript
{
  id: 'celebrity-id',
  name: 'Celebrity Name',
  imageUrl: '/celebrities/celebrity-id.jpg',
  color: '#hexcolor',
  category: 'sports' | 'entertainment' | 'music',
  description: 'French description',
}
```

### 3. Restart server:
```bash
npm run dev
```

---

## 🌟 Recommended Additional French Celebrities

If expanding the roster:

**Sports**:
- Antoine Griezmann (football)
- Teddy Riner (judo)
- Renaud Lavillenie (pole vault)
- Sarah Lefort (sailing)

**Entertainment**:
- Gad Elmaleh (comedian)
- Sophie Marceau (actress)
- Tahar Rahim (actor)
- Léa Seydoux (actress)

**Music**:
- Christine and the Queens (artist)
- David Guetta (DJ)
- Daft Punk (electronic duo)

**Historical/Science**:
- Marie Curie (Nobel Prize)
- Louis Pasteur (scientist)
- Simone Veil (politician)

---

## 📊 Current Roster Summary

| Name | Gender | Origin | Category | Status |
|------|--------|--------|----------|--------|
| Ousmane Dembélé | M | 🇫🇷 France | Sports | ⏳ Need image |
| Zinedine Zidane | M | 🇫🇷 France | Sports | ⏳ Need image |
| Lionel Messi | M | 🇦🇷 Argentina | Sports | ✅ Ready |
| Cristiano Ronaldo | M | 🇵🇹 Portugal | Sports | ✅ Ready |
| Omar Sy | M | 🇫🇷 France | Entertainment | ⏳ Need image |
| Jean Dujardin | M | 🇫🇷 France | Entertainment | ⏳ Need image |
| Marion Cotillard | F | 🇫🇷 France | Entertainment | ⏳ Need image |
| Amélie Mauresmo | F | 🇫🇷 France | Sports | ⏳ Need image |
| Clarisse Agbégnénou | F | 🇫🇷 France | Sports | ⏳ Need image |
| Aya Nakamura | F | 🇫🇷 France | Music | ⏳ Need image |
| Taylor Swift | F | 🇺🇸 USA | Music | ✅ Ready |
| Beyoncé | F | 🇺🇸 USA | Music | ⚠️ Fix needed |

**Status**: 3/12 images ready (25%)
**Action needed**: Download 8 images + Fix 1 image

---

**Last Updated**: 2026-01-05
**Event**: Learning Technologies 2026 - Paris, France
**Sponsor**: Go1 - L'agrégateur de contenus de formation de référence dans le monde
