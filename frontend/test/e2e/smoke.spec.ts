import { test, expect } from '@playwright/test';

test('landing page affiche le hero', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', {level: 1})).toHaveText('La réparation de votre vélo qui vient à vous !');
});

test ('la navigation vers "Nos Offres" affiche la page Forfaits', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Nos Offres' }).click();
    await expect(page).toHaveURL('/forfaits');
    await expect(page.getByRole('heading', { name: 'Nos Forfaits' })).toBeVisible();
});

test("la page forfaits affiche les forfaut renvoyés par l'API", async ({ page }) => {
    await page.route('**/api/v1/fees', (route) =>
        route.fulfill({
            json: [
                {
                    fee_id: 1,
                    name_fee: 'Entretien',
                    price_fee: '19.99',
                    duration: 45,
                    description_forfait: 'Vérification freins \nRéglage dérailleur',
                    optional_title: null,
                    optional_desc: null,
                    optional_price: null,
                },
            ],
        })
    );
    await page.route('**/api/v1/products', (route) => route.fulfill({ json: [] }));
    await page.goto('/forfaits');
    await expect(page.getByText('Entretien')).toBeVisible();
});