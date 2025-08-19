# Logo Visibility Issue & Solution

## Problem
Some company logos in the ecosystem map have white/light text or graphics on transparent backgrounds, making them invisible against the light gray card backgrounds. This creates poor visual presentation for affected companies.

## Attempted Technical Solutions (All Failed)
- Checkered transparency pattern background
- Dark gray backgrounds (made black logos invisible)
- Medium gray backgrounds (looked unprofessional)
- CSS drop shadows and filters
- Mix-blend-modes and dual backgrounds
- Gradient backgrounds

## Pragmatic Solution (Recommended)
Instead of complex CSS workarounds, **replace problematic logo URLs** in the spreadsheet with better alternatives:

### Approach:
1. **Identify problematic logos** with white/light content
2. **Find better logo variants** for each company:
   - Official dark logo versions from company press kits
   - Horizontal vs vertical logo orientations
   - SVG versions (often more flexible)
   - Logo databases: Brandfetch, Clearbit, LogoSearch
3. **Update logo_url column** in spreadsheet with better URLs
4. **Professional result** without CSS complexity

### Known Problematic Logos:
- B/Deshi (needs better logo)
- Crossfund
- Falcon Network  
- Greenbridge Capital
- Cospace Dhaka
- The Business Center
- [Add more as identified]

### Next Steps:
1. Create complete list of invisible/poor visibility logos
2. Research and find better logo URLs for each
3. Update FINAL_ECOSYSTEM_LOGOS_ULTIMATE.csv
4. Test visibility across all companies

## Current Status
- Logo system successfully updated to use `logo_url` column from spreadsheet
- Fallback system in place (favicons → placeholder initials)
- Clean codebase with old logo management system removed
- Ready for manual logo URL improvements