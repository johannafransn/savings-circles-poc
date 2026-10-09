// Fictional mock data for the Apwoche community money PoC. Names, numbers and
// balances are made up. Imported statically by both the member app and the
// admin site.
//
// 1 Apwoche = 1 KES. Minting creates each member's personal CRC and wraps it
// into Apwoche in the same step, so the app only ever shows one currency.

export const COMMUNITY = {
  id: 'apwoche',
  name: 'Apwoche',
  fullName: 'Apwoche Investment Group',
  location: 'Kisumu, Kenya',
  token: 'Apwoche',
  inviteCode: 'APWOCHE-2041',
  adminId: 'm3',
};

// via: 'founder' (was there from the start) or 'link' (joined with the admin's link).
export const MEMBERS = [
  { id: 'm1', name: 'Achieng Otieno', phone: '+254 700 000 001', joined: '2024-03-01', via: 'founder', balance: 640, photo: null },
  { id: 'm2', name: 'Brian Ouma', phone: '+254 700 000 002', joined: '2023-02-04', via: 'founder', balance: 1480, photo: null },
  { id: 'm3', name: 'Grace Akinyi', phone: '+254 700 000 003', joined: '2023-02-04', via: 'founder', balance: 520, photo: null },
  { id: 'm4', name: 'Kevin Odhiambo', phone: '+254 700 000 004', joined: '2023-06-10', via: 'founder', balance: 330, photo: null },
  { id: 'm5', name: 'Mercy Atieno', phone: '+254 700 000 005', joined: '2024-01-15', via: 'founder', balance: 610, photo: null },
  { id: 'm6', name: 'Samuel Okoth', phone: '+254 700 000 006', joinedDaysAgo: 12, via: 'link', balance: 120, photo: null },
  { id: 'm7', name: 'Faith Adhiambo', phone: '+254 700 000 007', joined: '2023-09-20', via: 'founder', balance: 980, photo: null },
  { id: 'm8', name: 'Peter Owino', phone: '+254 700 000 008', joinedDaysAgo: 4, via: 'link', balance: 740, photo: null },
];

// The member the demo logs in as when there is no account on this device.
export const DEMO_MEMBER = 'm1';

// Hours since each member last minted (1 Apwoche per hour).
export const LAST_MINT_HOURS_AGO = { m1: 37, m3: 5 };

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// price is Apwoche per session.
export const SERVICES = [
  { id: 's1', memberId: 'm2', category: 'grooming', title: 'Haircut and shave', description: 'Clean cut at my shop in town.', price: 150, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], hoursPerDay: 8 },
  { id: 's2', memberId: 'm1', category: 'tailoring', title: 'Clothes repair', description: 'Hems, zips and school uniforms.', price: 200, days: ['Mon', 'Wed', 'Fri'], hoursPerDay: 5 },
  { id: 's3', memberId: 'm4', category: 'transport', title: 'Boda ride in town', description: 'Quick rides anywhere in town.', price: 100, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], hoursPerDay: 10 },
  { id: 's4', memberId: 'm7', category: 'grooming', title: 'Braiding', description: 'Box braids and cornrows.', price: 600, days: ['Fri', 'Sat', 'Sun'], hoursPerDay: 6 },
  { id: 's5', memberId: 'm8', category: 'repairs', title: 'Motorbike service', description: 'Oil, brakes and chain.', price: 400, days: ['Tue', 'Thu', 'Sat'], hoursPerDay: 6 },
  { id: 's6', memberId: 'm6', category: 'food', title: 'Fresh tilapia', description: 'Morning catch from the lake.', price: 350, days: ['Mon', 'Wed', 'Fri', 'Sat'], hoursPerDay: 4 },
  { id: 's7', memberId: 'm5', category: 'cleaning', title: 'House cleaning', description: 'Floors, windows and laundry.', price: 300, days: ['Tue', 'Thu', 'Sat'], hoursPerDay: 6 },
  { id: 's8', memberId: 'm3', category: 'teaching', title: 'Maths tutoring', description: 'Primary and secondary maths.', price: 250, days: ['Mon', 'Tue', 'Wed', 'Thu'], hoursPerDay: 2 },
];

// Things members need that nobody offers yet. budget is in Apwoche.
export const REQUESTS = [
  { id: 'q1', memberId: 'm2', category: 'cleaning', title: 'Clean my barber shop', description: 'Saturday morning, about 2 hours.', budget: 300, status: 'open', daysAgo: 1 },
  { id: 'q2', memberId: 'm6', category: 'labour', title: 'Carry fish crates', description: 'At the beach, 6am, any day.', budget: 450, status: 'open', daysAgo: 2 },
  { id: 'q3', memberId: 'm7', category: 'other', title: 'Photos for my salon', description: 'A few nice photos on a phone.', budget: 500, status: 'open', daysAgo: 3 },
  { id: 'q4', memberId: 'm5', category: 'tailoring', title: 'Fix a school bag', description: 'Torn strap, needs stitching.', budget: 150, status: 'taken', takenBy: 'm1', daysAgo: 5 },
];

// kind: 'pay' (from → to) or 'mint'. what = what the payment was for.
export const ACTIVITY = [
  { kind: 'pay', from: 'm2', to: 'm1', amount: 200, what: 'Clothes repair', daysAgo: 1 },
  { kind: 'pay', from: 'm1', to: 'm2', amount: 150, what: 'Haircut and shave', daysAgo: 2 },
  { kind: 'mint', from: 'm1', amount: 24, daysAgo: 2 },
  { kind: 'pay', from: 'm7', to: 'm8', amount: 400, what: 'Motorbike service', daysAgo: 3 },
  { kind: 'pay', from: 'm1', to: 'm6', amount: 700, what: 'Fresh tilapia', daysAgo: 4 },
  { kind: 'pay', from: 'm4', to: 'm7', amount: 600, what: 'Braiding', daysAgo: 5 },
  { kind: 'pay', from: 'm1', to: 'm4', amount: 200, what: 'Boda ride in town', daysAgo: 6 },
  { kind: 'mint', from: 'm1', amount: 48, daysAgo: 7 },
  { kind: 'pay', from: 'm5', to: 'm1', amount: 400, what: 'Clothes repair', daysAgo: 10 },
];
