import { Suspense, lazy, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Analytics from './components/Analytics'
import Assistant from './components/Assistant'
import CartBar from './components/CartBar'
import ReplaceCartModal from './components/ReplaceCartModal'
import Home from './pages/Home'
import Restaurants from './pages/Restaurants'





import { ForgotPassword, Login, Register, ResetPassword } from './pages/Auth'











import NotFound from './pages/NotFound'

const Handoff = lazy(() => import('./pages/Handoff'))
const Groceries = lazy(() => import('./pages/Groceries'))
const RestaurantPage = lazy(() => import('./pages/RestaurantPage'))
const Cart = lazy(() => import('./pages/Cart'))
const Search = lazy(() => import('./pages/Search'))
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'))
const CmsPage = lazy(() => import('./pages/CmsPage'))
const AccountLayout = lazy(() => import('./components/AccountLayout'))
const Dashboard = lazy(() => import('./pages/account/Dashboard'))
const Orders = lazy(() => import('./pages/account/Orders'))
const Addresses = lazy(() => import('./pages/account/Addresses'))
const Payments = lazy(() => import('./pages/account/Payments'))
const Favorites = lazy(() => import('./pages/account/Favorites'))
const Notifications = lazy(() => import('./pages/account/Notifications'))
const Support = lazy(() => import('./pages/account/Support'))
const Profile = lazy(() => import('./pages/account/Profile'))
const named = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })))
const drive = () => import('./pages/drive/Drive')
const driveOb = () => import('./pages/drive/Onboarding')
const biz = () => import('./pages/business/Business')
const bizPortal = () => import('./pages/business/Portal')
const DriveLanding = named(drive, 'DriveLanding'), DriveApply = named(drive, 'DriveApply'), DriveLogin = named(drive, 'DriveLogin')
const DriveLayout = named(driveOb, 'DriveLayout'), DriveOverview = named(driveOb, 'DriveOverview'), DriveDocuments = named(driveOb, 'DriveDocuments'), DriveTraining = named(driveOb, 'DriveTraining'), DrivePayout = named(driveOb, 'DrivePayout')
const BusinessLanding = named(biz, 'BusinessLanding'), BusinessApply = named(biz, 'BusinessApply'), BusinessLogin = named(biz, 'BusinessLogin')
const BusinessLayout = named(bizPortal, 'BusinessLayout'), BusinessOverview = named(bizPortal, 'BusinessOverview'), BusinessDocuments = named(bizPortal, 'BusinessDocuments'), BusinessHours = named(bizPortal, 'BusinessHours'), BusinessPayouts = named(bizPortal, 'BusinessPayouts')

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Header />
      <main className="flex-1 pb-24">
        <Suspense fallback={<div className="container-x py-16"><div className="h-64 animate-pulse rounded-2xl bg-ink-100" /></div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/restaurants" element={<Restaurants />} />
          <Route path="/groceries" element={<Groceries />} />
          <Route path="/restaurant/:slug" element={<RestaurantPage />} />
          <Route path="/store/:slug" element={<RestaurantPage />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/search" element={<Search />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/handoff" element={<Handoff />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/orders" element={<Navigate to="/account/orders" replace />} />
          <Route path="/account" element={<AccountLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="addresses" element={<Addresses />} />
            <Route path="payments" element={<Payments />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="support" element={<Support />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="/drive" element={<DriveLanding />} />
          <Route path="/drive/apply" element={<DriveApply />} />
          <Route path="/drive/login" element={<DriveLogin />} />
          <Route path="/drive/onboarding" element={<DriveLayout />}>
            <Route index element={<DriveOverview />} />
            <Route path="documents" element={<DriveDocuments />} />
            <Route path="training" element={<DriveTraining />} />
            <Route path="payout" element={<DrivePayout />} />
          </Route>
          <Route path="/become-a-courier" element={<Navigate to="/drive" replace />} />
          <Route path="/partner-with-us" element={<Navigate to="/business" replace />} />
          <Route path="/business" element={<BusinessLanding />} />
          <Route path="/business/apply" element={<BusinessApply />} />
          <Route path="/business/login" element={<BusinessLogin />} />
          <Route path="/business/onboarding" element={<BusinessLayout />}>
            <Route index element={<BusinessOverview />} />
            <Route path="documents" element={<BusinessDocuments />} />
            <Route path="hours" element={<BusinessHours />} />
            <Route path="payouts" element={<BusinessPayouts />} />
          </Route>
          <Route path="/order/:id" element={<OrderSuccess />} />
          {/* Any other single-segment URL is a backend-managed page (/about, /privacy-policy, ...) */}
          <Route path="/:slug" element={<CmsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </main>
      <Footer />
      <CartBar />
      <ReplaceCartModal />
      <Assistant />
      <Analytics />
    </div>
  )
}
