import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

// Supabase backend configuration
function normalizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return 'https://nnytbwjnhmhusrbfycju.supabase.co';
  }
  const clean = rawUrl.trim().replace(/^["']|["']$/g, '');
  if (!clean) {
    return 'https://nnytbwjnhmhusrbfycju.supabase.co';
  }
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }
  if (clean.includes('.supabase.co')) {
    return `https://${clean}`;
  }
  return `https://${clean}.supabase.co`;
}

const SUPABASE_URL = normalizeSupabaseUrl(process.env.VITE_SUPABASE_URL);
const SUPABASE_ANON_KEY = (process.env.VITE_SUPABASE_ANON_KEY && String(process.env.VITE_SUPABASE_ANON_KEY).trim()) || 'sb_publishable_LiilPJx72MCRVpSkc6b_UQ_NAP7EZLT';
const supabaseAdminClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// In-memory active session store with TTL (12 hours)
interface AdminSession {
  token: string;
  userId: string;
  username: string;
  role: 'admin';
  createdAt: number;
  expiresAt: number;
}
const activeSessions = new Map<string, AdminSession>();

// Secure hash helper
function secureHash(str: string): string {
  return crypto.createHmac('sha256', SESSION_SECRET).update(str).digest('hex');
}

// Initial Administrator definition (Protected server-side only)
const ADMIN_CREDENTIAL_USERNAME = 'Gamjinmarak';
const ADMIN_PASSWORD_HASH = secureHash('130990');
const ADMIN_MAPPED_EMAIL = 'gamjinmarak@bazaarx.com';

async function startServer() {
  const app = express();
  app.use(express.json());

  // Partner Hub Login Route (Server-Side Authentication & Role Verification)
  app.post('/api/partner-hub/login', async (req, res) => {
    try {
      const { username, password } = req.body || {};

      if (!username || !password) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password.',
        });
      }

      const cleanUsername = String(username).trim();
      const inputPassword = String(password);

      // 1. Strict single-authorized-admin credentials check
      const isUsernameMatch = cleanUsername.toLowerCase() === ADMIN_CREDENTIAL_USERNAME.toLowerCase();
      const isPasswordMatch = inputPassword === '130990';

      if (!isUsernameMatch || !isPasswordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid Partner Hub credentials',
        });
      }

      // 2. Supabase database authorization check against admin_users table
      const { data: dbAdmins, error: dbAdminErr } = await supabaseAdminClient
        .from('admin_users')
        .select('*')
        .ilike('username', cleanUsername);

      if (dbAdminErr || !dbAdmins || dbAdmins.length === 0) {
        console.error('Partner Hub admin lookup in admin_users failed:', dbAdminErr);
        return res.status(401).json({
          success: false,
          message: 'Invalid Partner Hub credentials',
        });
      }

      const authorizedAdmin = dbAdmins[0];
      if (authorizedAdmin.username.toLowerCase() !== ADMIN_CREDENTIAL_USERNAME.toLowerCase() || authorizedAdmin.role !== 'admin') {
        return res.status(401).json({
          success: false,
          message: 'Invalid Partner Hub credentials',
        });
      }

      // 3. Generate cryptographically secure session token
      const rawToken = crypto.randomBytes(32).toString('hex');
      const token = `${rawToken}.${secureHash(rawToken)}`;
      const now = Date.now();
      const session: AdminSession = {
        token,
        userId: authorizedAdmin.id || 'admin_gamjinmarak',
        username: ADMIN_CREDENTIAL_USERNAME,
        role: 'admin',
        createdAt: now,
        expiresAt: now + 12 * 60 * 60 * 1000, // 12 hours validity
      };

      activeSessions.set(token, session);

      return res.status(200).json({
        success: true,
        token,
        user: {
          uid: authorizedAdmin.id || 'admin_gamjinmarak',
          username: ADMIN_CREDENTIAL_USERNAME,
          displayName: authorizedAdmin.display_name || ADMIN_CREDENTIAL_USERNAME,
          email: authorizedAdmin.email || ADMIN_MAPPED_EMAIL,
          role: 'admin',
        },
        message: 'Partner Hub login authenticated successfully.',
      });
    } catch (err: any) {
      console.error('Server Partner Hub login error:', err);
      return res.status(401).json({
        success: false,
        message: 'Invalid Partner Hub credentials',
      });
    }
  });

  // Partner Hub Session Verification Route
  app.get('/api/partner-hub/verify', (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return res.status(401).json({
        authenticated: false,
        message: 'Invalid Partner Hub credentials',
      });
    }

    const session = activeSessions.get(token);
    if (!session || session.username !== ADMIN_CREDENTIAL_USERNAME || session.role !== 'admin') {
      return res.status(401).json({
        authenticated: false,
        message: 'Invalid Partner Hub credentials',
      });
    }

    if (Date.now() > session.expiresAt) {
      activeSessions.delete(token);
      return res.status(401).json({
        authenticated: false,
        message: 'Partner Hub session has expired. Please log in again.',
      });
    }

    return res.status(200).json({
      authenticated: true,
      user: {
        uid: session.userId,
        username: session.username,
        displayName: session.username,
        email: ADMIN_MAPPED_EMAIL,
        role: session.role,
      },
      expiresAt: session.expiresAt,
    });
  });

  // Partner Hub Logout Route
  app.post('/api/partner-hub/logout', (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (token) {
      activeSessions.delete(token);
    }
    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
  });

  // Admin Clean Demo Data Endpoint (Removes demo shops and sample listings)
  app.post('/api/admin/clean-demo-data', async (req, res) => {
    try {
      const demoShopIds = ['shop_freshmart', 'shop_apex', 'shop_metro', 'shop_nexus_retail'];
      const demoProductIds = ['prod_fresh_apples', 'prod_apex_headphones'];

      // Delete demo products from Supabase
      await supabaseAdminClient.from('products').delete().in('shop_id', demoShopIds);
      await supabaseAdminClient.from('products').delete().in('id', demoProductIds);

      // Delete demo shops from Supabase
      await supabaseAdminClient.from('shops').delete().in('id', demoShopIds);

      return res.status(200).json({
        success: true,
        message: 'Preview demo data cleaned successfully.',
      });
    } catch (err: any) {
      console.error('Clean demo data error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to clean preview demo data.',
      });
    }
  });

  // Supabase health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      supabaseUrl: SUPABASE_URL,
      time: new Date().toISOString(),
    });
  });

  // =========================================================================
  // BACKEND SECURITY: Strict Local Buyer-Seller PIN Code Matching
  // =========================================================================
  app.post('/api/orders/validate-pincode', async (req, res) => {
    try {
      const { buyerPinCode, items, restrictionEnabled = true } = req.body || {};

      const cleanBuyerPin = (buyerPinCode || '').trim();

      if (!restrictionEnabled) {
        return res.status(200).json({
          allowed: true,
          message: 'Local PIN code restriction is currently disabled in Partner Hub.',
          results: (items || []).map((it: any) => ({
            productId: it.productId,
            shopId: it.shopId,
            allowed: true,
          })),
        });
      }

      if (!cleanBuyerPin) {
        return res.status(400).json({
          allowed: false,
          message: 'A valid 6-digit delivery PIN code is required.',
        });
      }

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          allowed: false,
          message: 'No items provided for order validation.',
        });
      }

      const results = [];
      let hasBlockedItems = false;

      for (const item of items) {
        let sellerPin = (item.sellerPinCode || item.shopPinCode || '').trim();

        // If seller PIN is not passed, lookup shop in Supabase
        if (!sellerPin && item.shopId) {
          try {
            const { data: shopData } = await supabaseAdminClient
              .from('shops')
              .select('service_pin_code, postal_code')
              .eq('id', item.shopId)
              .single();
            if (shopData) {
              sellerPin = String(shopData.service_pin_code || shopData.postal_code || '').trim();
            }
          } catch (lookupErr) {
            // Ignore optional Supabase error
          }
        }

        const isMatch = sellerPin ? sellerPin === cleanBuyerPin : true;
        if (!isMatch) {
          hasBlockedItems = true;
        }

        results.push({
          productId: item.productId,
          shopId: item.shopId,
          sellerPinCode: sellerPin,
          buyerPinCode: cleanBuyerPin,
          allowed: isMatch,
          reason: isMatch ? 'Allowed' : 'Sorry, this product is currently available only in your local area.',
        });
      }

      if (hasBlockedItems) {
        return res.status(400).json({
          allowed: false,
          message: 'Sorry, this product is currently available only in your local area.',
          results,
        });
      }

      return res.status(200).json({
        allowed: true,
        message: 'All products are available in your local delivery area.',
        results,
      });
    } catch (err: any) {
      console.error('Server PIN validation error:', err);
      return res.status(500).json({
        allowed: false,
        message: 'Internal server error while verifying delivery area.',
      });
    }
  });

  // Setup Vite in middleware mode for dev, or serve dist in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on http://0.0.0.0:${PORT}`);
  });
}

startServer();
