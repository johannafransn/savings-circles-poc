// Fictional mock data for the Savings Circles PoC. Names, numbers and
// balances are made up. Imported statically by the app.
// Amounts in KES unless noted. Apwoche amounts are token units.
// Minting creates personal CRC that is wrapped into Apwoche in the same step,
// so the app only ever shows Apwoche.

export const GROUP = {
  id: 'apwoche',
  name: 'Apwoche Investment Group',
  location: 'Kisumu, Kenya',
  token: 'Apwoche',
  cadence: 'monthly',
  nextMeeting: '2026-10-18',
  inviteCode: 'APWOCHE-2041',
  bank: { name: 'Equity Bank', account: '•••• 4821' },
  contribution: { welfare: 500, savings: 2000, development: 1000 },
  loanRules: {
    minMonths: 6,
    limitRatio: 0.8,
    monthlyRate: 0.01,
    bankAnnualRate: 0.05,
    maxTermMonths: 12,
  },
  pool: { welfare: 118500, savings: 486000, development: 211000, lentOut: 142000 },
  createdAt: '2023-02-04',
};

export const ACCOUNTS = [
  { key: 'welfare', label: 'Welfare', hint: 'Sickness or death in the family' },
  { key: 'savings', label: 'Savings', hint: 'Your share of the pool' },
  { key: 'development', label: 'Development / loans', hint: 'Lent out to members' },
];

export const MEMBERS = [
  { id: 'm1', name: 'Achieng Otieno', phone: '+254 700 000 001', trade: 'Tailor', role: 'member', joined: '2024-03-01', months: 19, lifetime: 66500, paidThisCycle: false, apwoche: 86, loan: null },
  { id: 'm2', name: 'Brian Ouma', phone: '+254 700 000 002', trade: 'Barber', role: 'member', joined: '2023-02-04', months: 32, lifetime: 112000, paidThisCycle: true, apwoche: 140, loan: { amount: 40000, repaid: 26000 } },
  { id: 'm3', name: 'Grace Akinyi', phone: '+254 700 000 003', trade: 'Chair · Teacher', role: 'admin', joined: '2023-02-04', months: 32, lifetime: 112000, paidThisCycle: true, apwoche: 52, loan: null },
  { id: 'm4', name: 'Kevin Odhiambo', phone: '+254 700 000 004', trade: 'Boda boda rider', role: 'member', joined: '2023-06-10', months: 28, lifetime: 98000, paidThisCycle: true, apwoche: 33, loan: { amount: 60000, repaid: 15000 } },
  { id: 'm5', name: 'Mercy Atieno', phone: '+254 700 000 005', trade: 'Cleaner', role: 'member', joined: '2024-01-15', months: 21, lifetime: 73500, paidThisCycle: false, apwoche: 61, loan: null },
  { id: 'm6', name: 'Samuel Okoth', phone: '+254 700 000 006', trade: 'Fish trader', role: 'member', joined: '2025-11-01', months: 4, lifetime: 14000, paidThisCycle: true, apwoche: 12, loan: null },
  { id: 'm7', name: 'Faith Adhiambo', phone: '+254 700 000 007', trade: 'Hair salon', role: 'member', joined: '2023-09-20', months: 25, lifetime: 87500, paidThisCycle: true, apwoche: 98, loan: null },
  { id: 'm8', name: 'Peter Owino', phone: '+254 700 000 008', trade: 'Treasurer · Mechanic', role: 'admin', joined: '2023-02-04', months: 32, lifetime: 112000, paidThisCycle: true, apwoche: 74, loan: { amount: 30000, repaid: 30000 } },
];

// The logged-in demo users per role.
export const DEMO_USERS = { member: 'm1', admin: 'm3' };

// Hours since the member last minted (1 Apwoche per hour).
export const LAST_MINT_HOURS_AGO = { m1: 37, m3: 5 };

// Contribution ledger for the demo member, newest first.
export const CONTRIBUTIONS = [
  { month: '2026-10', welfare: 0, savings: 0, development: 0, status: 'due' },
  { month: '2026-09', welfare: 500, savings: 2000, development: 1000, status: 'paid', paidOn: '2026-09-20' },
  { month: '2026-08', welfare: 500, savings: 2000, development: 1000, status: 'paid', paidOn: '2026-08-16' },
  { month: '2026-07', welfare: 500, savings: 2000, development: 1000, status: 'paid', paidOn: '2026-07-19' },
  { month: '2026-06', welfare: 500, savings: 0, development: 0, status: 'partial', paidOn: '2026-06-21' },
  { month: '2026-05', welfare: 500, savings: 2000, development: 1000, status: 'paid', paidOn: '2026-05-17' },
  { month: '2026-04', welfare: 500, savings: 2000, development: 1000, status: 'paid', paidOn: '2026-04-19' },
  { month: '2026-03', welfare: 500, savings: 2000, development: 1000, status: 'paid', paidOn: '2026-03-15' },
  { month: '2026-02', welfare: 500, savings: 2000, development: 1000, status: 'paid', paidOn: '2026-02-21' },
  { month: '2026-01', welfare: 500, savings: 2000, development: 1000, status: 'paid', paidOn: '2026-01-17' },
];

// Lifetime split for the demo member (matches MEMBERS.m1.lifetime).
export const LIFETIME_SPLIT = { welfare: 9500, savings: 36000, development: 21000 };

export const LOAN_APPLICATIONS = [
  { id: 'l1', memberId: 'm5', amount: 25000, termMonths: 6, purpose: 'Buy a second pressure washer', status: 'pending', createdAt: '2026-10-02' },
  { id: 'l2', memberId: 'm7', amount: 50000, termMonths: 10, purpose: 'Salon chairs and dryer', status: 'pending', createdAt: '2026-10-05' },
  { id: 'l3', memberId: 'm1', amount: 20000, termMonths: 6, purpose: 'Sewing machine repair', status: 'repaid', createdAt: '2025-08-11' },
];

export const WELFARE_CLAIMS = [
  { id: 'w1', memberId: 'm4', reason: 'sickness', note: 'Hospital bill for my son', amount: 15000, status: 'pending', createdAt: '2026-10-06' },
  { id: 'w2', memberId: 'm2', reason: 'death', note: 'Funeral of my grandmother', amount: 20000, status: 'paid', createdAt: '2026-05-02' },
];

// Apwoche board. price is Apwoche per unit.
export const SERVICES = [
  { id: 's1', memberId: 'm2', title: 'Haircut and shave', price: 1, unit: 'cut', category: 'Grooming', note: 'At my shop in town. Walk in after 2pm.' },
  { id: 's2', memberId: 'm1', title: 'Clothing repairs & alterations', price: 1, unit: 'hour', category: 'Tailoring', note: 'Hems, zips, school uniforms.' },
  { id: 's3', memberId: 'm4', title: 'Boda ride within Kisumu town', price: 0.5, unit: 'ride', category: 'Transport', note: 'Call before 7pm.' },
  { id: 's4', memberId: 'm7', title: 'Braiding', price: 3, unit: 'session', category: 'Grooming', note: 'Bring your own extensions.' },
  { id: 's5', memberId: 'm8', title: 'Motorbike service', price: 2, unit: 'hour', category: 'Repairs', note: 'Parts paid in KES.' },
];

export const JOBS = [
  { id: 'j1', memberId: 'm2', title: 'Clean my barber shop', reward: 2, unit: 'hours', category: 'Cleaning', when: 'Sat 19 Oct, morning', status: 'open' },
  { id: 'j2', memberId: 'm6', title: 'Help carry fish crates at Dunga beach', reward: 3, unit: 'hours', category: 'Labour', when: 'Daily 6am', status: 'open' },
  { id: 'j3', memberId: 'm3', title: 'Tutor two kids in maths', reward: 4, unit: 'hours', category: 'Teaching', when: 'Weekday evenings', status: 'open' },
  { id: 'j4', memberId: 'm5', title: 'Fix a torn school bag', reward: 1, unit: 'hour', category: 'Tailoring', when: 'This week', status: 'taken' },
];

export const ACTIVITY = [
  { memberId: 'm2', to: 'm1', text: 'paid you 1 Apwoche for a haircut', when: '2026-10-07', kind: 'in' },
  { memberId: 'm1', text: 'minted 24 Apwoche', when: '2026-10-06', kind: 'mint' },
  { memberId: 'm1', text: 'paid September contribution · KES 3,500', when: '2026-09-20', kind: 'save' },
  { memberId: 'm5', to: 'm1', text: 'paid you 2 Apwoche for altering a dress', when: '2026-09-14', kind: 'in' },
];
