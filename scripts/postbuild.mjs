// After `vite build`: make deep links work even when the host ignores .htaccess.
// Copies index.html into a folder for every fixed route (dist/restaurants/index.html, ...)
// and to 404.html, so a refresh on /restaurants, /account/orders, /faq... still loads the app.
// Dynamic URLs (/restaurant/<slug>, /order/<id>) still need the .htaccess rewrite or the 404.html fallback.
import fs from 'fs'
import path from 'path'

const dist = path.resolve('dist')
const html = fs.readFileSync(path.join(dist, 'index.html'))
const routes = [
  'restaurants', 'groceries', 'cart', 'search', 'login', 'register', 'forgot-password', 'reset-password', 'orders',
  'account', 'account/orders', 'account/addresses', 'account/payments', 'account/favorites', 'account/notifications', 'account/support', 'account/profile',
  'drive', 'drive/apply', 'drive/login', 'drive/onboarding', 'drive/onboarding/documents', 'drive/onboarding/training', 'drive/onboarding/payout',
  'business', 'business/apply', 'business/login', 'business/onboarding', 'business/onboarding/documents', 'business/onboarding/hours', 'business/onboarding/payouts',
  'about', 'careers', 'contact', 'faq', 'terms-of-service', 'privacy-policy', 'refund-policy', 'accessibility-policy', 'account-security', 'partner-with-us', 'become-a-courier',
]
routes.forEach((r) => { fs.mkdirSync(path.join(dist, r), { recursive: true }); fs.writeFileSync(path.join(dist, r, 'index.html'), html) })
fs.writeFileSync(path.join(dist, '404.html'), html)
// Same rules as .htaccess, visible in file managers that hide dot-files: rename to .htaccess if it is missing.
const ht = path.join(dist, '.htaccess')
if (fs.existsSync(ht)) fs.copyFileSync(ht, path.join(dist, 'htaccess.txt'))
console.log(`postbuild: ${routes.length} route folders + 404.html`)
