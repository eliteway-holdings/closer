import { useEffect, useMemo, useRef, useState } from 'react'
import Coach from './Coach.jsx'

const STAGES = ['WhatsApp', 'Call', 'Demo', 'Invoice', 'Won', 'Lost']
const DEFAULT_OFFERS = [
  { id: 'health', name: 'Elite Way Health Tech System (EWHTS)', price: 4500, monthly: 1500, pitch: 'medical facilities', locked: true },
  { id: 'book', name: 'White-label booking OS', price: 3800, monthly: 1200, pitch: 'salons / barbers / studios / DJ classes', locked: true },
]
const SLOTS = ['08:00', '12:00']
const KEY = 'ew-sales-v3'

const SELL_MAP = [
  { if: 'No-shows, paper cards, SMS from a phone, lost follow-up', sell: 'health', why: 'EWHTS. Next appointment, consult summary, prescription PDF, marketing — automated.' },
  { if: 'Salon / barber / photo studio / DJ class still books in DMs or a paper diary', sell: 'book', why: 'White-label booking OS. Their brand, our engine. R3 800 once + R1 200 / month.' },
]

const WA_MSGS = [
  { id: 'open', name: 'First ping', text: `Hi {{name}} — {{staff}} at Elite Way.

You are still running {{company}} in chat. That is leaking money.

{{offer}} puts a platform under it. R{{price}}.

Reply YES if you want the 12-minute walkthrough. Reply LATER if next week.` },
  { id: 'nudge', name: 'No reply', text: `{{name}} — last ping from {{staff}}.

Two doors: we put {{offer}} under {{company}} this week (R{{price}}), or I close the slot so the next house can take it.

YES or NOT NOW. Either is respect.` },
  { id: 'demo', name: 'Book demo', text: `{{name}}, pick a time. 12 minutes. I show {{offer}} for {{company}} on a screen, not a speech.

Today 08:00 or 12:00 SAST — which one?` },
  { id: 'pay', name: 'Pay chase', text: `{{name}} — invoice is live. Work does not start on a promise.

EFT the total. Use the reference on the PDF. Send the proof here.

The cost of waiting is another week with no system.` },
]

const WA_HEALTH = [
  { id: 'open', name: 'First ping', text: `Hi {{name}} — {{staff}} at Elite Way.

Quick one for {{company}}. Do patients still miss the next visit because the reminder lives on a paper card or a phone SMS?

We put Elite Way Health Tech System (EWHTS) under the practice:
• next appointment, automatic
• consult summary after they leave
• link to their prescription PDF
• a clean way to send practice news

R{{price}} to start.

12 minutes — today 08:00 or 12:00?` },
  { id: 'nudge', name: 'No reply', text: `{{name}} — last ping. Empty chairs are the expensive thing.

EWHTS for {{company}} — R{{price}}. YES for 12 minutes, or NOT NOW and I free the slot.` },
  { id: 'demo', name: 'Book demo', text: `{{name}}, 12 minutes. Reminder, summary after consult, script PDF link, marketing send.

08:00 or 12:00 SAST — which one?` },
  { id: 'pay', name: 'Pay chase', text: `{{name}} — invoice for Elite Way Health Tech System (EWHTS) is live. Work starts when EFT clears. Banking on the PDF. Send proof here.` },
]

const WA_BOOK = [
  { id: 'open', name: 'First ping', text: `Hi {{name}} — {{staff}} at Elite Way.

{{company}} still taking bookings in WhatsApp or a book at the till?

We put a white-label booking page under your name — not ours. Client picks a slot. You see the diary. Reminder leaves on its own.

Setup R{{setup}} once. Then R{{month}} / month.

12 minutes — 08:00 or 12:00?` },
  { id: 'nudge', name: 'No reply', text: `{{name}} — last ping. Double-booked chairs and “are you free?” DMs are the expensive thing.

White-label booking for {{company}}. R{{setup}} setup + R{{month}}/month. YES for 12 minutes, or NOT NOW.` },
  { id: 'demo', name: 'Book demo', text: `{{name}}, 12 minutes. I show your brand on the booking page, the diary, the reminder.

08:00 or 12:00 SAST?` },
  { id: 'pay', name: 'Pay chase', text: `{{name}} — invoice is live: setup once + first month. Then R{{month}} / month. EFT, proof on this chat. Work starts when it clears.` },
]

const BOOK_PITCH = [
  { t: 'Your name on the door', d: 'White-label. The booking page is the salon, the barber, the studio, the DJ school — not Elite Way in the client’s face.' },
  { t: 'Pick a slot, not a DM', d: 'Client chooses time. You stop answering “are you free Saturday?” while you cut hair or shoot.' },
  { t: 'Diary in one place', d: 'No double book. No paper book that only one person can read.' },
  { t: 'Reminder leaves alone', d: 'The appointment reminds itself. No-shows drop. Setup once. Retainer every month.' },
]

const WHO_BOOK = [
  { who: 'Salon / hair', door: 'Owner or the person who runs the WhatsApp.', why: 'Chairs sit empty while DMs pile up. Booking page fills the gap between clients.' },
  { who: 'Barber', door: 'Owner-operator. Phone in the apron.', why: 'Walk-ins plus “you coming?” texts. A slot list is the product.' },
  { who: 'Photo / video studio', door: 'Studio manager or photographer who books shoots.', why: 'Slots are the inventory. A white-label page looks like the brand.' },
  { who: 'DJ classes / academy', door: 'Front of house / founder.', why: 'Class times, trial slots, deposits. Same engine, their name on it.' },
]

const FIND_BOOK = [
  { n: '1', t: 'Maps + Instagram bio', d: 'Search salon, barber, studio, DJ class + suburb. If the bio says “DM to book” — they are a prospect.' },
  { n: '2', t: 'Walk the strip', d: 'Hair streets, mall kiosks, studio parks. Ask who takes the bookings WhatsApp.' },
  { n: '3', t: 'Qualify in one line', d: '“How does someone book you — DM, call, or a link?” DM or call = white-label booking OS.' },
  { n: '4', t: 'Ten before noon', d: 'Owners are at the chair after 11. Ping early.' },
]

const WHO = [
  { who: 'Private GP / family practice', door: 'Practice manager or receptionist. Doctor last.', why: 'No-shows and chronic follow-up. They already feel the empty chair.' },
  { who: 'Dentist / oral hygiene', door: 'Front desk books six months ahead.', why: 'Hygiene recalls die on paper. Reminder + after-care PDF is the product.' },
  { who: 'Physio / biokineticist / chiro', door: 'Owner-operator. WhatsApp is their admin.', why: 'Series of visits. Miss one, the plan breaks.' },
  { who: 'Specialist rooms', door: 'PA / rooms manager.', why: 'High no-show cost. Scripts and summaries must leave with the patient.' },
  { who: 'Day clinic / medical plaza', door: 'Facility admin, not the visiting doctor.', why: 'Many lists, one building. One reminder engine.' },
  { who: 'Pharmacy with clinic nurse', door: 'Responsible pharmacist / clinic nurse.', why: 'Repeat scripts and BP/sugar follow-up.' },
  { who: 'Mobile / HTS / occupational health', door: 'Site coordinator.', why: 'The next appointment must fire when the tent comes down.' },
]

const FIND = [
  { n: '1', t: 'Maps, not vibes', d: 'Google Maps: GP, dentist, physio, medical centre + your suburb. The pin phone is WhatsApp most of the time.' },
  { n: '2', t: 'Walk the plaza', d: 'Consulting blocks and shopping-centre clinics. Ask for the person who does bookings.' },
  { n: '3', t: 'Ask who owns bookings', d: 'Never open with the doctor. That bookings human is your buyer.' },
  { n: '4', t: 'Qualify in one question', d: '“When someone misses, how do they hear — paper, phone SMS, or nothing?” Paper or nothing = prospect.' },
  { n: '5', t: 'Ten a morning', d: 'Before 10:00, ten first pings. Reception is at the desk.' },
  { n: '6', t: 'Refer across the passage', d: 'Won a dentist? Ask who the GP is downstairs. Log the name the same day.' },
]

const CONVOS = [
  {
    id: 'open-yes',
    title: 'Cold ping → tiny yes',
    why: 'Name the empty chair. Binary close. Do not dump four features until they say yes.',
    lines: [
      ['you', 'Hi Thandi — Lebo at Elite Way. Quick one for the rooms. When a patient misses, how do they hear about the next visit — paper card, SMS from a phone, or nothing?'],
      ['them', 'Mostly the girls SMS from the front phone. Some still get a card.'],
      ['you', 'So if the front is in the till, the reminder does not leave. That chair stays empty.'],
      ['them', 'Yes that’s us on a Monday.'],
      ['you', 'We put Elite Way Health Tech System — EWHTS — under the practice. Next appointment fires on its own. After consult they get a short summary + a link to the script PDF. 12 minutes — today 08:00 or 12:00?'],
      ['them', '12:00.'],
      ['note', 'Move card → Call/Demo. Do not pitch price until the walkthrough unless they ask.'],
    ],
  },
  {
    id: 'features',
    title: 'They ask “what does it do?”',
    why: 'Four boxes. Then future-pace Tuesday. Then A or B.',
    lines: [
      ['them', 'Just tell me what it does.'],
      ['you', 'Four things. 1) Next appointment reminder, automatic. 2) After the consult, a summary they can read in the taxi. 3) A link to their prescription PDF — not a photo in the family group. 4) You can send your own patients practice news — flu, new hours — without building a new WhatsApp group.'],
      ['them', 'And the doctor has to type all that?'],
      ['you', 'No. Bookings already exist. The reminder uses that. Summary and PDF leave when the consult is closed. The doctor does not become admin.'],
      ['you', '12 minutes on the screen — 08:00 or 12:00?'],
    ],
  },
  {
    id: 'price',
    title: '“Too expensive”',
    why: 'Reframe empty chairs vs R4 500 setup + R1 500/month.',
    lines: [
      ['them', 'R4 500 plus a monthly is a lot for a clinic this size.'],
      ['you', 'I hear the number. Setup is R4 500. Then R1 500 a month — less than one no-show week. The expensive thing is the empty chair, not EWHTS.'],
      ['them', 'I still need to think.'],
      ['you', 'Of course. Is it the price, the timing, or who has to sign? If I know which one, I wait 48 hours on the right thing — then I close the slot.'],
      ['them', 'I have to ask Dr M.'],
      ['you', 'Smart. Can Dr M sit on the 12-minute demo, or I send you the quote on WhatsApp and we walk it together 08:00 tomorrow?'],
    ],
  },
  {
    id: 'popia',
    title: '“POPIA / patient data”',
    why: 'Their list. Their rooms. No scrape.',
    lines: [
      ['them', 'We cannot give you patient numbers. POPIA.'],
      ['you', 'Correct. You keep the list. We message people who already belong to the practice. We do not buy or scrape patients. Same relationship you already have — just on time.'],
      ['them', 'So it sits on our side?'],
      ['you', 'Yes. You own the keys. We install and train. 12 minutes and you will see where the numbers live. 08:00 or 12:00?'],
    ],
  },
  {
    id: 'sms',
    title: '“We already SMS”',
    why: 'Agree. Then raise the loop they do not have.',
    lines: [
      ['them', 'We already SMS patients.'],
      ['you', 'Good. SMS from a phone dies when the receptionist is in the till. This fires the next visit, the summary, and the script PDF without anyone remembering.'],
      ['them', 'The girls do remember most days.'],
      ['you', 'Most days is the leak. Mondays after a long weekend — that is when chairs go empty. Want to see one reminder leave while nobody is at the desk? 12 minutes.'],
    ],
  },
  {
    id: 'ghost',
    title: 'They went quiet',
    why: 'One nudge. Binary. Then Lost → Ghost. No novel.',
    lines: [
      ['you', 'Thandi — last ping. Two doors: EWHTS this week, or I free the slot for the next rooms. YES or NOT NOW. Either is respect.'],
      ['them', 'Not now. Month end.'],
      ['you', 'Noted. I will not hunt. If the empty chairs get loud, WhatsApp me. I am closing the card today.'],
      ['note', 'Lost → Timing. Next name on Today. Do not write again this week.'],
    ],
  },
  {
    id: 'close',
    title: 'Demo → quote on WhatsApp',
    why: 'Assume the close. Paper on the same chat. No email unless they ask.',
    lines: [
      ['you', 'That was the four boxes. You nodded on the reminder and the PDF link. I send the quote on this chat — 14 days, not an invoice yet — or we skip to invoice if you already decided. Which one?'],
      ['them', 'Send the quote. I will show Dr M.'],
      ['you', 'Quote PDF coming now. When Dr M has a yes, I convert to invoice and you EFT. Work starts when it clears. Proof of payment on this chat.'],
      ['note', 'Download quote → send on WhatsApp. Card → Demo/Invoice.'],
    ],
  },
  {
    id: 'book-open',
    title: 'Booking · cold ping (salon / barber)',
    why: 'Find bookings. Bio says DM to book. Qualify, then binary.',
    lines: [
      ['you', 'Hi Sipho — Lebo at Elite Way. Saw the shop. People still DM you to book, or is there a link?'],
      ['them', 'They WhatsApp. Sometimes they pitch up.'],
      ['you', 'So Saturday you are cutting and still answering “are you free at 2?” That chair sits while you type.'],
      ['them', 'That’s every weekend.'],
      ['you', 'We put a booking page under your name — white label, not ours. Client picks a slot. You see the diary. Reminder leaves on its own. Setup R3 800 once. Then R1 200 a month. 12 minutes — 08:00 or 12:00?'],
      ['them', '12:00.'],
      ['note', 'Offer = White-label booking OS. Card → Call/Demo. Do not discount the retainer.'],
    ],
  },
  {
    id: 'book-studio',
    title: 'Booking · photo studio / DJ class',
    why: 'Slots are inventory. White-label is the close.',
    lines: [
      ['you', 'Hi Naledi — how does someone book a shoot / a class? DM, call, or a link?'],
      ['them', 'Instagram DM. Then I send times.'],
      ['you', 'Your calendar is the product. A page with your brand, they pick the slot, deposit if you want. We stay in the back. Setup R3 800. R1 200 / month after that.'],
      ['them', 'Will it look like Elite Way?'],
      ['you', 'No. White label. Their phone shows your studio, your DJ school. 12 minutes and I show it — 08:00 or 12:00?'],
    ],
  },
  {
    id: 'book-price',
    title: 'Booking · “too much monthly”',
    why: 'Setup once. Retainer is the product. Do not cut R1 200 to win R3 800.',
    lines: [
      ['them', 'R1 200 every month is steep. Can we just pay the setup?'],
      ['you', 'Setup is once — R3 800 — so the page exists. The month is the diary, the reminders, the hosting. One no-show Saturday already pays the retainer.'],
      ['them', 'I need to think.'],
      ['you', 'Is it the setup, the month, or who has to sign? I can send the quote on this chat — setup + first month on the invoice, then R1 200 / month. 08:00 walkthrough tomorrow, or I free the slot?'],
    ],
  },
  {
    id: 'book-close',
    title: 'Booking · demo → quote on WhatsApp',
    why: 'Same paper path as EWHTS. PDF on this chat.',
    lines: [
      ['you', 'You saw your name on the page, the slot list, the reminder. Quote on this chat — R3 800 setup + first month R1 200 — or invoice if you already nodded. Which one?'],
      ['them', 'Send the quote.'],
      ['you', 'PDF coming. When you say yes I convert to invoice. EFT. Proof here. Work starts when it clears. After that it is R1 200 a month.'],
      ['note', 'Download quote → WhatsApp. Commission on the R3 800 setup only.'],
    ],
  },
]

const HEALTH_PITCH = [
  { t: 'Next appointment, automatic', d: 'The reminder leaves without a receptionist remembering. Patient shows or reschedules.' },
  { t: 'Summary after consult', d: 'They get a short recap they can read in the taxi. Fewer “what did the doctor say?” calls.' },
  { t: 'Prescription PDF link', d: 'Script as a link, not a photo in a family group.' },
  { t: 'Marketing access', d: 'Flu season, new hours, a health day — one send to people who already trust the rooms.' },
]

const PROCESS = [
  { n: '01', name: 'Notice', job: 'Grab attention. Name the leak in one line. Do not pitch yet.', why: 'People buy the end of pain, not your feature list. Attention first, then meaning.' },
  { n: '02', name: 'Name the wound', job: 'Ask what they still run in chat, paper, or memory. Make them say it.', why: 'Commitment: once they name the problem, they own it. You are not selling. You are diagnosing.' },
  { n: '03', name: 'Tiny yes', job: '12-minute demo or a quote. Never “let me send a brochure.”', why: 'Foot-in-the-door. A small yes predicts a big yes. Binary choice: today 08:00 or 12:00.' },
  { n: '04', name: 'Show, then ask', job: 'Demo the path. One proof from Elite Way. Then: quote or invoice.', why: 'Authority + social proof. Show the platform that still runs at 2am. Then assume the close.' },
  { n: '05', name: 'Paper', job: 'Quote (14 days) then invoice. Send the PDF on WhatsApp. Banking on the page. Work starts when it clears.', why: 'Loss aversion: unpaid invoice = no work. Scarcity: the slot is this week, not “sometime.”' },
  { n: '06', name: 'Collect or cut', job: 'One pay chase. Then mark paid or Lost with a reason. Do not hunt.', why: 'Your book is a garden. Ghosts steal water from live plants.' },
]

const RAILS = [
  { t: 'One job', d: 'The desk highlights one next move. Do that. Then the next. Multitasking is how deals die.' },
  { t: 'They talk first', d: 'Questions before pitch. Situation → problem → implication → need. If you speak first, you are a brochure.' },
  { t: 'Binary close', d: 'Never “are you interested?” Always A or B: 08:00 or 12:00, quote or invoice, this week or I close the slot.' },
  { t: 'Label the emotion', d: '“Sounds like the DMs are eating the till.” Naming the feeling makes them nod. Nodding is a yes in slow motion.' },
  { t: 'Proof, not adjectives', d: 'Elite Way: 2.5M organic views, 100 school halls, Pretoria house. No fake valuations. Numbers that happened.' },
  { t: 'Future pace', d: '“Monday the link goes out after every order. You stop hunting screenshots.” Sell the Tuesday after install.' },
  { t: 'Takeaway', d: 'If they stall, you get smaller, not louder. “Maybe this is not the week. I will free the slot.” People lean toward what might leave.' },
  { t: 'No commission talk', d: 'Never mention 8% or 12% to the client. That is house math. They buy the platform.' },
  { t: 'Two pings then Lost', d: 'Open. Nudge. Then Ghost. Charm is not a third follow-up at midnight.' },
  { t: 'Write it down', d: 'Every WhatsApp, call, quote, invoice stamps the activity log. Memory is a liar. The desk is not.' },
]

const STAGE_COACH = {
  WhatsApp: { wa: 'open', say: 'You are not selling yet. You are interrupting a busy person with a leak they already feel. One screen. Binary reply.', next: 'Send First ping. If they reply, move to Call.' },
  Call: { wa: 'demo', say: 'Permission first (“bad time?”). Then one wound question. Then 08:00 or 12:00 for the demo. Do not dump the menu.', next: 'Log the call. Book demo or send quote.' },
  Demo: { wa: 'demo', say: 'Show the path. One Elite Way proof. Ask: quote today, or invoice if they already nodded.', next: 'Raise a quote. Convert when they accept.' },
  Invoice: { wa: 'pay', say: 'Assume the transfer. Banking is on the PDF. Work starts when it clears. Help them pay — do not apologise for the number.', next: 'WA chase once. Mark paid or Lost.' },
  Won: { wa: 'open', say: 'Thank them. Ask who else in their street needs a door that exists at 2am. Referral is a gift, not a hunt.', next: 'Log the name they give. New WhatsApp card.' },
  Lost: { wa: 'nudge', say: 'Reason, then let go. You can revive in 90 days. Not tonight.', next: 'Pick why. Next live name on Today.' },
}

function coach(lead) {
  return STAGE_COACH[lead?.stage] || STAGE_COACH.WhatsApp
}

const OBJECTIONS = [
  { id: 'price', name: 'Too expensive', trick: 'Reframe cost vs leak', reply: 'I hear the number. Setup is once. The month is the product. One no-show week already pays the retainer. We do not cut the month to win the setup.' },
  { id: 'think', name: 'I need to think', trick: 'Isolate the real objection', reply: 'Of course. Is it the price, the timing, or who has to sign? If I know which one, I can wait 48 hours on the right thing — then I close the slot.' },
  { id: 'diy', name: 'We’ll do it in-house', trick: 'Agree, then raise the stake', reply: 'Good. In-house still needs a door that exists at 2am. We leave the platform and train your people. You keep the keys. We are not a freelancer you babysit.' },
  { id: 'later', name: 'After month-end', trick: 'Separate cash from decision', reply: 'Lock the package and the date today. The invoice can wait until month-end. The week cannot wait if you want the system before the next drop.' },
  { id: 'ghost', name: 'They went quiet', trick: 'Takeaway + last binary', reply: 'One nudge. Then Lost → Ghost. “YES or NOT NOW — either is respect.” Do not write a novel into the silence.' },
  { id: 'boss', name: 'I must ask someone', trick: 'Bring the someone in', reply: 'Smart. Can they sit on the 12-minute demo? If they cannot, send them the quote PDF and I walk you both at 08:00 or 12:00.' },
  { id: 'popia', name: 'POPIA / patient data', trick: 'Their list, their rooms', reply: 'We message people who already belong to the practice. You keep the list. We do not buy or scrape patients. The reminder is the same relationship you already have — just on time.' },
  { id: 'sms', name: 'We already SMS', trick: 'One-way vs a loop', reply: 'SMS from a phone dies when the receptionist is in the till. This fires the next visit, the summary, and the script PDF without anyone remembering. That is the leak, not “we text.”' },
]

const LOST = ['Price', 'Timing', 'No budget', 'Ghost', 'Wrong fit', 'Went in-house', 'Other']


const TEMPLATES = [
  {
    id: 'platform',
    name: 'Sell the platform',
    subject: 'Elite Way — {{offer}} for {{company}}',
    body: `Hello {{name}},

This is {{staff}} at Elite Way.

We set up a platform that still runs when nobody is watching: the page, the form, the order, the reminder.

For {{company}} we would start with {{offer}} — R{{price}}.

If that is useful, reply and we book a short demo.

Send at {{slot}}.
{{staff}}
Elite Way`,
  },
  {
    id: 'orders',
    name: 'Order follow-up form',
    subject: 'Elite Way — after the order, a link for {{company}}',
    body: `Hello {{name}},

{{staff}} here, Elite Way.

Running sales by hand creates mistakes: wrong size, unpaid drop, no list.

After an order we send the client a link. They fill details. Your team gets a sheet and a database.

{{offer}} for {{company}} — R{{price}}.

{{staff}}
Elite Way · {{slot}}`,
  },
  {
    id: 'demo',
    name: 'Confirm the demo',
    subject: 'Elite Way demo — {{company}} / {{offer}}',
    body: `{{name}},

{{staff}} at Elite Way confirming the demo for {{company}} on {{offer}} (R{{price}}).

Bring one fact: who is not paying, or which link does not exist.

{{staff}}
Elite Way · {{slot}}`,
  },
  {
    id: 'invoice',
    name: 'Invoice follow-up',
    subject: 'Elite Way invoice — {{company}}',
    body: `{{name}},

Elite Way invoice for {{offer}} is R{{price}} before VAT.

Please confirm when it is paid so work can start.

{{staff}}
Elite Way · {{slot}}`,
  },
]

const SCRIPTS = [
  {
    id: 'open',
    name: 'First call — open',
    text: `Hi {{name}}, {{staff}} at Elite Way. Is now a bad time — or two minutes?

(If bad: “When is less bad — 08:00 or 12:00?” Hang up kind. You just got a yes.)

We do not sell a post. We put a platform under {{company}}.

What are you still running in chat that should be a system?

(Wait. Let the silence work. Then label: “So the till is in the DMs.”)

Tiny yes: 12 minutes on {{offer}} — today or tomorrow?`,
  },
  {
    id: 'demo',
    name: 'Demo call',
    text: `{{name}}, thanks for jumping on. Clock is 12 minutes.

{{offer}} for {{company}} — R{{price}}.

1. Who is not paying or not coming back?
2. Where does the data live — chat, paper, or nowhere?
3. If a link went out after every order, who opens the sheet?

Proof, one line: Elite Way already ran this muscle — 2.5M organic views, 100 school halls, Pretoria house. Not a slide.

Close (assume): I send the quote now, or we skip to invoice if you already nodded. Which one?`,
  },
  {
    id: 'invoice',
    name: 'Invoice / collect',
    text: `{{name}}, {{offer}} is R{{price}} before VAT. I am sending the PDF with banking and Reg. 2025 / 230114 / 07.

Do not mention commission.

Transfer today, or a date this week that you will keep? I will write that date on the desk.

If they stall: the work does not start until the invoice moves. What would make this easy — proof of payment on WhatsApp?`,
  },
]

function fill(tpl, lead, staff, slot, offers = DEFAULT_OFFERS) {
  const o = offers.find((x) => x.id === lead.offer) || offers[0]
  const map = {
    '{{name}}': lead.name || 'there',
    '{{company}}': lead.company || 'your house',
    '{{offer}}': o.name,
    '{{price}}': o.monthly
      ? (`${Number(o.price).toLocaleString('en-ZA')} setup + R${Number(o.monthly).toLocaleString('en-ZA')}/month`)
      : Number(lead.amount || o.price).toLocaleString('en-ZA'),
    '{{setup}}': Number(o.price || lead.amount || 0).toLocaleString('en-ZA'),
    '{{month}}': o.monthly ? Number(o.monthly).toLocaleString('en-ZA') : '—',
    '{{staff}}': staff || '{{staff}}',
    '{{slot}}': slot || '08:00',
  }
  let s = tpl
  Object.entries(map).forEach(([k, v]) => { s = s.split(k).join(v) })
  return s
}

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

function commissionOf(amount) {
  const n = Number(amount) || 0
  const rate = n < 10000 ? 0.08 : 0.12
  return { rate, pay: Math.round(n * rate) }
}

function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY))
    if (!d) return null
    d.pay = { ...EMPTY_PAY, ...(d.pay || {}) }
    d.quotes = d.quotes || []
    d.activity = d.activity || []
    d.products = d.products || []
    return d
  } catch {
    return null
  }
}

const EMPTY_PAY = {
  bank: '',
  accountName: 'Elite Way Holdings',
  accountNumber: '',
  branch: '',
  type: 'Cheque / current',
  reference: '',
  extra: '',
}

function seed() {
  return {
    staff: 'Closer 1',
    target: 50000,
    pay: { ...EMPTY_PAY },
    leads: [
      { id: uid(), name: 'Practice manager', company: '{{clinic}}', phone: '', email: '', offer: 'health', amount: 4500, stage: 'WhatsApp', note: 'Bookings human — not the doctor' },
    ],
    drafts: [],
    calls: [],
    invoices: [],
    quotes: [],
    activity: [],
    products: [],
  }
}

export default function Sales() {
  const [db, setDb] = useState(() => load() || seed())
  const [tab, setTab] = useState('today')
  const [lostId, setLostId] = useState(null)
  const [waTpl, setWaTpl] = useState('open')
  const [docKind, setDocKind] = useState('invoice')
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', offer: 'health', amount: 4500, note: '' })
  const [inv, setInv] = useState(null)
  const [tpl, setTpl] = useState('platform')
  const [script, setScript] = useState('open')
  const [scriptLead, setScriptLead] = useState(null)
  const [pdfNote, setPdfNote] = useState('')
  const [talkFilter, setTalkFilter] = useState('book')
  const [newProd, setNewProd] = useState({ name: '', price: '', monthly: '', pitch: '' })
  const [q, setQ] = useState('')
  const [now, setNow] = useState(() => new Date())
  const offers = useMemo(() => [...DEFAULT_OFFERS, ...(db.products || [])], [db.products])

  useEffect(() => {
    document.body.classList.add('sales-desk')
    return () => document.body.classList.remove('sales-desk')
  }, [])

  const skipSync = useRef(true)
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(db))
    if (skipSync.current) { skipSync.current = false; return }
    const t = setTimeout(() => {
      fetch('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sales: db }) }).catch(() => {})
    }, 700)
    return () => clearTimeout(t)
  }, [db])

  useEffect(() => {
    fetch('/api/pay').then((r) => r.json()).then((pay) => {
      if (pay && typeof pay === 'object') patch({ pay: { ...EMPTY_PAY, ...pay } })
    }).catch(() => {})
    fetch('/api/sync').then((r) => r.json()).then((d) => {
      if (d?.sales?.leads) setDb((cur) => ({ ...cur, ...d.sales, pay: cur.pay }))
    }).catch(() => {})
  }, [])

  const openDeals = db.leads.filter((l) => !['Won', 'Lost'].includes(l.stage))
  const won = db.leads.filter((l) => l.stage === 'Won')
  const wonSum = won.reduce((s, l) => s + Number(l.amount || 0), 0)
  const comm = won.reduce((s, l) => s + commissionOf(l.amount).pay, 0)
  const pct = Math.min(100, Math.round((wonSum / (db.target || 1)) * 100))

  function patch(p) {
    setDb((d) => ({ ...d, ...p }))
  }
  function setLead(id, p) {
    patch({ leads: db.leads.map((l) => (l.id === id ? { ...l, ...p } : l)) })
  }
  function addLead(e) {
    e.preventDefault()
    const o = offers.find((x) => x.id === form.offer)
    patch({
      leads: [{ id: uid(), ...form, amount: Number(form.amount) || o.price, stage: 'WhatsApp' }, ...db.leads],
    })
    setForm({ name: '', company: '', phone: '', email: '', offer: 'health', amount: 4500, note: '' })
  }
  function stamp(text, lead) {
    patch({ activity: [{ id: uid(), at: new Date().toISOString(), text, lead: lead?.name }, ...(db.activity || [])].slice(0, 80) })
  }
  function onDrop(stage, e) {
    e.preventDefault()
    const id = e.dataTransfer.getData('id')
    if (!id) return
    if (stage === 'Lost') { setLostId(id); return }
    setLead(id, { stage })
    const lead = db.leads.find((l) => l.id === id)
    stamp((lead?.name || id) + ' → ' + stage, lead)
  }
  function waDigits(phone) {
    const d = String(phone || '').replace(/\D/g, '')
    if (!d) return ''
    if (d.startsWith('27')) return d
    if (d.startsWith('0')) return '27' + d.slice(1)
    return d
  }
  function waHref(lead, tplId) {
    const pack = lead?.offer === 'health' ? WA_HEALTH : lead?.offer === 'book' ? WA_BOOK : WA_MSGS
    const t = pack.find((x) => x.id === (tplId || waTpl)) || pack[0]
    const msg = fill(t.text, lead, db.staff, '08:00', offers)
    const n = waDigits(lead.phone)
    return n ? ('https://wa.me/' + n + '?text=' + encodeURIComponent(msg)) : ''
  }
  function openWa(lead, tplId) {
    const href = waHref(lead, tplId)
    stamp('WhatsApp → ' + lead.name, lead)
    setLead(lead.id, { lastTouch: new Date().toISOString() })
    if (href) window.open(href, '_blank', 'noopener')
    else setPdfNote('Add a phone number on the card first.')
  }
  function makeQuote(lead) {
    const doc = { ...buildInvoice(lead), kind: 'quote', id: 'Q-' + Date.now().toString(36).toUpperCase() }
    patch({ quotes: [doc, ...(db.quotes || [])] })
    setInv(doc)
    setDocKind('quote')
    setTab('invoices')
    stamp('Quote ' + doc.id + ' · ' + lead.name, lead)
  }
  function convertQuote(q) {
    const invoice = { ...q, kind: 'invoice', id: 'EW-' + Date.now().toString(36).toUpperCase(), date: new Date().toLocaleDateString('en-ZA') }
    const lead = db.leads.find((l) => l.name === q.lead?.name)
    patch({ invoices: [invoice, ...db.invoices] })
    if (lead) setLead(lead.id, { stage: 'Invoice' })
    setInv(invoice)
    setDocKind('invoice')
    stamp('Quote ' + q.id + ' → invoice ' + invoice.id, q.lead)
  }

  function queueDraft(lead, slot, templateId = tpl) {
    const t = TEMPLATES.find((x) => x.id === templateId) || TEMPLATES[0]
    const body = `Subject: ${fill(t.subject, lead, db.staff, slot, offers)}\n\n${fill(t.body, lead, db.staff, slot, offers)}`
    patch({
      drafts: [{ id: uid(), leadId: lead.id, to: lead.email, slot, template: t.name, body, created: new Date().toISOString() }, ...db.drafts],
    })
    setPdfNote('Email draft saved. Only send if they asked for email — default is WhatsApp.')
  }

  function logCall(lead) {
    patch({
      calls: [{ id: uid(), leadId: lead.id, name: lead.name, phone: lead.phone, at: new Date().toISOString(), outcome: 'Logged' }, ...db.calls],
    })
    setScriptLead(lead)
    setTab('calls')
    if (lead.phone) window.open(`tel:${lead.phone}`)
  }

  function makeInvoice(lead) {
    const invoice = buildInvoice(lead)
    patch({ invoices: [invoice, ...db.invoices] })
    setLead(lead.id, { stage: 'Invoice' })
    setInv(invoice)
    setTab('invoices')
    setPdfNote('')
    stamp('Invoice ' + invoice.id + ' · ' + lead.name, lead)
  }

  const preview = useMemo(() => {
    if (inv) return inv
    return { ...buildInvoice(form), id: 'PREVIEW' }
  }, [inv, form])

  const copy = (t) => navigator.clipboard?.writeText(t)


  function buildInvoice(lead) {
    const o = offers.find((x) => x.id === lead.offer) || offers[0]
    const setup = Number(lead.amount) || o.price || 0
    const items = o.monthly
      ? [
          { name: `${o.name} — setup`, amount: setup },
          { name: `${o.name} — first month`, amount: Number(o.monthly) },
        ]
      : [{ name: o.name || 'Service', amount: setup }]
    const amount = items.reduce((s, i) => s + Number(i.amount || 0), 0)
    const c = commissionOf(setup)
    return {
      id: 'EW-' + Date.now().toString(36).toUpperCase(),
      lead: {
        name: lead.name || '{{name}}',
        company: lead.company || '{{company}}',
        email: lead.email || '',
        phone: lead.phone || '',
      },
      offer: o,
      items,
      monthly: o.monthly || 0,
      amount,
      setup,
      vat: Math.round(amount * 0.15),
      total: Math.round(amount * 1.15),
      commission: c,
      date: new Date().toLocaleDateString('en-ZA'),
    }
  }

  function pdfEscape(s) {
    return String(s || '')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/\r/g, ' ')
      .replace(/\n/g, ' ')
  }

  function htmlEscape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  function invoiceHtml(invoice) {
    const pay = db.pay || {}
    const quote = invoice.kind === 'quote'
    const rows = Array.isArray(invoice.items) && invoice.items.length
      ? invoice.items
      : [{ name: invoice.offer?.name || 'Service', amount: Number(invoice.amount || 0) }]
    const rowHtml = rows.map((row) => `<tr><td>${htmlEscape(row.name || 'Service')}</td><td class="money">R${Number(row.amount || 0).toLocaleString('en-ZA')}</td></tr>`).join('')
    const paymentHtml = quote ? '<p class="muted">This is a quote, not a tax invoice. Figures hold for 14 days. No amount is due until you accept and we send an invoice.</p>' : `
      <h2>Where to pay</h2>
      <div class="payment">
        <p><span>Bank</span> ${htmlEscape(pay.bank || 'Set on House')}</p>
        <p><span>Account name</span> ${htmlEscape(pay.accountName || '—')}</p>
        <p><span>Account number</span> ${htmlEscape(pay.accountNumber || '—')}</p>
        <p><span>Branch</span> ${htmlEscape(pay.branch || '—')}</p>
        <p><span>Type</span> ${htmlEscape(pay.type || '—')}</p>
        <p><span>Reference</span> ${htmlEscape(pay.reference || invoice.id || '—')}</p>
        ${pay.extra ? `<p class="muted">${htmlEscape(pay.extra)}</p>` : ''}
      </div>`
    return `<!doctype html><html><head><meta charset="utf-8"><title>${quote ? 'Quote' : 'Invoice'} ${htmlEscape(invoice.id)}</title>
      <style>
        @page { size: A4; margin: 0; } * { box-sizing: border-box; } body { margin: 0; background: #e8e8ed; color: #111; font: 14px Arial, sans-serif; }
        .page { width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; } .header { display: flex; justify-content: space-between; gap: 24px; padding: 28px 34px; background: #07060c; color: #fff; }
        .brand { display: flex; align-items: center; gap: 14px; } .brand-mark { width: 56px; height: 56px; object-fit: contain; } .brand-name { font-size: 19px; font-weight: 800; letter-spacing: .06em; } .small { color: #b9b7c2; font-size: 11px; margin-top: 5px; }
        .document { text-align: right; } .document-type { color: #d4af37; font-size: 11px; letter-spacing: .24em; } .document-id { font-weight: 700; margin-top: 8px; } .content { padding: 34px; } .eyebrow, h2 { color: #666; font-size: 10px; letter-spacing: .16em; text-transform: uppercase; } h2 { margin: 28px 0 10px; }
        .bill-name { font-size: 18px; font-weight: 700; margin-top: 5px; } .muted { color: #666; line-height: 1.5; } table { width: 100%; border-collapse: collapse; margin: 30px 0 24px; } th, td { padding: 11px 10px; border-bottom: 1px solid #ddd; text-align: left; } th { background: #f4f4f6; } .money { text-align: right; white-space: nowrap; } .total td { border-bottom: 0; font-size: 17px; font-weight: 800; padding-top: 16px; }
        .payment { border: 1px solid #ddd; padding: 15px; } .payment p { margin: 5px 0; } .payment span { color: #777; display: inline-block; min-width: 125px; } .footer { padding: 0 34px 30px; color: #777; font-size: 10px; } @media print { body { background: #fff; } .page { width: 100%; } }
      </style></head><body><main class="page"><header class="header"><div class="brand"><img class="brand-mark" src="${htmlEscape(new URL('/logo-mark.png', window.location.origin).href)}" alt="Elite Way logo"><div><div class="brand-name">ELITE WAY HOLDINGS</div><div class="small">Reg. 2025 / 230114 / 07</div><div class="small">Pretoria, South Africa · info@eliteway.co.za · 076 342 5896</div></div></div><div class="document"><div class="document-type">${quote ? 'QUOTE' : 'INVOICE'}</div><div class="document-id">${htmlEscape(invoice.id)}</div><div class="small">${htmlEscape(invoice.date)}</div></div></header><section class="content"><div class="eyebrow">Bill to</div><div class="bill-name">${htmlEscape(invoice.lead?.name || '')}</div><div>${htmlEscape(invoice.lead?.company || '')}</div>${invoice.lead?.email ? `<div class="muted">${htmlEscape(invoice.lead.email)}</div>` : ''}<table><thead><tr><th>Description</th><th class="money">ZAR</th></tr></thead><tbody>${rowHtml}<tr><td>VAT 15%</td><td class="money">R${Number(invoice.vat || 0).toLocaleString('en-ZA')}</td></tr><tr class="total"><td>Total due</td><td class="money">R${Number(invoice.total || 0).toLocaleString('en-ZA')}</td></tr></tbody></table>${paymentHtml}${invoice.monthly ? `<p class="muted">Then R${Number(invoice.monthly).toLocaleString('en-ZA')} per month after the first month on this invoice.</p>` : ''}<p class="muted">Work starts when the invoice is paid.</p></section><footer class="footer">Elite Way Holdings · Reg. 2025 / 230114 / 07 · All rights reserved.</footer></main></body></html>`
  }

  function printInvoice(invoice) {
    if (!invoice) return setPdfNote('Nothing to print.')
    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1100')
    if (!printWindow) return setPdfNote('Allow pop-ups to print the invoice.')
    printWindow.document.open()
    printWindow.document.write(invoiceHtml(invoice))
    printWindow.document.close()
    printWindow.focus()
    printWindow.onload = () => printWindow.print()
  }

  function invoiceToPdfBlob(invoice) {
    const pay = db.pay || {}
    const rows = Array.isArray(invoice.items) && invoice.items.length
      ? invoice.items
      : [{ name: invoice.offer?.name || 'Service', amount: Number(invoice.amount || 0) }]

    const lines = [
      ['F', 18, 50, 760, 'ELITE WAY HOLDINGS'],
      ['N', 9, 50, 744, 'Reg. 2025 / 230114 / 07'],
      ['N', 9, 50, 732, 'Pretoria, South Africa | info@eliteway.co.za | 076 342 5896'],
      ['F', 18, 430, 780, (invoice.kind === 'quote') ? 'QUOTE' : 'INVOICE'],
      ['N', 10, 430, 760, String(invoice.id || '')],
      ['N', 9, 430, 744, String(invoice.date || '')],
      ['N', 10, 50, 690, 'Bill to'],
      ['F', 14, 50, 674, invoice.lead?.name || ''],
      ['N', 10, 50, 658, invoice.lead?.company || ''],
      ['N', 9, 50, 642, invoice.lead?.email || ''],
      ['F', 11, 50, 610, 'Description'],
      ['F', 11, 470, 610, 'ZAR'],
      ...rows.map((row, idx) => {
        const y = 588 - idx * 22
        return ['N', 10, 50, y, `${row.name || 'Service'}  |  ${Number(row.amount || 0).toLocaleString('en-ZA')}`]
      }),
      ['N', 10, 50, 520, 'VAT 15%'],
      ['N', 10, 470, 520, Number(invoice.vat || 0).toLocaleString('en-ZA')],
      ['F', 14, 50, 495, 'Total due'],
      ['F', 14, 430, 495, 'R' + Number(invoice.total || 0).toLocaleString('en-ZA')],
      ['F', 11, 50, 450, 'Where to pay'],
      ['N', 10, 50, 432, 'Bank: ' + (pay.bank || '—')],
      ['N', 10, 50, 416, 'Account name: ' + (pay.accountName || '—')],
      ['N', 10, 50, 400, 'Account number: ' + (pay.accountNumber || '—')],
      ['N', 10, 50, 384, 'Branch: ' + (pay.branch || '—') + '  |  Type: ' + (pay.type || '—')],
      ['N', 10, 50, 368, 'Reference: ' + (pay.reference || invoice.id || '—')],
      ['N', 9, 50, 352, pay.extra || 'Work starts when this invoice is paid.'],
      ['N', 9, 50, 330, 'Copyright Elite Way Holdings. All rights reserved.'],
      ['F', 9, 50, 76, 'AUTHENTIC STAMP · ELITE WAY HOLDINGS · Reg. 2025 / 230114 / 07 · Pretoria'],
      ['N', 8, 50, 58, 'Official document. Not valid without this house stamp.'],
    ]

    const contentCommands = [
      'q',
      '0.027 0.024 0.047 rg',
      '0 742 612 50 re f',
      'Q',
      'BT /F2 18 Tf 0.85 0.72 0.22 rg 430 68 Td (ELITE WAY) Tj ET',
      'BT /F1 7 Tf 0.85 0.72 0.22 rg 430 54 Td (AUTHENTIC STAMP) Tj ET',
      '1 1 1 rg',
    ]

    for (const [face, size, x, y, text] of lines) {
      const font = face === 'F' ? 'F2' : 'F1'
      contentCommands.push('BT')
      contentCommands.push(`/${font} ${size} Tf`)
      contentCommands.push('0.08 0.08 0.12 rg')
      contentCommands.push(`${x} ${y} Td`)
      contentCommands.push(`(${pdfEscape(text)}) Tj`)
      contentCommands.push('ET')
    }

    const stream = contentCommands.join('\n')
    const objects = []
    const add = (value) => { objects.push(value); return objects.length }

    add('<< /Type /Catalog /Pages 2 0 R >>')
    add('<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
    add('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>')
    add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)
    add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
    add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>')

    let pdf = '%PDF-1.4\n'
    const offsets = [0]
    for (let i = 0; i < objects.length; i++) {
      offsets.push(pdf.length)
      pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`
    }

    const xrefStart = pdf.length
    pdf += `xref\n0 ${objects.length + 1}\n`
    pdf += '0000000000 65535 f \n'
    for (let i = 1; i < offsets.length; i++) {
      pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n'
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`

    return new Blob([pdf], { type: 'application/pdf' })
  }

  function downloadPdf(invoice) {
    if (!invoice) {
      setPdfNote('Nothing to download.')
      return
    }
    try {
      const blob = invoiceToPdfBlob(invoice)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoice.id || 'elite-way-invoice'}.pdf`
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 20000)
      setPdfNote(`Invoice ${invoice.id} downloaded. Send the PDF on WhatsApp unless they asked for email.`)
    } catch (err) {
      setPdfNote('PDF failed: ' + (err?.message || String(err)))
    }
  }


  const needle = q.trim().toLowerCase()
  function hit(l) {
    if (!needle) return true
    return [l.name, l.company, l.phone, l.email, l.offer, l.note].join(' ').toLowerCase().includes(needle)
  }
  const sast = now.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="desk-shell pt-8 max-w-[1400px] mx-auto px-4 pb-24 min-h-screen">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <img src="/logo-mark.png" alt="" className="elite-mark" />
            <div>
              <p className="desk-kicker">Elite Way · closer OS</p>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight">Command desk</h1>
            </div>
          </div>
          <span className="desk-open"><i /> Open · no password · {sast} SAST</span>
          <p className="text-white/55 text-sm mt-2 max-w-xl">WhatsApp first. EWHTS and white-label booking. Coach uses the House key. Quotes stamp authentic. Book syncs to House.</p>
        </div>
        <div className="glass p-3 flex flex-wrap gap-2 items-center">
          <input className="w-36" value={db.staff} onChange={(e) => patch({ staff: e.target.value })} placeholder="Closer name" />
          <button type="button" className="btn-ghost text-sm" onClick={() => {
            const blob = new Blob([JSON.stringify({
              _stamp: { brand: 'Elite Way Holdings', reg: '2025 / 230114 / 07', mark: 'AUTHENTIC · ELITE WAY HOLDINGS', kind: 'sales-book', at: new Date().toISOString(), desk: 'closer' },
              ...db,
            }, null, 2)], { type: 'application/json' })
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = 'eliteway-sales.json'
            a.click()
          }}>Export JSON</button>
          <label className="text-[10px] uppercase tracking-widest text-white/40">Target
            <input type="number" className="mt-1 w-28" value={db.target} onChange={(e) => patch({ target: Number(e.target.value) })} />
          </label>
          <input className="w-44" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the book…" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          ['Won (setup)', `R${wonSum.toLocaleString('en-ZA')}`, 'House number'],
          ['To target', `${pct}%`, `R${Number(db.target || 0).toLocaleString('en-ZA')}`],
          ['Commission', `R${comm.toLocaleString('en-ZA')}`, 'On setup · one closer'],
          ['Live book', String(openDeals.length), `${(db.products || []).length} extra products`],
        ].map(([k, v, s]) => (
          <div key={k} className="glass p-4">
            <div className="text-[10px] uppercase tracking-widest text-white/40">{k}</div>
            <div className="text-2xl md:text-3xl font-black num mt-1">{v}</div>
            <div className="text-xs text-white/40 mt-1">{s}</div>
          </div>
        ))}
      </div>
      <div className="h-1.5 rounded-full bg-white/10 mb-6 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#d4af37] via-indigo-500 to-teal-400" style={{ width: pct + '%' }} />
      </div>

      <div className="desk-tabs mb-8">
        {[
          ['today', 'Today', openDeals.length],
          ['find', 'Find clinics', null],
          ['bookings', 'Find bookings', null],
          ['talk', 'Conversations', null],
          ['rails', 'How we close', null],
          ['board', 'Pipeline', db.leads.length],
          ['products', 'Products', 2 + (db.products || []).length],
          ['play', 'What to sell', null],
          ['calls', 'Calls', db.calls.length],
          ['coach', 'Coach', null],
          ['invoices', 'Quotes & invoices', (db.invoices?.length || 0) + (db.quotes?.length || 0)],
        ].map(([id, l, n]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={tab === id ? 'desk-tab on' : 'desk-tab'}>
            {l}{n != null ? <span>{n}</span> : null}
          </button>
        ))}
      </div>



      {tab === 'coach' && <Coach lead={openDeals[0] || db.leads[0]} staff={db.staff} />}

      {tab === 'today' && (() => {
        const focus = openDeals.find((l) => l.phone) || openDeals[0]
        const cch = coach(focus)
        const unpaid = (db.invoices || []).filter((i) => i.paid !== true)
        return (
        <div className="space-y-6">
          <div className="glass p-6 border-amber-300/30">
            <p className="text-[10px] tracking-[0.3em] uppercase text-amber-200">Your one job right now</p>
            {!focus && <p className="text-lg font-bold mt-2">Add a real name and phone on Pipeline. The desk cannot push an empty book.</p>}
            {focus && (
              <>
                <p className="text-2xl font-black mt-2">{focus.name} · {focus.stage}</p>
                <p className="text-white/70 mt-2 leading-relaxed">{cch.say}</p>
                <p className="text-sm text-blue-300 mt-3">{cch.next}</p>
                <p className="text-xs text-white/40 mt-2">If you do anything else first, you are hiding.</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {focus.phone && <button type="button" className="btn-primary text-sm" onClick={() => { setWaTpl(cch.wa); openWa(focus, cch.wa) }}>Do it on WhatsApp</button>}
                  {focus.phone && <button type="button" className="btn-ghost text-sm" onClick={() => logCall(focus)}>Call with the script</button>}
                  <button type="button" className="btn-ghost text-sm" onClick={() => makeQuote(focus)}>Send a quote</button>
                </div>
              </>
            )}
          </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <p className="text-sm text-white/55">Then the rest of the book — still WhatsApp first. The message already uses a binary close.</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {WA_MSGS.map((w) => (
                <button key={w.id} type="button" className={waTpl === w.id ? 'btn-primary text-sm' : 'btn-ghost text-sm'} onClick={() => setWaTpl(w.id)}>{w.name}</button>
              ))}
            </div>
            {openDeals.filter((l) => l.phone).length === 0 && <p className="text-white/40 text-sm glass p-4">Add a lead with a phone on Pipeline. Today lives off that book.</p>}
            {openDeals.filter((l) => l.phone && hit(l)).map((l) => {
              const c = commissionOf(l.amount)
              const g = coach(l)
              return (
                <div key={l.id} className="glass p-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-bold">{l.name} <span className="text-white/40 font-normal text-xs">{l.stage}</span></div>
                    <div className="text-xs text-amber-200/80 mt-1">{g.next}</div>
                    <div className="text-xs text-white/45">{l.company} · {(offers.find((o) => o.id === l.offer) || offers[0]).name} · R{Number(l.amount).toLocaleString('en-ZA')} · you {Math.round(c.rate * 100)}%</div>
                    <pre className="text-xs text-white/70 mt-2 whitespace-pre-wrap font-sans">{fill(((l.offer === 'health' ? WA_HEALTH : l.offer === 'book' ? WA_BOOK : WA_MSGS).find((w) => w.id === waTpl) || (l.offer === 'health' ? WA_HEALTH : l.offer === 'book' ? WA_BOOK : WA_MSGS)[0]).text, l, db.staff, '08:00', offers)}</pre>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button type="button" className="btn-primary text-sm" onClick={() => openWa(l)}>Open WhatsApp</button>
                    <button type="button" className="btn-ghost text-sm" onClick={() => copy(fill(((l.offer === 'health' ? WA_HEALTH : l.offer === 'book' ? WA_BOOK : WA_MSGS).find((w) => w.id === waTpl) || (l.offer === 'health' ? WA_HEALTH : l.offer === 'book' ? WA_BOOK : WA_MSGS)[0]).text, l, db.staff, '08:00', offers))}>Copy</button>
                  </div>
                </div>
              )
            })}
            <p className="text-[10px] uppercase tracking-widest text-violet-300 pt-4">Unpaid — collect or cut</p>
            {unpaid.length === 0 && <p className="text-white/35 text-sm">No open invoices. Good. Fill the book.</p>}
            {unpaid.map((i) => (
              <div key={i.id} className="glass p-4 flex justify-between gap-3 text-sm">
                <div>{i.id} · {i.lead?.name} · R{i.total.toLocaleString('en-ZA')}</div>
                <div className="flex gap-2">
                  {i.lead?.phone && <button type="button" className="btn-ghost text-sm" onClick={() => openWa({ ...i.lead, offer: i.offer?.id || 'web', amount: i.amount }, 'pay')}>WA chase</button>}
                  <button type="button" className="btn-primary text-sm" onClick={() => { patch({ invoices: db.invoices.map((x) => x.id === i.id ? { ...x, paid: true } : x) }); stamp('Paid ' + i.id, i.lead) }}>Mark paid</button>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-white/40">Why this works</p>
            {RAILS.slice(0, 4).map((r) => (
              <div key={r.t} className="glass p-3">
                <div className="text-sm font-bold">{r.t}</div>
                <p className="text-xs text-white/55 mt-1 leading-relaxed">{r.d}</p>
              </div>
            ))}
            <p className="text-[10px] uppercase tracking-widest text-white/40 pt-2">Activity</p>
            {(db.activity || []).slice(0, 10).map((a) => (
              <div key={a.id} className="text-xs text-white/50 glass p-3">{new Date(a.at).toLocaleString('en-ZA')} · {a.text}</div>
            ))}
          </div>
        </div>
        </div>
        )
      })()}

      {tab === 'rails' && (
        <div className="space-y-10">
          <div>
            <p className="text-sm text-white/55 mb-4">Read this once. Then stop inventing. The desk is the closer; you are the voice.</p>
            <div className="grid md:grid-cols-3 gap-4">
              {PROCESS.map((s) => (
                <div key={s.n} className="glass p-5">
                  <div className="text-blue-300 font-black text-sm">{s.n}</div>
                  <h3 className="font-black text-xl mt-1">{s.name}</h3>
                  <p className="text-sm text-white/80 mt-3 leading-relaxed">{s.job}</p>
                  <p className="text-xs text-violet-200/80 mt-3 leading-relaxed">{s.why}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black mb-2">Rules of the surface</h2>
            <p className="text-white/50 text-sm mb-4">Psychology already loaded. You do not need to be clever. You need to be consistent.</p>
            <div className="grid md:grid-cols-2 gap-3">
              {RAILS.map((r) => (
                <div key={r.t} className="glass p-5">
                  <div className="font-bold">{r.t}</div>
                  <p className="text-sm text-white/65 mt-2 leading-relaxed">{r.d}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="glass p-6">
            <h3 className="font-black mb-2">What you never do</h3>
            <ul className="text-sm text-white/65 space-y-2 leading-relaxed">
              <li>Do not mention commission, targets, or “I need this close.” That is your hunger. They can smell it.</li>
              <li>Do not stack five packages. One wound → one offer from What to sell.</li>
              <li>Do not write paragraphs on WhatsApp. Binary. YES / LATER. 08:00 / 12:00.</li>
              <li>Do not chase a ghost past two pings. Lost is a clean room.</li>
              <li>Do not freestyle the open. The script is the open. Charm is for after they answer.</li>
            </ul>
          </div>
        </div>
      )}

      {tab === 'find' && (
        <div className="space-y-10">
          <div className="glass p-6">
            <p className="text-[10px] tracking-[0.3em] uppercase text-teal-300">The product you sell first</p>
            <h2 className="text-3xl font-black mt-2">Elite Way Health Tech System · EWHTS · R4 500 setup + R1 500 / month</h2>
            <p className="text-white/70 mt-3 max-w-3xl leading-relaxed">Medical facilities. Not a hospital rebuild. EWHTS does four things: automated reminder for the next appointment, a summary after the consult, a link to the prescription PDF, and access to message their own patients (hours, campaigns, health days). You sell the empty chair filled — not “software.”</p>
            <div className="grid md:grid-cols-4 gap-3 mt-6">
              {HEALTH_PITCH.map((x) => (
                <div key={x.t} className="rounded-2xl border border-white/10 p-4 bg-white/[0.03]">
                  <div className="font-bold text-sm">{x.t}</div>
                  <p className="text-xs text-white/55 mt-2 leading-relaxed">{x.d}</p>
                </div>
              ))}
            </div>
            <button type="button" className="btn-primary text-sm mt-6" onClick={() => { setForm({ ...form, offer: 'health', amount: 4500 }); setTab('board') }}>Add a clinic to the pipeline</button>
          </div>
          <div>
            <h3 className="text-2xl font-black mb-2">Who you sell to</h3>
            <p className="text-white/50 text-sm mb-4">The door is the person who owns the bookings list. WhatsApp that person. Doctor signs later.</p>
            <div className="grid md:grid-cols-2 gap-3">
              {WHO.map((w) => (
                <div key={w.who} className="glass p-5">
                  <div className="font-bold">{w.who}</div>
                  <p className="text-sm text-teal-200 mt-2">Door: {w.door}</p>
                  <p className="text-sm text-white/60 mt-2 leading-relaxed">{w.why}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black mb-2">How you find them this week</h3>
            <div className="grid md:grid-cols-3 gap-3">
              {FIND.map((f) => (
                <div key={f.n} className="glass p-5">
                  <div className="text-blue-300 font-black text-sm">{f.n}</div>
                  <div className="font-bold mt-1">{f.t}</div>
                  <p className="text-sm text-white/65 mt-2 leading-relaxed">{f.d}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="glass p-6">
            <h3 className="font-black mb-2">How you sell it on WhatsApp</h3>
            <ol className="text-sm text-white/70 space-y-2 list-decimal pl-5 leading-relaxed">
              <li>Qualify: paper card / phone SMS / nothing = prospect.</li>
              <li>Name the wound: empty chair, “what did the doctor say?”, lost script photo.</li>
              <li>Show four boxes. Say EWHTS. Do not dump jargon.</li>
              <li>Binary: 08:00 or 12:00 demo. Quote PDF on WhatsApp after they nod.</li>
              <li>POPIA: we message people who already belong to the practice. They keep the list. We do not scrape patients.</li>
            </ol>
            <button type="button" className="btn-primary text-sm mt-5" onClick={() => setTab('talk')}>See how a chat should go</button>
          </div>
        </div>
      )}

      {tab === 'bookings' && (
        <div className="space-y-10">
          <div className="glass p-6">
            <p className="text-[10px] tracking-[0.3em] uppercase text-teal-300">The other retainer</p>
            <h2 className="text-3xl font-black mt-2">White-label booking OS · R3 800 setup + R1 200 / month</h2>
            <p className="text-white/70 mt-3 max-w-3xl leading-relaxed">Salons, barbers, photo studios, DJ classes. The page wears their brand. Setup is once. The month is the retainer. You sell “DM to book” dying — not a logo of ours on their client’s phone.</p>
            <div className="grid md:grid-cols-4 gap-3 mt-6">
              {BOOK_PITCH.map((x) => (
                <div key={x.t} className="rounded-2xl border border-white/10 p-4 bg-white/[0.03]">
                  <div className="font-bold text-sm">{x.t}</div>
                  <p className="text-xs text-white/55 mt-2 leading-relaxed">{x.d}</p>
                </div>
              ))}
            </div>
            <button type="button" className="btn-primary text-sm mt-6" onClick={() => { setForm({ ...form, offer: 'book', amount: 3800 }); setTab('board') }}>Add a booking client to the pipeline</button>
          </div>
          <div>
            <h3 className="text-2xl font-black mb-2">Who you sell to</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {WHO_BOOK.map((w) => (
                <div key={w.who} className="glass p-5">
                  <div className="font-bold">{w.who}</div>
                  <p className="text-sm text-teal-200 mt-2">Door: {w.door}</p>
                  <p className="text-sm text-white/60 mt-2 leading-relaxed">{w.why}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black mb-2">How you find them</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {FIND_BOOK.map((f) => (
                <div key={f.n} className="glass p-5">
                  <div className="text-blue-300 font-black text-sm">{f.n}</div>
                  <div className="font-bold mt-1">{f.t}</div>
                  <p className="text-sm text-white/65 mt-2 leading-relaxed">{f.d}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="glass p-6">
            <h3 className="font-black mb-2">How money works on this desk</h3>
            <p className="text-sm text-white/70 leading-relaxed">Every living product is <strong className="text-white">setup once + monthly retainer</strong>. Quote and first invoice = setup + first month. After that they pay the month. Commission is on the setup. Do not discount the retainer to win the setup.</p>
          </div>
        </div>
      )}

      {tab === 'talk' && (
        <div className="space-y-8">
          <p className="text-sm text-white/55 max-w-2xl">These are real WhatsApp threads. Green is you. Grey is them. Read one out loud before you ping.</p>
          <div className="flex flex-wrap gap-2">
            {[['book', 'Find bookings'], ['health', 'EWHTS / clinics'], ['all', 'All']].map(([id, l]) => (
              <button key={id} type="button" className={talkFilter === id ? 'btn-primary text-sm' : 'btn-ghost text-sm'} onClick={() => setTalkFilter(id)}>{l}</button>
            ))}
          </div>
          {CONVOS.filter((c) => talkFilter === 'all' || (talkFilter === 'book' ? c.id.startsWith('book') : !c.id.startsWith('book'))).map((c) => (
            <div key={c.id} className="glass p-5 md:p-6">
              <div className="flex flex-wrap items-end justify-between gap-2 mb-2">
                <h3 className="text-xl font-black">{c.title}</h3>
                <button type="button" className="btn-ghost text-sm" onClick={() => copy(c.lines.filter((l) => l[0] === 'you').map((l) => l[1]).join('\n\n'))}>Copy your lines</button>
              </div>
              <p className="text-xs text-amber-200/90 mb-4">{c.why}</p>
              <div className="space-y-2 max-w-xl">
                {c.lines.map((row, i) => {
                  const who = row[0]
                  const text = row[1]
                  if (who === 'note') {
                    return <p key={c.id + i} className="text-[11px] uppercase tracking-wide text-violet-300 pt-2">{text}</p>
                  }
                  const mine = who === 'you'
                  return (
                    <div key={c.id + i} className={mine ? 'flex justify-end' : 'flex justify-start'}>
                      <div className={mine ? 'rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed max-w-[92%] bg-emerald-600/90 text-white' : 'rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed max-w-[92%] bg-white/10 text-white/90'}>
                        <div className="text-[10px] uppercase tracking-widest opacity-60 mb-1">{mine ? 'Closer' : 'Rooms'}</div>
                        {text}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'products' && (
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <form
            className="glass p-6 grid gap-3 text-sm"
            onSubmit={(e) => {
              e.preventDefault()
              if (!newProd.name.trim() || !Number(newProd.price)) return
              const prod = {
                id: 'p-' + uid(),
                name: newProd.name.trim(),
                price: Number(newProd.price),
                monthly: Number(newProd.monthly) || 0,
                pitch: newProd.pitch.trim() || 'Custom product',
              }
              patch({ products: [...(db.products || []), prod] })
              setNewProd({ name: '', price: '', monthly: '', pitch: '' })
              stamp('Added product ' + prod.name)
            }}
          >
            <p className="desk-kicker">New line to sell</p>
            <h2 className="text-2xl font-black">Add a product</h2>
            <p className="text-white/55">Name, setup once, optional monthly. It shows on Pipeline and Quotes. First invoice = setup + first month if you set a retainer. Commission on setup.</p>
            <input required placeholder="Product name" value={newProd.name} onChange={(e) => setNewProd({ ...newProd, name: e.target.value })} />
            <input required type="number" min="1" placeholder="Setup (ZAR)" value={newProd.price} onChange={(e) => setNewProd({ ...newProd, price: e.target.value })} />
            <input type="number" min="0" placeholder="Monthly retainer (optional)" value={newProd.monthly} onChange={(e) => setNewProd({ ...newProd, monthly: e.target.value })} />
            <textarea rows={3} placeholder="Who it is for / the leak you name on WhatsApp" value={newProd.pitch} onChange={(e) => setNewProd({ ...newProd, pitch: e.target.value })} />
            <button type="submit" className="btn-primary text-sm">Save product on this desk</button>
            <p className="text-xs text-white/40">Open desk. Stays in this browser. EWHTS and booking cannot be deleted.</p>
          </form>
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-white/40">On the floor</p>
            {offers.map((o) => (
              <div key={o.id} className="glass p-5 flex flex-wrap justify-between gap-3">
                <div>
                  <div className="font-bold">{o.name}</div>
                  <div className="text-sm text-blue-300 mt-1 num">R{Number(o.price).toLocaleString('en-ZA')} setup{o.monthly ? ` + R${Number(o.monthly).toLocaleString('en-ZA')}/month` : ''}</div>
                  <p className="text-xs text-white/50 mt-1">{o.pitch}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button type="button" className="btn-ghost text-sm" onClick={() => { setForm({ ...form, offer: o.id, amount: o.price }); setTab('board') }}>Sell this</button>
                  {!o.locked && (
                    <button type="button" className="text-xs text-rose-300 underline" onClick={() => patch({ products: (db.products || []).filter((p) => p.id !== o.id) })}>Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'play' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <p className="text-sm text-white/55">If they say this — sell that. Do not invent a package.</p>
            {SELL_MAP.map((m) => {
              const o = offers.find((x) => x.id === m.sell)
              return (
                <button key={m.if} type="button" className="glass p-4 w-full text-left" onClick={() => { setForm({ ...form, offer: o.id, amount: o.price }); setTab('board') }}>
                  <div className="text-xs text-violet-300">If they say</div>
                  <div className="font-bold">{m.if}</div>
                  <div className="text-sm text-blue-300 mt-1">Sell {o.name} · R{o.price.toLocaleString('en-ZA')}</div>
                  <div className="text-xs text-white/45 mt-1">{m.why}</div>
                </button>
              )
            })}
          </div>
          <div>
            <p className="text-sm text-white/55 mb-3">Objections. Read, do not argue.</p>
            {OBJECTIONS.map((o) => (
              <div key={o.id} className="glass p-4 mb-3">
                <div className="text-[10px] uppercase tracking-widest text-violet-300">{o.trick}</div>
                <div className="font-bold text-sm mt-1">{o.name}</div>
                <p className="text-sm text-white/70 mt-2">{o.reply}</p>
                <button type="button" className="btn-ghost text-sm mt-3" onClick={() => copy(o.reply)}>Copy</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'board' && (
        <>
          <form onSubmit={addLead} className="glass p-4 mb-6 grid md:grid-cols-6 gap-2 text-sm">
            <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <select value={form.offer} onChange={(e) => {
              const o = offers.find((x) => x.id === e.target.value)
              setForm({ ...form, offer: e.target.value, amount: o.price })
            }}>
              {offers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <div className="flex gap-2">
              <input type="number" className="flex-1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <button className="btn-primary text-sm" type="submit">Add</button>
            </div>
          </form>

          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 overflow-x-auto">
            {STAGES.map((stage) => (
              <div
                key={stage}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-2 min-h-[320px]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(stage, e)}
              >
                <div className="text-[10px] tracking-widest uppercase text-violet-300 px-2 py-2">{stage}</div>
                {db.leads.filter((l) => l.stage === stage).map((l) => {
                  const c = commissionOf(l.amount)
                  return (
                    <div
                      key={l.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('id', l.id)}
                      className="glass p-3 mb-2 cursor-grab active:cursor-grabbing"
                    >
                      <div className="font-bold text-sm">{l.name}</div>
                      <div className="text-xs text-white/45">{l.company}</div>
                      <div className="text-sm text-blue-300 mt-1">R{Number(l.amount).toLocaleString('en-ZA')} · {Math.round(c.rate * 100)}%</div>
                      <p className="text-[10px] text-amber-200/80 mt-1 leading-snug">{coach(l).next}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {l.phone && <button type="button" className="text-[10px] underline text-emerald-300" onClick={() => openWa(l)}>WhatsApp</button>}
                        {l.phone && <button type="button" className="text-[10px] underline text-emerald-300" onClick={() => logCall(l)}>Call</button>}
                        {l.email && <button type="button" className="text-[10px] underline text-white/40" onClick={() => queueDraft(l, '08:00')}>Email only if they asked</button>}
                        <button type="button" className="text-[10px] underline text-amber-200" onClick={() => makeQuote(l)}>Quote</button>
                        <button type="button" className="text-[10px] underline text-violet-300" onClick={() => makeInvoice(l)}>Invoice</button>
                        <button type="button" className="text-[10px] underline text-rose-300" onClick={() => setLostId(l.id)}>Lost</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </>
      )}

      {false && tab === 'mail' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <p className="text-sm text-white/55">Email is backup. WhatsApp is the door. Only send if the client asked.</p>
            {TEMPLATES.map((t) => (
              <button key={t.id} type="button" onClick={() => setTpl(t.id)} className={`glass p-4 w-full text-left ${tpl === t.id ? 'border-blue-400/50' : ''}`}>
                <div className="font-bold text-sm">{t.name}</div>
                <div className="text-xs text-white/40 mt-1">{t.subject}</div>
              </button>
            ))}
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="glass p-5">
              <div className="text-[10px] uppercase tracking-widest text-violet-300 mb-2">Live preview</div>
              <pre className="text-sm text-white/75 whitespace-pre-wrap font-sans">{(TEMPLATES.find((t) => t.id === tpl) || TEMPLATES[0]).body}</pre>
            </div>
            {db.drafts.map((d) => (
              <div key={d.id} className="glass p-5">
                <div className="flex justify-between gap-3 text-sm mb-3">
                  <span className="text-violet-300">{d.template} · {d.slot} SAST</span>
                  <span className="text-white/40">{d.to || '—'}</span>
                </div>
                <pre className="text-sm text-white/75 whitespace-pre-wrap font-sans">{d.body}</pre>
                <button type="button" className="btn-ghost text-sm mt-3" onClick={() => copy(d.body)}>Copy email (only if they asked)</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'calls' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-white/55 mb-3">Read the script. Do not freestyle the open.</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {SCRIPTS.map((s) => (
                <button key={s.id} type="button" className={script === s.id ? 'btn-primary text-sm' : 'btn-ghost text-sm'} onClick={() => setScript(s.id)}>{s.name}</button>
              ))}
            </div>
            <div className="glass p-5">
              <pre className="text-sm text-white/80 whitespace-pre-wrap font-sans leading-relaxed">
                {fill((SCRIPTS.find((s) => s.id === script) || SCRIPTS[0]).text, scriptLead || db.leads[0] || { name: 'Thabo', company: 'the brand', offer: 'health', amount: 4500 }, db.staff, '08:00', offers)}
              </pre>
              {scriptLead?.phone && (
                <a className="btn-primary inline-block mt-4 text-sm" href={`tel:${scriptLead.phone}`}>Dial {scriptLead.phone}</a>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest text-white/40">Log</p>
            {db.calls.length === 0 && <p className="text-white/40 text-sm">Tap Call on a pipeline card — the matching script opens here.</p>}
            {db.calls.map((c) => (
              <button type="button" key={c.id} className="glass p-4 w-full text-left text-sm" onClick={() => { setScriptLead(db.leads.find((l) => l.id === c.leadId) || { name: c.name, phone: c.phone, offer: 'health', amount: 4500, company: '' }); setScript('open') }}>
                <div className="font-bold">{c.name}</div>
                <div className="text-white/45">{c.phone || 'no number'} · {new Date(c.at).toLocaleString('en-ZA')}</div>
              </button>
            ))}
          </div>
        </div>
      )}


      {tab === 'invoices' && (
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <p className="text-sm text-white/55">Fill bill-to and download. Banking is set on House — not by closers.</p>
            {pdfNote && <p className="text-emerald-300 text-sm">{pdfNote}</p>}
            <div className="glass p-4 grid gap-1 text-sm">
              <p className="text-[10px] uppercase tracking-widest text-violet-300">Where to pay (House)</p>
              <p>Bank — {db.pay?.bank || 'Not set on House yet'}</p>
              <p>Account — {db.pay?.accountName || '—'}</p>
              <p>Number — {db.pay?.accountNumber || '—'}</p>
              <p>Branch — {db.pay?.branch || '—'} · {db.pay?.type || '—'}</p>
              <p>Reference — {db.pay?.reference || 'invoice ID'}</p>
              {db.pay?.extra ? <p className="text-white/50">{db.pay.extra}</p> : null}
            </div>
            <form
              className="glass p-4 grid gap-2 text-sm"
              onSubmit={(e) => {
                e.preventDefault()
                const invoice = buildInvoice(form)
                patch({ invoices: [invoice, ...db.invoices] })
                setInv(invoice)
              }}
            >
              <input placeholder="Bill-to name" value={form.name} onChange={(e) => { setInv(null); setForm({ ...form, name: e.target.value }) }} />
              <input placeholder="Company" value={form.company} onChange={(e) => { setInv(null); setForm({ ...form, company: e.target.value }) }} />
              <input placeholder="Email" value={form.email} onChange={(e) => { setInv(null); setForm({ ...form, email: e.target.value }) }} />
              <select value={form.offer} onChange={(e) => {
                const o = offers.find((x) => x.id === e.target.value)
                setInv(null)
                setForm({ ...form, offer: e.target.value, amount: o.price })
              }}>
                {offers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              <input type="number" value={form.amount} onChange={(e) => { setInv(null); setForm({ ...form, amount: e.target.value }) }} />
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary text-sm" type="submit">Save invoice</button>
                <button type="button" className="btn-ghost text-sm" onClick={() => {
                  const invoice = inv && inv.id !== 'PREVIEW' ? inv : buildInvoice(form)
                  if (!inv || inv.id === 'PREVIEW') {
                    patch({ invoices: [invoice, ...db.invoices] })
                    setInv(invoice)
                  }
                  downloadPdf(invoice)
                }}>Download PDF</button>
                <button type="button" className="btn-ghost text-sm" onClick={() => printInvoice(inv && inv.id !== 'PREVIEW' ? inv : buildInvoice(form))}>Print / save PDF</button>
              </div>
            </form>
            {(db.quotes || []).map((i) => (
              <div key={i.id} className="glass p-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                <button type="button" className="text-left" onClick={() => { setInv(i); setDocKind('quote') }}>Quote {i.id} · {i.lead.name} · R{i.total.toLocaleString('en-ZA')}</button>
                <div className="flex gap-2">
                  <button type="button" className="btn-ghost text-sm" onClick={() => { setInv(i); downloadPdf({ ...i, kind: 'quote' }) }}>PDF</button>
                  <button type="button" className="btn-primary text-sm" onClick={() => convertQuote(i)}>Convert to invoice</button>
                </div>
              </div>
            ))}
            {db.invoices.map((i) => (
              <div key={i.id} className={`glass p-4 flex flex-wrap items-center justify-between gap-3 text-sm ${inv?.id === i.id ? 'border-blue-400/50' : ''}`}>
                <button type="button" className="text-left" onClick={() => { setInv(i); setDocKind('invoice') }}>
                  {i.id} · {i.lead.name} · R{i.total.toLocaleString('en-ZA')}{i.paid ? ' · paid' : ''}
                </button>
                <button type="button" className="btn-primary text-sm" onClick={() => { setInv(i); downloadPdf(i) }}>Download PDF</button>
              </div>
            ))}
          </div>
          <div>
            <div className="flex gap-2 mb-2">
              <button type="button" className={docKind === 'quote' ? 'btn-primary text-sm' : 'btn-ghost text-sm'} onClick={() => setDocKind('quote')}>Quote</button>
              <button type="button" className={docKind === 'invoice' ? 'btn-primary text-sm' : 'btn-ghost text-sm'} onClick={() => setDocKind('invoice')}>Invoice</button>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-violet-300 mb-2">{docKind === 'quote' ? 'Quote preview' : 'Invoice preview'} — always on</div>
            <div className="overflow-hidden rounded-sm shadow-2xl bg-white text-[#111]">
              <div className="bg-[#07060c] text-white px-8 py-6 flex justify-between gap-4">
                <div className="flex gap-4 items-center">
                  <img src="/logo-mark.png" alt="Elite Way" className="h-16 w-16 object-contain bg-transparent" />
                  <div>
                    <div className="font-black text-lg tracking-wide">ELITE WAY HOLDINGS</div>
                    <div className="text-xs text-white/70 mt-1">Reg. 2025 / 230114 / 07</div>
                    <div className="text-xs text-white/70 mt-1">Pretoria, South Africa</div>
                    <div className="text-xs text-white/70">info@eliteway.co.za · 076 342 5896</div>
                    <div className="text-[10px] text-white/45 mt-2">All rights reserved.</div>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="text-[10px] tracking-[0.25em] uppercase text-white/50">{(inv?.kind || docKind) === 'quote' ? 'QUOTE' : 'INVOICE'}</div>
                  <div className="font-bold">{preview.id}</div>
                  <div className="text-white/70">{preview.date}</div>
                </div>
              </div>
              <div className="px-8 py-8">
                <p className="text-[10px] uppercase tracking-widest text-black/40 mb-1">Bill to</p>
                <p className="font-bold">{preview.lead.name}</p>
                <p className="text-sm">{preview.lead.company}</p>
                {preview.lead.email ? <p className="text-sm text-black/60">{preview.lead.email}</p> : null}
                <table className="w-full text-sm mt-8 mb-6">
                  <thead>
                    <tr className="bg-[#f5f5f8]">
                      <th className="text-left py-2 px-2">Description</th>
                      <th className="text-right py-2 px-2">ZAR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(preview.items || [{ name: preview.offer?.name, amount: preview.amount }]).map((row) => (
                      <tr key={row.name} className="border-b border-black/10">
                        <td className="py-3 px-2">{row.name}</td>
                        <td className="text-right px-2">{Number(row.amount).toLocaleString('en-ZA')}</td>
                      </tr>
                    ))}
                    <tr className="border-b border-black/10">
                      <td className="py-2 px-2">VAT 15%</td>
                      <td className="text-right px-2">{Number(preview.vat).toLocaleString('en-ZA')}</td>
                    </tr>
                    <tr className="font-black text-base">
                      <td className="py-3 px-2">Total due</td>
                      <td className="text-right px-2">R{Number(preview.total).toLocaleString('en-ZA')}</td>
                    </tr>
                  </tbody>
                </table>
                {(inv?.kind || docKind) === 'quote'
                  ? <p className="text-xs text-black/50 mb-4">This is a quote, not a tax invoice. Figures hold for 14 days. No amount is due until you accept and we send an invoice.</p>
                  : (
                    <>
                      <p className="text-[10px] uppercase tracking-widest text-black/40 mb-2">Where to pay</p>
                      <div className="border border-black/10 p-4 text-sm space-y-1 mb-6">
                        <p><span className="text-black/45">Bank</span> — {db.pay?.bank || 'Set on House'}</p>
                        <p><span className="text-black/45">Account name</span> — {db.pay?.accountName || '—'}</p>
                        <p><span className="text-black/45">Account number</span> — {db.pay?.accountNumber || '—'}</p>
                        <p><span className="text-black/45">Branch</span> — {db.pay?.branch || '—'}</p>
                        <p><span className="text-black/45">Type</span> — {db.pay?.type || '—'}</p>
                        <p><span className="text-black/45">Reference</span> — {db.pay?.reference || preview.id}</p>
                        {db.pay?.extra ? <p className="text-black/70 pt-2">{db.pay.extra}</p> : null}
                      </div>
                    </>
                  )}
                {preview.monthly ? <p className="text-xs text-black/50 mb-2">Then R{Number(preview.monthly).toLocaleString('en-ZA')} per month after the first month on this invoice.</p> : null}
                <p className="text-xs text-black/50">Work starts when the invoice is paid.</p>
                <p className="text-[10px] text-black/40 mt-2">Elite Way Holdings · Reg. 2025 / 230114 / 07 · All rights reserved.</p>
              </div>
            </div>
            <p className="text-xs text-white/35 mt-3">Staff only — commission {Math.round((preview.commission?.rate || 0) * 100)}% = R{(preview.commission?.pay || 0).toLocaleString('en-ZA')} (not on the PDF).</p>
            <button type="button" className="btn-primary mt-4 text-sm" onClick={() => {
              const invoice = inv && inv.id !== 'PREVIEW' ? inv : buildInvoice(form)
              if (!inv || inv.id === 'PREVIEW') {
                patch({ invoices: [invoice, ...db.invoices] })
                setInv(invoice)
              }
              downloadPdf(invoice)
            }}>Download this PDF</button>
            <button type="button" className="btn-ghost mt-2 text-sm" onClick={() => printInvoice(inv && inv.id !== 'PREVIEW' ? inv : buildInvoice(form))}>Print / save styled PDF</button>
          </div>
        </div>
      )}

      {lostId && (
        <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4" onClick={() => setLostId(null)}>
          <div className="glass p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <p className="font-bold mb-3">Why lost?</p>
            <div className="flex flex-wrap gap-2">
              {LOST.map((r) => (
                <button key={r} type="button" className="btn-ghost text-sm" onClick={() => {
                  const lead = db.leads.find((l) => l.id === lostId)
                  setLead(lostId, { stage: 'Lost', lostReason: r })
                  stamp('Lost ' + (lead?.name || '') + ' · ' + r, lead)
                  setLostId(null)
                }}>{r}</button>
              ))}
            </div>
          </div>
        </div>
      )}
      <p className="text-white/30 text-xs mt-10">Open desk. No password. WhatsApp is how we reach. Email only if they ask. Data stays in this browser.</p>
      <a href="https://www.eliteway.co.za/" className="text-sm text-blue-300 mt-4 inline-block">← eliteway.co.za</a>
    </div>
  )
}
