import { test, expect } from '@playwright/test';

test.describe('Admin Gallery', () => {
  test('should load the admin panel and display gallery sections', async ({ page }) => {
    // Navigate to admin panel (adjust URL if needed)
    await page.goto('/admin');
    
    // Check that the admin panel is visible
    const adminPanel = page.locator('.admin-panel');
    await expect(adminPanel).toBeVisible();
    
    // Switch to the "Galeries" tab
    const galleriesTab = page.locator('button[role="tab"]:has-text("Galeries")');
    await galleriesTab.click();
    
    // Check that the gallery sections are visible
    const bgRemovedSection = page.locator('.gallery-section:has-text("fond supprimé")');
    const withDecorSection = page.locator('.gallery-section:has-text("avec décor")');
    
    await expect(bgRemovedSection).toBeVisible();
    await expect(withDecorSection).toBeVisible();
  });
  
  test('should toggle photo visibility', async ({ page }) => {
    await page.goto('/admin');
    
    // Switch to the "Galeries" tab
    const galleriesTab = page.locator('button[role="tab"]:has-text("Galeries")');
    await galleriesTab.click();
    
    // Find a photo in the "avec décor" section and toggle its visibility
    const firstPhoto = page.locator('.gallery-section:has-text("avec décor") .gallery-thumb').first();
    const toggleLabel = firstPhoto.locator('.toggle-label');
    const isInitiallyActive = await firstPhoto.evaluate(el => el.classList.contains('inactive'));
    
    await toggleLabel.click();
    
    // Check that the photo's active state toggled
    if (isInitiallyActive) {
      await expect(firstPhoto).not.toHaveClass(/inactive/);
    } else {
      await expect(firstPhoto).toHaveClass(/inactive/);
    }
  });
});