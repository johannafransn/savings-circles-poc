// Fictional mock data for the community money PoC. Names, numbers and
// balances are made up. Imported statically by the app.
//
// Minting creates each member's personal CRC and wraps it into the community
// currency in the same step, so the app only ever shows one currency.
// `kes` is what the same thing usually costs in shillings, used to show how
// many shillings a member kept by paying in the community currency.

export const COMMUNITY = {
  id: 'apwoche',
  name: 'Apwoche Investment Group',
  location: 'Kisumu, Kenya',
  token: 'Apwoche',
  inviteCode: 'APWOCHE-2041',
  createdAt: '2023-02-04',
};

export const MEMBERS = [
  { id: 'm1', name: 'Achieng Otieno', phone: '+254 700 000 001', trade: 'Tailor', role: 'member', joined: '2024-03-01', balance: 86 },
  { id: 'm2', name: 'Brian Ouma', phone: '+254 700 000 002', trade: 'Barber', role: 'member', joined: '2023-02-04', balance: 140 },
  { id: 'm3', name: 'Grace Akinyi', phone: '+254 700 000 003', trade: 'Teacher', role: 'organiser', joined: '2023-02-04', balance: 52 },
  { id: 'm4', name: 'Kevin Odhiambo', phone: '+254 700 000 004', trade: 'Boda boda rider', role: 'member', joined: '2023-06-10', balance: 33 },
  { id: 'm5', name: 'Mercy Atieno', phone: '+254 700 000 005', trade: 'Cleaner', role: 'member', joined: '2024-01-15', balance: 61 },
  { id: 'm6', name: 'Samuel Okoth', phone: '+254 700 000 006', trade: 'Fish trader', role: 'member', joined: '2025-11-01', balance: 12 },
  { id: 'm7', name: 'Faith Adhiambo', phone: '+254 700 000 007', trade: 'Hair salon', role: 'member', joined: '2023-09-20', balance: 98 },
  { id: 'm8', name: 'Peter Owino', phone: '+254 700 000 008', trade: 'Mechanic', role: 'member', joined: '2023-02-04', balance: 74 },
];

// The logged-in demo users per role.
export const DEMO_USERS = { member: 'm1', organiser: 'm3' };

// Hours since each member last minted (1 per hour).
export const LAST_MINT_HOURS_AGO = { m1: 37, m3: 5 };

// People who asked to join and wait for the organiser to trust them in.
export const JOIN_REQUESTS = [
  { id: 'r1', name: 'Otieno Wekesa', trade: 'Carpenter', invitedBy: 'm4', daysAgo: 2 },
  { id: 'r2', name: 'Lilian Awino', trade: 'Vegetable seller', invitedBy: 'm5', daysAgo: 1 },
];

// Market. price is in the community currency per unit; kes is the usual shilling price.
export const SERVICES = [
  { id: 's1', memberId: 'm2', title: 'Haircut and shave', price: 1, kes: 150, unit: 'cut', category: 'Grooming', note: 'At my shop in town. Walk in after 2pm.' },
  { id: 's2', memberId: 'm1', title: 'Clothing repairs & alterations', price: 1, kes: 200, unit: 'hour', category: 'Tailoring', note: 'Hems, zips, school uniforms.' },
  { id: 's3', memberId: 'm4', title: 'Boda ride within town', price: 0.5, kes: 100, unit: 'ride', category: 'Transport', note: 'Call before 7pm.' },
  { id: 's4', memberId: 'm7', title: 'Braiding', price: 3, kes: 600, unit: 'session', category: 'Grooming', note: 'Bring your own extensions.' },
  { id: 's5', memberId: 'm8', title: 'Motorbike service', price: 2, kes: 400, unit: 'hour', category: 'Repairs', note: 'Parts paid in shillings.' },
  { id: 's6', memberId: 'm6', title: 'Fresh tilapia', price: 2, kes: 350, unit: 'fish', category: 'Food', note: 'Morning catch, order the day before.' },
];

export const JOBS = [
  { id: 'j1', memberId: 'm2', title: 'Clean my barber shop', reward: 2, kes: 300, unit: 'hours', category: 'Cleaning', when: 'Sat 19 Oct, morning', status: 'open' },
  { id: 'j2', memberId: 'm6', title: 'Help carry fish crates at the beach', reward: 3, kes: 450, unit: 'hours', category: 'Labour', when: 'Daily 6am', status: 'open' },
  { id: 'j3', memberId: 'm3', title: 'Tutor two kids in maths', reward: 4, kes: 800, unit: 'hours', category: 'Teaching', when: 'Weekday evenings', status: 'open' },
  { id: 'j4', memberId: 'm5', title: 'Fix a torn school bag', reward: 1, kes: 150, unit: 'hour', category: 'Tailoring', when: 'This week', status: 'taken', takenBy: 'm1' },
];

// kind: mint | out (a payment from memberId to `to`). kes = shilling value of the trade.
// daysAgo keeps the demo fresh whenever it is opened.
export const ACTIVITY = [
  { memberId: 'm2', to: 'm1', text: 'paid Achieng 1 Apwoche for a hem', amount: 1, kes: 200, daysAgo: 1, kind: 'out' },
  { memberId: 'm1', to: 'm2', text: 'paid Brian 1 Apwoche for a haircut', amount: 1, kes: 150, daysAgo: 2, kind: 'out' },
  { memberId: 'm1', text: 'minted 24 Apwoche', daysAgo: 2, kind: 'mint' },
  { memberId: 'm7', to: 'm8', text: 'paid Peter 2 Apwoche for a bike service', amount: 2, kes: 400, daysAgo: 3, kind: 'out' },
  { memberId: 'm1', to: 'm6', text: 'paid Samuel 4 Apwoche for two fish', amount: 4, kes: 700, daysAgo: 4, kind: 'out' },
  { memberId: 'm4', to: 'm7', text: 'paid Faith 3 Apwoche for braiding', amount: 3, kes: 600, daysAgo: 5, kind: 'out' },
  { memberId: 'm1', to: 'm4', text: 'paid Kevin 1 Apwoche for two boda rides', amount: 1, kes: 200, daysAgo: 6, kind: 'out' },
  { memberId: 'm5', to: 'm1', text: 'paid Achieng 2 Apwoche for altering a dress', amount: 2, kes: 400, daysAgo: 10, kind: 'out' },
];
