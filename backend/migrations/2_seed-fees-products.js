export async function up(pgm) {
    pgm.sql(`
        INSERT INTO fee( name_fee, price_fee, duration, description_forfait, optional_title, optional_price, optional_desc)
        VALUES
        (
        'Forfait de Diag''N''Rev', 35.00, 45,
        'Diagnostic général
Réglage freins / dérailleur
Gonflage + vérification pression
Lubrification chaîne
Serrage sécurité',
        'Option VAE (+10€)', 10.00,
        'Vérification batterie (visuelle)
Check connectiques simples (sans démontage)'
      ),
      (
        'Forfait d''entretien standard', 65.00, 60,
        'Inclut le forfait Diag''N''Rev +
Le nettoyage transmission
Réglage précis des vitesses
Vérification d''usures (plaquettes, chaînes)
Ajustement direction / roue',
        'Option VAE (+20€)', 20.00,
        'Diagnostic batterie + autonomie
Vérification moteur (non démonté)
Test assistance'
      ),
      (
        'Forfait Premium', 100.00, 60,
        'Inclut le forfait d''entretien standard +
Nettoyage complet (dégraissage)
Dévoilage roues (léger)
Réglages avancés
Diagnostic pièces à remplacer
OFFERT:
Petit kit d''entretien
Remise sur pièces',
        'Option VAE (+35€)', 35.00,
        'Diagnostic électronique approfondi
Test moteur + capteurs
Mise à jour firmware (si possible)'
      ),
      (
        'Forfait VAE', 125.00, 120,
        'Inclut le forfait d''entretien standard +
Diagnostic électronique approfondi
Analyse cycles de charge
Vérification contrôleur
Test assistance
Rapport santé batterie
Test moteur + capteurs
Mise à jour firmware (si possible)
OFFERT:
Petit kit d''entretien
Remise sur pièces',
        NULL, NULL, NULL
      )
  `)
    pgm.sql(`
    INSERT INTO additional_product(name, category, price)
    VALUES
        ('Chambre à air', 'produit', 13.50),
        ('Pneus', 'produit', 37.00),
        ('Plaquettes de frein', 'produit', 42.00),
        ('Lubrifiants', 'produit', 12.00),
        ('Antivols', 'produit', 50.00),
        ('Pedalier', 'produit', 25.00),
        ('Chaine', 'produit', 8.00),
        ('Petit kit entretien', 'produit', 15.00),
        ('Remplacement pièce (+ main d''œuvre)', 'service', 5.00),
        ('Nettoyage seul', 'service', 10.00),
        ('Réglage spécifique', 'service', 15.00)
    `)
}

export async function down(pgm) {
    pgm.sql(`DELETE FROM additional_product`)
    pgm.sql(`DELETE FROM fee`)
}