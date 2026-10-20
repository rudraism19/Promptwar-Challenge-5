#!/usr/bin/env bash
set -e

mkdir -p public .playwright-cli

echo "Resetting playwright-cli..."
playwright-cli kill-all || true
sleep 1

echo "Starting Playwright browser..."
playwright-cli open --browser=chromium http://localhost:3000
playwright-cli resize 1440 900
sleep 2

echo "Starting video capture to public/demo-video.webm..."
playwright-cli video-start public/demo-video.webm
sleep 3

# Scene 1: Event Overview
echo "Scene 1: Event Overview..."
playwright-cli eval "(() => { window.scrollTo({ top: 350, behavior: 'smooth' }); return true; })()"
sleep 3
playwright-cli eval "(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); return true; })()"
sleep 2

# Scene 2: Budget & Expenses
echo "Scene 2: Budget & Expenses..."
playwright-cli click "button:has-text('Budget & Expenses')"
sleep 3
playwright-cli eval "(() => { window.scrollTo({ top: 380, behavior: 'smooth' }); return true; })()"
sleep 3
playwright-cli eval "(() => { const b = document.querySelector('table button'); if (b) b.click(); return true; })()"
sleep 2
playwright-cli eval "(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); return true; })()"
sleep 2

# Scene 3: Timeline & Run-of-Show
echo "Scene 3: Timeline & Run-of-Show..."
playwright-cli click "button:has-text('Timeline & Run-of-Show')"
sleep 3
playwright-cli click "button:has-text('Day-of Run of Show')"
sleep 3
playwright-cli eval "(() => { window.scrollTo({ top: 400, behavior: 'smooth' }); return true; })()"
sleep 3
playwright-cli eval "(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); return true; })()"
sleep 2

# Scene 4: Vendors Checklist
echo "Scene 4: Vendors Checklist..."
playwright-cli click "button:has-text('Vendors & Checklist')"
sleep 3
playwright-cli eval "(() => { const btns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Get AI Vetting Guide')); if (btns[0]) btns[0].click(); return true; })()"
sleep 4
playwright-cli eval "(() => { const closeBtn = document.querySelector('button[aria-label=\"Close dialog\"]'); if (closeBtn) closeBtn.click(); return true; })()"
sleep 2

# Scene 5: AI Idea Lab
echo "Scene 5: AI Idea Lab..."
playwright-cli click "button:has-text('AI Idea Lab')"
sleep 3
playwright-cli eval "(() => { window.scrollTo({ top: 300, behavior: 'smooth' }); return true; })()"
sleep 3
playwright-cli eval "(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); return true; })()"
sleep 2

# Scene 6: Switch Event to 30th Birthday
echo "Scene 6: Switch Event to 30th Birthday..."
playwright-cli eval "(() => { const sel = document.querySelector('#event-selector'); if (sel) { sel.selectedIndex = 1; sel.dispatchEvent(new Event('change', { bubbles: true })); } return true; })()"
sleep 4

# Scene 7: Export Dossier
echo "Scene 7: Export Dossier..."
playwright-cli click "button:has-text('Export Dossier')"
sleep 4
playwright-cli eval "(() => { const closeExp = document.querySelector('button[aria-label=\"Close dialog\"]'); if (closeExp) closeExp.click(); return true; })()"
sleep 2

echo "Stopping video capture..."
playwright-cli video-stop
sleep 2
playwright-cli close

echo "Converting WebM to MP4 (H.264)..."
ffmpeg -y -i public/demo-video.webm -c:v libx264 -pix_fmt yuv420p -movflags +faststart public/demo-video.mp4
cp public/demo-video.mp4 ./demo-video.mp4

echo "Video capture completed successfully!"
ls -lh public/demo-video.webm public/demo-video.mp4 ./demo-video.mp4
