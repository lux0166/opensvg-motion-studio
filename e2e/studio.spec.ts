import { test, expect } from '@playwright/test';

test.describe('GATE UI-5B: Real Browser Studio Certification (Playwright & Chromium)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('1. Studio Launch, Canvas Drawing, Hotkeys, and Undo/Redo in Real Chromium', async ({ page }) => {
    // Expect Header Brand to be visible
    await expect(page.getByTitle('OpenSVG Studio Menu')).toBeVisible();

    // 1. Switch to Rectangle tool via keyboard hotkey 'r'
    await page.keyboard.press('r');

    // 2. Perform real mouse drag gesture on Canvas
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    if (box) {
      const startX = box.x + 200;
      const startY = box.y + 200;
      const endX = box.x + 380;
      const endY = box.y + 320;

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(endX, endY);
      await page.mouse.up();
    }

    // Expect toast notification to appear in real browser
    await expect(page.getByText('Created rect layer!')).toBeVisible({ timeout: 5000 });

    // 3. Trigger Undo via hotkey (Control+z)
    await page.keyboard.press('Control+z');
    await expect(page.getByText('Undo')).toBeVisible({ timeout: 5000 });

    // 4. Trigger Redo via hotkey (Control+y)
    await page.keyboard.press('Control+y');
    await expect(page.getByText('Redo')).toBeVisible({ timeout: 5000 });
  });

  test('2. Timeline Transport Controls, Playhead Scrubbing and Playback in Real Chromium', async ({ page }) => {
    // 1. Play / Pause Button interaction
    const playBtn = page.getByTitle('Play / Pause (Space)');
    await expect(playBtn).toBeVisible();
    await playBtn.click();

    // Wait a brief moment for playback clock advance
    await page.waitForTimeout(300);
    await playBtn.click(); // Pause

    // 2. Step Forward and Backward
    const stepFwdBtn = page.getByTitle('Step Forward 0.1s (→)');
    await stepFwdBtn.click();

    const stepBackBtn = page.getByTitle('Step Back 0.1s (←)');
    await stepBackBtn.click();

    // 3. Toggle Loop
    const loopBtn = page.getByTitle('Toggle Loop');
    await loopBtn.click();
    await expect(page.getByText(/Loop:/)).toBeVisible({ timeout: 5000 });
  });

  test('3. Multi-Tab TabBar, State Isolation, and Unsaved Dirty Tab Confirmation Dialog', async ({ page }) => {
    const tablist = page.locator('div[role="tablist"][aria-label="Document Artboard Tabs"]');
    await expect(tablist).toBeVisible();

    const initialTabCount = await tablist.locator('div[role="tab"]').count();

    // 1. Click '+' button to create a new Tab
    const newTabBtn = page.getByTestId('btn-new-tab');
    await newTabBtn.click();

    // Expect tab count to increment by 1
    const tabs = tablist.locator('div[role="tab"]');
    await expect(tabs).toHaveCount(initialTabCount + 1);

    // 2. On the newly created active tab: Draw a shape to make it dirty
    await page.keyboard.press('r');
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 150, box.y + 150);
      await page.mouse.down();
      await page.mouse.move(box.x + 300, box.y + 250);
      await page.mouse.up();
    }

    // Verify shape was created and tab became dirty
    await expect(page.getByText('Created rect layer!')).toBeVisible({ timeout: 5000 });

    // Verify unsaved changes indicator appears on the active tab
    const activeTab = tabs.last();
    await expect(activeTab.locator('span[title="Unsaved changes"]')).toBeVisible({ timeout: 5000 });

    // 3. Click Close on the dirty tab
    const closeBtn = activeTab.locator('button[title*="Close Tab"]');
    await closeBtn.click();

    // Expect Unsaved Changes Dialog to open
    await expect(page.getByRole('heading', { name: 'Unsaved Changes' })).toBeVisible();

    // 4. Click 'Cancel' -> dialog dismisses, tab remains open
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Unsaved Changes' })).not.toBeVisible();
    await expect(tabs).toHaveCount(initialTabCount + 1);

    // 5. Click Close again and click 'Discard' -> newly created tab closes cleanly
    await closeBtn.click();
    await page.getByRole('button', { name: 'Discard' }).click();
    await expect(tabs).toHaveCount(initialTabCount);
  });

  test('4. Properties Panel Interaction Authoring and Native .osvg Export in Real Chromium', async ({ page }) => {
    // 1. Draw a rectangle to select it
    await page.keyboard.press('r');
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(box.x + 250, box.y + 220);
      await page.mouse.up();
    }

    // 2. In Properties Panel, click "Add Interaction"
    const addInterBtn = page.getByTitle('Add Document Interaction');
    await expect(addInterBtn).toBeVisible({ timeout: 5000 });
    await addInterBtn.click();
    await expect(page.getByText('Added click interaction')).toBeVisible({ timeout: 5000 });

    // 3. Open Export Modal
    const exportBtn = page.getByTitle('Export Animation (Ctrl+E)');
    await exportBtn.click();
    await expect(page.getByText('Export Motion Assets')).toBeVisible();

    // 4. Trigger OpenSVG (.osvg) Download and verify file emission
    const downloadPromise = page.waitForEvent('download');
    await page.getByText('OpenSVG Native (.osvg)').click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.osvg$/);
  });
});
