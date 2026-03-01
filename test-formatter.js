// Isolated smoke test for Formatter.js — no Playwright import
'use strict';
const f = require('./Utils/Formatter');

let passed = 0, failed = 0;
function assert(label, actual, expected) {
  if (actual === expected) {
    console.log(`  ✓  ${label}`);
    passed++;
  } else {
    console.log(`  ✗  ${label}  |  expected: ${JSON.stringify(expected)}  got: ${JSON.stringify(actual)}`);
    failed++;
  }
}

console.log('\n=== Email Cleaner ===');
assert('Strips trailing "Wha"',       f.cleanEmail('info@immoluxe.mcWha'),             'info@immoluxe.mc');   // strips junk, yields clean address
assert('Strips trailing "Tes"',       f.cleanEmail('villas@royaleestates.comTes'),       'villas@royaleestates.com');   // strips junk, yields clean address
assert('Passes clean address',        f.cleanEmail('contact@prestigeauto.fr'),           'contact@prestigeauto.fr');
assert('Returns null for invalid',    f.cleanEmail('not-an-email'),                      null);
assert('Returns null for null',       f.cleanEmail(null),                                null);

console.log('\n=== Mouloudia Casing ===');
assert('businessname → Businessname',      f.toMouloudia('businessname'),    'Businessname');
assert('email address → Emailaddress',     f.toMouloudia('email address'),   'Emailaddress');
assert('google_maps_score → Googlemapsscore', f.toMouloudia('google_maps_score'), 'Googlemapsscore');
assert('phone → Phonenumber',              f.toMouloudia('phone'),           'Phonenumber');
assert('audit_score → Auditscore',         f.toMouloudia('audit_score'),     'Auditscore');

const remapped = f.mouloudiafyObject({ businessname: 'Test Co', email: 'a@b.com', rating: '4.5' });
assert('mouloudiafyObject keys', JSON.stringify(Object.keys(remapped)), JSON.stringify(['Businessname','Emailaddress','Googlemapsscore']));

console.log(`\n${'─'.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
