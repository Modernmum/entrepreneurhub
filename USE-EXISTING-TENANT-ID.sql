-- USE YOUR EXISTING TENANT ID FOR BOTH BUSINESSES
-- Tenant ID: 00000000-0000-0000-0000-000000000001
-- This connects Maggie Forbes AND Growth Manager Pro to the same tenant

-- Step 1: Delete the auto-generated tenants
DELETE FROM tenants WHERE slug IN ('maggie-forbes', 'growth-manager-pro', 'unbound-team');

-- Step 2: Create ONE main tenant with your existing ID
INSERT INTO tenants (id, name, slug, type, branding, revenue_share_percent, status, settings)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Kristi''s Business Empire',
  'kristi-empire',
  'main',
  '{
    "logo": "/logos/empire.png",
    "colors": {
      "primary": "#8B5CF6",
      "secondary": "#EC4899",
      "accent": "#F59E0B"
    },
    "tagline": "Maggie Forbes + Growth Manager Pro"
  }',
  0,
  'active',
  '{
    "brands": {
      "maggie_forbes": {
        "name": "Maggie Forbes",
        "url": "maggieforbes.com",
        "target": "high-end business clients"
      },
      "growth_manager_pro": {
        "name": "Growth Manager Pro",
        "url": "growthmangerpro.com",
        "target": "solopreneurs"
      }
    }
  }'
);

-- Step 3: Set up automation preferences for this tenant
INSERT INTO partner_automation_preferences (
  tenant_id,
  lead_gen_enabled,
  leads_per_run,
  target_industry,
  min_fit_score,
  notification_email
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  FALSE,
  30,
  'high-end business clients and solopreneurs',
  7,
  'kristi@maggieforbes.com'
)
ON CONFLICT (tenant_id) DO UPDATE SET
  leads_per_run = 30,
  target_industry = 'high-end business clients and solopreneurs';

-- Step 4: Verify it worked
SELECT
  id,
  name,
  slug,
  type,
  settings->'brands' as brands
FROM tenants
WHERE id = '00000000-0000-0000-0000-000000000001';

-- You should see your tenant with both brands listed

-- Step 5: Check automation is set up
SELECT * FROM partner_automation_preferences
WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

-- Success message
SELECT 'Your existing tenant ID is now connected! Both Maggie Forbes and Growth Manager Pro share this tenant.' as status;
