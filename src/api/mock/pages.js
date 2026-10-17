// Mock CMS content. Every page is plain JSON, so the backend can return the
// same shape from GET /pages/:slug and /site/footer. Section types understood by
// src/components/PageRenderer.jsx: text, list, steps, stats, faq, cta, contact.
// NOTE: legal copy below is placeholder text and must be reviewed by counsel.

const UPDATED = '2026-10-01'

export const footer = [
  { title: 'Company', links: [{ label: 'About us', to: '/about' }, { label: 'Careers', to: '/careers' }, { label: 'Contact us', to: '/contact' }] },
  { title: 'Partners', links: [{ label: 'Business Partner', to: '/business' }, { label: 'Join Forky Drive', to: '/drive' }] },
  { title: 'Help', links: [{ label: 'FAQ', to: '/faq' }, { label: 'Account security', to: '/account-security' }, { label: 'Refunds & cancellations', to: '/refund-policy' }] },
  { title: 'Legal', links: [{ label: 'Terms of service', to: '/terms-of-service' }, { label: 'Privacy policy', to: '/privacy-policy' }, { label: 'Accessibility', to: '/accessibility-policy' }] },
]

const t = (heading, ...body) => ({ type: 'text', heading, body })

export const pages = [
  {
    slug: 'about', title: 'About Forky', subtitle: 'Food and groceries from the places you love, delivered fast.', layout: 'landing', updatedAt: UPDATED,
    description: 'Learn who we are, what we believe in, and how Forky brings local kitchens and stores to your door.',
    sections: [
      t('Our story', 'Forky started with a simple idea: the best food and groceries in your neighbourhood should be easy to find and quick to get. We built one place to discover local restaurants and stores, order in a few taps and follow your meal all the way to your door.', 'Today we work with independent restaurants, grocers and delivery partners across Ontario to bring dinner and the weekly shop to you, with live tracking from kitchen to doorstep.'),
      { type: 'stats', items: [{ value: '30 min', label: 'Typical delivery time' }, { value: 'Live', label: 'Order tracking' }, { value: '100%', label: 'Locally partnered kitchens' }] },
      { type: 'list', heading: 'What we stand for', items: ['Local first: we put independent restaurants in front of you.', 'Honest pricing: delivery fees and taxes are shown before you pay.', 'Fair to partners: transparent commissions and quick payouts for kitchens and couriers.', 'Reliable: live tracking, clear ETAs and support when something goes wrong.'] },
      { type: 'cta', heading: 'Hungry?', text: 'Find the closest places that have everything on your list.', button: { label: 'Start ordering', to: '/' } },
    ],
  },
  {
    slug: 'careers', title: 'Careers at Forky', subtitle: 'Help us build the easiest way to get food and groceries.', layout: 'landing', updatedAt: UPDATED,
    description: 'Join the Forky team and help local businesses reach more customers.',
    sections: [
      t('Why work with us', 'We are a small, fast-moving team that cares about the details, from the first tap to the doorstep. You will own real problems and see the impact within days.'),
      { type: 'list', heading: 'Perks', items: ['Flexible and remote-friendly working', 'Learning budget', 'Health cover', 'Free meals on every team day'] },
      { type: 'list', heading: 'Open roles', items: ['Frontend Engineer (React)', 'Backend Engineer (APIs & Orders)', 'City Operations Lead', 'Partner Success Manager'] },
      { type: 'cta', heading: 'Don’t see your role?', text: 'Send us your CV and tell us how you would make Forky better.', button: { label: 'Contact us', to: '/contact' } },
    ],
  },
  {
    slug: 'partner-with-us', title: 'Partner with Forky', subtitle: 'Grow your restaurant or store with a new stream of orders.', layout: 'landing', updatedAt: UPDATED,
    description: 'List your restaurant or grocery store on Forky and reach more customers nearby.',
    sections: [
      t('Reach customers already looking for you', 'Forky brings hungry and out-of-milk customers in your area to your menu. We handle discovery, payments and delivery logistics so you can focus on the food.'),
      { type: 'steps', heading: 'How it works', items: [{ title: 'Apply', text: 'Share your business details and menu.' }, { title: 'Get verified', text: 'We check your licences and set up your storefront.' }, { title: 'Go live', text: 'Receive orders in the partner dashboard and start earning.' }] },
      { type: 'faq', heading: 'Partner questions', items: [{ q: 'What does it cost to join?', a: 'Joining is free. We charge a commission only on completed orders. Exact rates are shared during onboarding.' }, { q: 'How quickly do I get paid?', a: 'Payouts are made weekly to your bank account, with a daily statement in your dashboard.' }, { q: 'Can I use my own delivery staff?', a: 'Yes. You can use Forky couriers, your own staff, or both.' }] },
      { type: 'cta', heading: 'Ready to get started?', text: 'Tell us about your business and our team will get in touch.', button: { label: 'Talk to partnerships', to: '/contact?topic=partner' } },
    ],
  },
  {
    slug: 'become-a-courier', title: 'Deliver with Forky', subtitle: 'Earn on your own schedule.', layout: 'landing', updatedAt: UPDATED,
    description: 'Become a Forky courier and earn money delivering meals.',
    sections: [
      t('Be your own boss', 'Choose when you work, deliver in your own neighbourhood and get paid every week. All you need is a smartphone and a way to get around.'),
      { type: 'list', heading: 'Requirements', items: ['18 years or older', 'Valid ID and, if using a motor vehicle, a driving licence', 'A bicycle, scooter or vehicle in good condition', 'Android or iOS smartphone'] },
      { type: 'steps', heading: 'Getting started', items: [{ title: 'Sign up', text: 'Create your courier profile and upload your documents.' }, { title: 'Verify', text: 'We run a quick background and document check.' }, { title: 'Deliver', text: 'Go online in the app and start accepting orders.' }] },
      { type: 'cta', heading: 'Questions before you apply?', text: 'Our courier support team is happy to help.', button: { label: 'Contact us', to: '/contact?topic=courier' } },
    ],
  },
  {
    slug: 'faq', title: 'Frequently asked questions', subtitle: 'Quick answers to the things people ask most.', layout: 'faq', updatedAt: UPDATED,
    description: 'Answers about ordering, delivery, payments, refunds and your account.',
    sections: [
      { type: 'faq', heading: 'Ordering', items: [{ q: 'How do I place an order?', a: 'Choose a restaurant, add items to your cart and check out. You can also type several items separated by commas on the home page to find the nearest places that have them.' }, { q: 'Can I order from a restaurant and a store together?', a: 'Each order is placed with one restaurant. You can place separate orders back to back.' }, { q: 'Can I change or cancel my order?', a: 'You can cancel before the restaurant starts preparing it. After that, please contact support and we will do our best to help.' }] },
      { type: 'faq', heading: 'Delivery', items: [{ q: 'How long will delivery take?', a: 'Restaurant meals usually arrive in about 30 minutes. The estimate for your order is shown before you pay.' }, { q: 'How do I track my order?', a: 'After checkout, follow your order live on the confirmation page.' }, { q: 'Why can’t I see any restaurants?', a: 'Make sure your delivery location is set correctly in the header. Some places may be closed or outside your area.' }] },
      { type: 'faq', heading: 'Payments & refunds', items: [{ q: 'Which payment methods do you accept?', a: 'UPI, cards, wallets and cash on delivery where available.' }, { q: 'How do coupons work?', a: 'Enter a code at checkout. The discount is applied if your order meets the coupon’s conditions.' }, { q: 'When will I get my refund?', a: 'Approved refunds go back to your original payment method within 5 to 7 business days.' }] },
      { type: 'cta', heading: 'Still need help?', text: 'Our support team is here every day.', button: { label: 'Contact us', to: '/contact' } },
    ],
  },
  {
    slug: 'contact', title: 'Contact us', subtitle: 'We usually reply within one business day.', layout: 'article', updatedAt: UPDATED,
    description: 'Get in touch with Forky support, partnerships or press.',
    sections: [
      { type: 'contact', heading: 'Send us a message', topics: [['order', 'Help with an order'], ['account', 'My account'], ['partner', 'Partnerships'], ['courier', 'Courier support'], ['other', 'Something else']], details: [['Email', 'support@forksy.example'], ['Phone', '+00 000 000 0000'], ['Hours', 'Every day, 8am to 11pm']] },
    ],
  },
  {
    slug: 'terms-of-service', title: 'Terms of service', subtitle: 'The rules for using Forky.', layout: 'legal', updatedAt: UPDATED,
    description: 'The terms that apply when you use the Forky website, apps and services.',
    sections: [
      t('1. Acceptance of terms', 'By accessing or using Forky you agree to these Terms of Service. If you do not agree, please do not use the service.'),
      t('2. Your account', 'You must provide accurate information and keep your login details secure. You are responsible for activity under your account. You must be at least 18 years old, or have a parent or guardian’s permission.'),
      t('3. Orders and payment', 'When you place an order you make an offer to buy from the restaurant. Prices, fees and taxes are shown at checkout. Orders are confirmed once the vendor accepts them. We may cancel an order if an item is unavailable or we suspect fraud.'),
      t('4. Delivery', 'Delivery times are estimates and may change with weather, traffic or demand. You must provide a correct address and be reachable at delivery time.'),
      t('5. Cancellations and refunds', 'You can cancel before preparation begins. Refunds for missing, incorrect or unsafe items are handled under our Refund Policy.'),
      t('6. Acceptable use', 'You agree not to misuse the service, attempt to access it without authorisation, interfere with its operation, or use it for unlawful purposes.'),
      t('7. Promotions and coupons', 'Coupons have conditions such as minimum order values and expiry dates. We may withdraw a promotion at any time, and abuse of promotions may lead to account suspension.'),
      t('8. Liability', 'Restaurants are responsible for the food and goods they prepare and sell. To the extent permitted by law, Forky is not liable for indirect or consequential losses.'),
      t('9. Changes to these terms', 'We may update these terms from time to time. Continued use after changes means you accept the updated terms.'),
      t('10. Contact', 'Questions about these terms? Reach us through the Contact page.'),
    ],
  },
  {
    slug: 'privacy-policy', title: 'Privacy policy', subtitle: 'How we collect, use and protect your information.', layout: 'legal', updatedAt: UPDATED,
    description: 'How Forky collects, uses, shares and protects your personal information.',
    sections: [
      t('1. Information we collect', 'We collect information you give us (name, phone, email, addresses, order details), information from your device (IP address, browser, app version) and, with your permission, your location so we can show places near you.'),
      t('2. How we use it', 'We use your information to process orders, show nearby restaurants, provide support, prevent fraud, improve the service and, where you agree, send offers and updates.'),
      t('3. Location data', 'If you allow location access, we use your coordinates to detect your area and city. Your chosen location is stored on your device. You can change it or revoke permission in your browser at any time.'),
      t('4. Sharing', 'We share the details needed to fulfil your order with restaurants and couriers, and with payment and analytics providers who process data for us. We do not sell your personal information.'),
      t('5. Cookies and local storage', 'We use cookies and local storage to keep you signed in, remember your cart and location, and understand how the site is used.'),
      t('6. Retention', 'We keep information for as long as needed to provide the service and meet legal obligations, then delete or anonymise it.'),
      t('7. Your rights', 'Depending on where you live, you can access, correct, delete or export your data, and object to certain processing. Contact us to make a request.'),
      t('8. Security', 'We use technical and organisational measures to protect your data, but no system is completely secure.'),
      t('9. Changes and contact', 'We will post updates on this page. For privacy questions, use the Contact page.'),
    ],
  },
  {
    slug: 'refund-policy', title: 'Refunds & cancellations', subtitle: 'What happens when something goes wrong with an order.', layout: 'legal', updatedAt: UPDATED,
    description: 'When and how you can cancel an order or get a refund on Forky.',
    sections: [
      t('Cancelling an order', 'You can cancel for free until the restaurant starts preparing your order. After that, a cancellation fee may apply.'),
      t('When you are eligible for a refund', 'Missing items, wrong items, spoiled or unsafe food, or an order that never arrives. Please report the issue within 24 hours with photos where possible.'),
      t('How refunds are paid', 'Approved refunds go to your original payment method within 5 to 7 business days. Cash-on-delivery refunds are issued as Forky credit.'),
    ],
  },
  {
    slug: 'accessibility-policy', title: 'Accessibility', subtitle: 'Forky should work for everyone.', layout: 'legal', updatedAt: UPDATED,
    description: 'Our commitment to making Forky accessible to everyone.',
    sections: [
      t('Our commitment', 'We aim to make Forky usable by everyone, including people who use assistive technology. We work towards the Web Content Accessibility Guidelines (WCAG) 2.1 level AA.'),
      t('What we are doing', 'We use semantic markup, keyboard-friendly controls, readable colour contrast and text alternatives. We test with screen readers and review new features for accessibility.'),
      t('Tell us about a problem', 'If you find something hard to use, please tell us through the Contact page so we can fix it.'),
    ],
  },
  {
    slug: 'account-security', title: 'Account security', subtitle: 'Keep your Forky account safe.', layout: 'article', updatedAt: UPDATED,
    description: 'Tips for protecting your Forky account and what to do if you suspect fraud.',
    sections: [
      { type: 'list', heading: 'Protect your account', items: ['Use a unique password that you do not reuse elsewhere.', 'Never share one-time passwords (OTPs) with anyone, including people claiming to be from Forky.', 'Only pay inside the Forky app or website.', 'Sign out on shared devices.'] },
      t('If you think your account was accessed', 'Change your password straight away and contact us so we can secure your account and review recent activity.'),
    ],
  },
]
