import { test, expect } from '@playwright/test';

test.describe('Public Gallery', () => {
  test('should load and display the gallery', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/La P'tite Boutik Solidaire/);
    
    // Check that the gallery section is visible
    const gallerySection = page.locator('section#galerie');
    await expect(gallerySection).toBeVisible();
    
    // Check that at least one photo is visible
    const photos = gallerySection.locator('.photo-item');
    await expect(photos.first()).toBeVisible();
  });
  
  test('should open and close the photo modal', async ({ page }) => {
    await page.goto('/');
    
    // Click the first photo to open the modal
    const firstPhoto = page.locator('section#galerie .photo-item').first();
    await firstPhoto.click();
    
    // Check that the modal is visible
    const modal = page.locator('.modal');
    await expect(modal).toBeVisible();
    
    // Close the modal
    const closeButton = modal.locator('.modal-close');
    await closeButton.click();
    
    // Check that the modal is no longer visible
    await expect(modal).not.toBeVisible();
  });
});