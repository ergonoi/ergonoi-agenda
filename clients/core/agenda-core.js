// agenda-core.js — the logic shared by all clients of οὐθείς Agenda:
// grammar, validation, dates and recurrence, keys and encryption, merging,
// journals and the rules for bots (docs/architecture.md).
//
// No DOM, no storage, no network. Used as an ES module by the Node client and
// inlined into clients/web/index.html by clients/web/build.py (the export
// statement at the end is removed there).

// BIP39 English word list (2048 words), for the account phrase (spec 8.2).
const BIP39 = "abandon ability able about above absent absorb abstract absurd abuse access accident account accuse achieve acid acoustic acquire across act action actor actress actual adapt add addict address adjust admit adult advance advice aerobic affair afford afraid again age agent agree ahead aim air airport aisle alarm album alcohol alert alien all alley allow almost alone alpha already also alter always amateur amazing among amount amused analyst anchor ancient anger angle angry animal ankle announce annual another answer antenna antique anxiety any apart apology appear apple approve april arch arctic area arena argue arm armed armor army around arrange arrest arrive arrow art artefact artist artwork ask aspect assault asset assist assume asthma athlete atom attack attend attitude attract auction audit august aunt author auto autumn average avocado avoid awake aware away awesome awful awkward axis baby bachelor bacon badge bag balance balcony ball bamboo banana banner bar barely bargain barrel base basic basket battle beach bean beauty because become beef before begin behave behind believe below belt bench benefit best betray better between beyond bicycle bid bike bind biology bird birth bitter black blade blame blanket blast bleak bless blind blood blossom blouse blue blur blush board boat body boil bomb bone bonus book boost border boring borrow boss bottom bounce box boy bracket brain brand brass brave bread breeze brick bridge brief bright bring brisk broccoli broken bronze broom brother brown brush bubble buddy budget buffalo build bulb bulk bullet bundle bunker burden burger burst bus business busy butter buyer buzz cabbage cabin cable cactus cage cake call calm camera camp can canal cancel candy cannon canoe canvas canyon capable capital captain car carbon card cargo carpet carry cart case cash casino castle casual cat catalog catch category cattle caught cause caution cave ceiling celery cement census century cereal certain chair chalk champion change chaos chapter charge chase chat cheap check cheese chef cherry chest chicken chief child chimney choice choose chronic chuckle chunk churn cigar cinnamon circle citizen city civil claim clap clarify claw clay clean clerk clever click client cliff climb clinic clip clock clog close cloth cloud clown club clump cluster clutch coach coast coconut code coffee coil coin collect color column combine come comfort comic common company concert conduct confirm congress connect consider control convince cook cool copper copy coral core corn correct cost cotton couch country couple course cousin cover coyote crack cradle craft cram crane crash crater crawl crazy cream credit creek crew cricket crime crisp critic crop cross crouch crowd crucial cruel cruise crumble crunch crush cry crystal cube culture cup cupboard curious current curtain curve cushion custom cute cycle dad damage damp dance danger daring dash daughter dawn day deal debate debris decade december decide decline decorate decrease deer defense define defy degree delay deliver demand demise denial dentist deny depart depend deposit depth deputy derive describe desert design desk despair destroy detail detect develop device devote diagram dial diamond diary dice diesel diet differ digital dignity dilemma dinner dinosaur direct dirt disagree discover disease dish dismiss disorder display distance divert divide divorce dizzy doctor document dog doll dolphin domain donate donkey donor door dose double dove draft dragon drama drastic draw dream dress drift drill drink drip drive drop drum dry duck dumb dune during dust dutch duty dwarf dynamic eager eagle early earn earth easily east easy echo ecology economy edge edit educate effort egg eight either elbow elder electric elegant element elephant elevator elite else embark embody embrace emerge emotion employ empower empty enable enact end endless endorse enemy energy enforce engage engine enhance enjoy enlist enough enrich enroll ensure enter entire entry envelope episode equal equip era erase erode erosion error erupt escape essay essence estate eternal ethics evidence evil evoke evolve exact example excess exchange excite exclude excuse execute exercise exhaust exhibit exile exist exit exotic expand expect expire explain expose express extend extra eye eyebrow fabric face faculty fade faint faith fall false fame family famous fan fancy fantasy farm fashion fat fatal father fatigue fault favorite feature february federal fee feed feel female fence festival fetch fever few fiber fiction field figure file film filter final find fine finger finish fire firm first fiscal fish fit fitness fix flag flame flash flat flavor flee flight flip float flock floor flower fluid flush fly foam focus fog foil fold follow food foot force forest forget fork fortune forum forward fossil foster found fox fragile frame frequent fresh friend fringe frog front frost frown frozen fruit fuel fun funny furnace fury future gadget gain galaxy gallery game gap garage garbage garden garlic garment gas gasp gate gather gauge gaze general genius genre gentle genuine gesture ghost giant gift giggle ginger giraffe girl give glad glance glare glass glide glimpse globe gloom glory glove glow glue goat goddess gold good goose gorilla gospel gossip govern gown grab grace grain grant grape grass gravity great green grid grief grit grocery group grow grunt guard guess guide guilt guitar gun gym habit hair half hammer hamster hand happy harbor hard harsh harvest hat have hawk hazard head health heart heavy hedgehog height hello helmet help hen hero hidden high hill hint hip hire history hobby hockey hold hole holiday hollow home honey hood hope horn horror horse hospital host hotel hour hover hub huge human humble humor hundred hungry hunt hurdle hurry hurt husband hybrid ice icon idea identify idle ignore ill illegal illness image imitate immense immune impact impose improve impulse inch include income increase index indicate indoor industry infant inflict inform inhale inherit initial inject injury inmate inner innocent input inquiry insane insect inside inspire install intact interest into invest invite involve iron island isolate issue item ivory jacket jaguar jar jazz jealous jeans jelly jewel job join joke journey joy judge juice jump jungle junior junk just kangaroo keen keep ketchup key kick kid kidney kind kingdom kiss kit kitchen kite kitten kiwi knee knife knock know lab label labor ladder lady lake lamp language laptop large later latin laugh laundry lava law lawn lawsuit layer lazy leader leaf learn leave lecture left leg legal legend leisure lemon lend length lens leopard lesson letter level liar liberty library license life lift light like limb limit link lion liquid list little live lizard load loan lobster local lock logic lonely long loop lottery loud lounge love loyal lucky luggage lumber lunar lunch luxury lyrics machine mad magic magnet maid mail main major make mammal man manage mandate mango mansion manual maple marble march margin marine market marriage mask mass master match material math matrix matter maximum maze meadow mean measure meat mechanic medal media melody melt member memory mention menu mercy merge merit merry mesh message metal method middle midnight milk million mimic mind minimum minor minute miracle mirror misery miss mistake mix mixed mixture mobile model modify mom moment monitor monkey monster month moon moral more morning mosquito mother motion motor mountain mouse move movie much muffin mule multiply muscle museum mushroom music must mutual myself mystery myth naive name napkin narrow nasty nation nature near neck need negative neglect neither nephew nerve nest net network neutral never news next nice night noble noise nominee noodle normal north nose notable note nothing notice novel now nuclear number nurse nut oak obey object oblige obscure observe obtain obvious occur ocean october odor off offer office often oil okay old olive olympic omit once one onion online only open opera opinion oppose option orange orbit orchard order ordinary organ orient original orphan ostrich other outdoor outer output outside oval oven over own owner oxygen oyster ozone pact paddle page pair palace palm panda panel panic panther paper parade parent park parrot party pass patch path patient patrol pattern pause pave payment peace peanut pear peasant pelican pen penalty pencil people pepper perfect permit person pet phone photo phrase physical piano picnic picture piece pig pigeon pill pilot pink pioneer pipe pistol pitch pizza place planet plastic plate play please pledge pluck plug plunge poem poet point polar pole police pond pony pool popular portion position possible post potato pottery poverty powder power practice praise predict prefer prepare present pretty prevent price pride primary print priority prison private prize problem process produce profit program project promote proof property prosper protect proud provide public pudding pull pulp pulse pumpkin punch pupil puppy purchase purity purpose purse push put puzzle pyramid quality quantum quarter question quick quit quiz quote rabbit raccoon race rack radar radio rail rain raise rally ramp ranch random range rapid rare rate rather raven raw razor ready real reason rebel rebuild recall receive recipe record recycle reduce reflect reform refuse region regret regular reject relax release relief rely remain remember remind remove render renew rent reopen repair repeat replace report require rescue resemble resist resource response result retire retreat return reunion reveal review reward rhythm rib ribbon rice rich ride ridge rifle right rigid ring riot ripple risk ritual rival river road roast robot robust rocket romance roof rookie room rose rotate rough round route royal rubber rude rug rule run runway rural sad saddle sadness safe sail salad salmon salon salt salute same sample sand satisfy satoshi sauce sausage save say scale scan scare scatter scene scheme school science scissors scorpion scout scrap screen script scrub sea search season seat second secret section security seed seek segment select sell seminar senior sense sentence series service session settle setup seven shadow shaft shallow share shed shell sheriff shield shift shine ship shiver shock shoe shoot shop short shoulder shove shrimp shrug shuffle shy sibling sick side siege sight sign silent silk silly silver similar simple since sing siren sister situate six size skate sketch ski skill skin skirt skull slab slam sleep slender slice slide slight slim slogan slot slow slush small smart smile smoke smooth snack snake snap sniff snow soap soccer social sock soda soft solar soldier solid solution solve someone song soon sorry sort soul sound soup source south space spare spatial spawn speak special speed spell spend sphere spice spider spike spin spirit split spoil sponsor spoon sport spot spray spread spring spy square squeeze squirrel stable stadium staff stage stairs stamp stand start state stay steak steel stem step stereo stick still sting stock stomach stone stool story stove strategy street strike strong struggle student stuff stumble style subject submit subway success such sudden suffer sugar suggest suit summer sun sunny sunset super supply supreme sure surface surge surprise surround survey suspect sustain swallow swamp swap swarm swear sweet swift swim swing switch sword symbol symptom syrup system table tackle tag tail talent talk tank tape target task taste tattoo taxi teach team tell ten tenant tennis tent term test text thank that theme then theory there they thing this thought three thrive throw thumb thunder ticket tide tiger tilt timber time tiny tip tired tissue title toast tobacco today toddler toe together toilet token tomato tomorrow tone tongue tonight tool tooth top topic topple torch tornado tortoise toss total tourist toward tower town toy track trade traffic tragic train transfer trap trash travel tray treat tree trend trial tribe trick trigger trim trip trophy trouble truck true truly trumpet trust truth try tube tuition tumble tuna tunnel turkey turn turtle twelve twenty twice twin twist two type typical ugly umbrella unable unaware uncle uncover under undo unfair unfold unhappy uniform unique unit universe unknown unlock until unusual unveil update upgrade uphold upon upper upset urban urge usage use used useful useless usual utility vacant vacuum vague valid valley valve van vanish vapor various vast vault vehicle velvet vendor venture venue verb verify version very vessel veteran viable vibrant vicious victory video view village vintage violin virtual virus visa visit visual vital vivid vocal voice void volcano volume vote voyage wage wagon wait walk wall walnut want warfare warm warrior wash wasp waste water wave way wealth weapon wear weasel weather web wedding weekend weird welcome west wet whale what wheat wheel when where whip whisper wide width wife wild will win window wine wing wink winner winter wire wisdom wise wish witness wolf woman wonder wood wool word work world worry worth wrap wreck wrestle wrist write wrong yard year yellow you young youth zebra zero zone zoo".split(" ");

const BIP39_SET = new Set(BIP39);

const DIM_ORDER = ["facet","date","time","recurring","skip","rank","size","action","type","anchor","topic","done","moved","review","source","ref","decision","cal","id","rev"];

const DIM_RANK = Object.fromEntries(DIM_ORDER.map((d, i) => [d, i]));

const LIST_MARKERS = ["- [ ] ", "- [x] ", "[ ] ", "[x] ", "- ", "* ", "• "];

function normalizeSpace(s) {
  return s.normalize("NFC").replace(/[\t\u00a0\u202f\r]/g, " ").split(" ").filter(Boolean).join(" ");
}

function normSnowflake(v) {
  if (!/^\d+$/.test(v)) return null;
  try { const n = BigInt(v); return n > 0n ? n.toString().padStart(19, "0") : null; } catch { return null; }
}

// The note of an entry (architecture 2.4): "{{…}}" after the text, before the tags.
// Inside, "\n" is a line break, "\}" a brace and "\\" a backslash; "#" starts no tag.
const NOTE_MAX = 500;
function encodeNote(n) { return String(n).replace(/\r/g, "").replace(/\\/g, "\\\\").replace(/\}/g, "\\}").replace(/\n/g, "\\n"); }
function decodeNote(s) { return s.replace(/\\(.)/g, (_, c) => c === "n" ? "\n" : c); }
// Finds "{{…}}" followed only by tags (or nothing); returns [before, note, after] or null.
function splitNote(raw) {
  let from = 0;
  for (;;) {
    const a = raw.indexOf("{{", from);
    if (a < 0) return null;
    let i = a + 2, end = -1;
    while (i < raw.length) {
      if (raw[i] === "\\") { i += 2; continue; }
      if (raw[i] === "}" && raw[i + 1] === "}") { end = i; break; }
      i++;
    }
    if (end < 0) return null;
    const after = raw.slice(end + 2);
    if (after.trim().split(/\s+/).every(t => !t || (t.length > 1 && t.startsWith("#")))) return [raw.slice(0, a), decodeNote(raw.slice(a + 2, end)), after];
    from = a + 2;
  }
}

// parse returns {text, note, tags:[{dim,val}], id, rev} or null if the line has no text.
function parse(raw) {
  const sp = splitNote(raw);
  let line = normalizeSpace(sp ? sp[0] + " " + sp[2] : raw);
  for (const m of LIST_MARKERS) {
    if (line.toLowerCase().startsWith(m)) { line = line.slice(m.length).trim(); break; }
  }
  if (!line) return null;
  const tokens = line.split(" ");
  let i = tokens.length;
  while (i > 0 && tokens[i - 1].length > 1 && tokens[i - 1].startsWith("#")) i--;
  if (i === 0) return null;
  const e = { text: tokens.slice(0, i).join(" "), note: sp ? sp[1] : "", tags: [], id: "", rev: "" };
  for (const tok of tokens.slice(i)) {
    const body = tok.slice(1), dash = body.indexOf("-");
    const dim = dash > 0 ? body.slice(0, dash).toLowerCase() : body.toLowerCase();
    const val = dash > 0 ? body.slice(dash + 1) : "";
    if (dim === "id" || dim === "rev") {
      const n = normSnowflake(val);
      if (n) { e[dim] = n; continue; }
    }
    e.tags.push({ dim, val: val.toLowerCase() });
  }
  if (e.rev && !e.id) e.rev = "";
  e.tags.sort((a, b) => (DIM_RANK[a.dim] ?? 99) - (DIM_RANK[b.dim] ?? 99));
  return e;
}

const get = (e, dim) => (e.tags.find(t => t.dim === dim) || {}).val || "";

const has = (e, dim) => e.tags.some(t => t.dim === dim);

const contentKey = e => [e.text, ...(e.note ? ["{{" + encodeNote(e.note) + "}}"] : []), ...e.tags.map(t => "#" + t.dim + (t.val ? "-" + t.val : ""))].join(" ");

const toLine = e => contentKey(e) + (e.id ? " #id-" + e.id : "") + (e.rev ? " #rev-" + e.rev : "");

function addTag(e, dim, val) {
  e.tags = e.tags.filter(t => t.dim !== dim);
  e.tags.push({ dim, val });
  e.tags.sort((a, b) => (DIM_RANK[a.dim] ?? 99) - (DIM_RANK[b.dim] ?? 99));
}

const EPOCH = 1704067200000n;

function snowTime(s) {
  try { return new Date(Number((BigInt(s) >> 22n) + EPOCH)); } catch { return null; }
}

const today = () => {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
};

function parseLines(text) {
  return text.split("\n").map(parse).filter(Boolean);
}

// Highest rev per id.
function currentOf(entries) {
  const best = new Map();
  for (const e of entries) {
    if (!e.id) continue;
    const b = best.get(e.id);
    if (!b || e.rev > b.rev) best.set(e.id, e);
  }
  return best;
}

function sortKey(e) {
  const t = get(e, "time");
  return (get(e, "date") || "9999") + " " + (/^\d\d:\d\d/.test(t) ? t.slice(0, 5) : "99:99");
}

function validDate(v) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v + "T12:00:00Z");
  return !isNaN(d) && d.toISOString().slice(0, 10) === v;
}

function checkTag(dim, v) {
  switch (dim) {
    case "date": case "done": return validDate(v);
    case "time": return RE_TIME.test(v);
    case "recurring": return ["daily", "weekly", "biweekly", "monthly", "yearly"].includes(v)
      || /^(mon|tue|wed|thu|fri|sat|sun)(-(mon|tue|wed|thu|fri|sat|sun))*$/.test(v)
      || /^monthly(-([1-9]|[12]\d|3[01]))+$/.test(v);
    case "facet": return RE_FACET.test(v);
    case "topic": return RE_TOPIC.test(v);
    case "rank": return ["high", "medium", "low"].includes(v);
    case "size": return ["s", "m", "l"].includes(v);
    case "action": return ["required", "now", "waiting", "idle"].includes(v);
    case "review": return v === "needed";
    case "source": return ["human", "bot", "mixed"].includes(v);
    case "ref": return /^\d{19}$/.test(v);
    case "decision": return ["accepted", "rejected"].includes(v);
    case "cal": return /^[0-9a-f]{10}$/.test(v);
    // Kind of entry (architecture 3.2); "fix" and "flex" are the older spelling of #anchor.
    case "type": return ["event", "task", "memo", "meta", "fix", "flex"].includes(v);
    case "anchor": return v === "fix" || v === "flex";
    case "skip": return validDate(v);
    case "moved": return /^[0-9a-f]{12}$/.test(v);
  }
  return false;
}

// Tags allowed more than once (architecture 3.3): two dates make a span; up to three
// facets, of which the first owns the entry (journal and colour).
const TAG_MAX = { date: 2, facet: 3, topic: 3, skip: 60 };
const facetsOf = e => e.tags.filter(t => t.dim === "facet").map(t => t.val);

function validate(e) {
  const count = {}, keep = [], bad = [], seen = new Set();
  for (const t of e.tags) {
    const limit = TAG_MAX[t.dim] || 1;
    const k = t.dim + "-" + t.val;
    if ((t.dim === "facet" || t.dim === "topic") && seen.has(k)) continue; // the same value twice counts once
    seen.add(k);
    if (!checkTag(t.dim, t.val) || (count[t.dim] || 0) >= limit) { bad.push(t.dim + (t.val ? "-" + t.val : "")); continue; }
    count[t.dim] = (count[t.dim] || 0) + 1;
    keep.push(t);
  }
  e.tags = keep;
  if (bad.length) { e.text += " " + bad.join(" "); addTag(e, "review", "needed"); }
  // Tag definitions, journal names, learned rules (spec 3.4, 8.12) and comments need no
  // facet; a review flag set for that reason alone is dropped.
  if (DEF_RE.test(e.text) || COMMENT_RE.test(e.text)) { if (!bad.length && !has(e, "facet")) e.tags = e.tags.filter(t => t.dim !== "review"); }
  else if (!has(e, "facet") && !has(e, "review")) addTag(e, "review", "needed");
}

const DEF_RE = /^(Tag definition|Tag overlay|Journal overlay|Journal id|Journal name|Journal alias|Journal key|Journal version|Journal examples|Journal type|Addon function|Learned Rule):/;
const COMMENT_RE = /^> /;
// Lines that concern the owner alone (architecture 8.11e): in a version 2 journal they are
// encrypted with the owner's private key, so that allies and guests cannot read them.
const PRIVATE_RE = /^(Journal key|Journal alias|Tag overlay|Journal overlay|Addon function|Journal handover):/;

const TE = new TextEncoder(), TD = new TextDecoder();

const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));

const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");

const PHRASE_WORDS = 8;

const PAD = 256, MAX_LINE = 4096, NONCE = 12, GCM_TAG = 16;

function normPhrase(p) { return p.normalize("NFKD").toLowerCase().split(/\s+/).filter(Boolean).join(" "); }

function phraseProblem(p) {
  const w = normPhrase(p).split(" ").filter(Boolean);
  if (w.length !== PHRASE_WORDS) return `The phrase has ${PHRASE_WORDS} words; found ${w.length}.`;
  const unknown = w.filter(x => !BIP39_SET.has(x));
  return unknown.length ? "Unknown word(s): " + unknown.join(", ") : "";
}

function newPhrase() {
  const r = new Uint16Array(PHRASE_WORDS);
  crypto.getRandomValues(r);
  return [...r].map(n => BIP39[n & 2047]).join(" ");
}

// Account ID = hex(SHA-256(token bytes)), the name of the account file on the service (spec 8.4).
async function accountId(tokenHex) {
  const bytes = Uint8Array.from(tokenHex.match(/../g).map(h => parseInt(h, 16)));
  return hex(await crypto.subtle.digest("SHA-256", bytes));
}

async function deriveKeys(phrase) {
  const pw = await crypto.subtle.importKey("raw", TE.encode(normPhrase(phrase)), "PBKDF2", false, ["deriveBits"]);
  const master = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: TE.encode("outheis-agenda/v1"), iterations: 600000, hash: "SHA-256" }, pw, 256);
  const hk = await crypto.subtle.importKey("raw", master, "HKDF", false, ["deriveBits"]);
  const part = info => crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: new Uint8Array(0), info: TE.encode(info) }, hk, 256);
  return { enc: b64(await part("enc")), token: hex(await part("auth")) };
}

// ---------------------------------------------------------------------------
// Version 2 keys (architecture 8.11e): owner, ally, guest.
//
//   phrase ─┬─► P   private key (owner's devices)
//           ├─► M   ally secret, 11 bytes ─┬─► K  journal key
//           │                               └─► W  write token ─► R = HMAC(W, "outheis-agenda/read")
//           └─► D   delete token
//   F       = first 11 bytes of SHA-256(D)  (fingerprint, not secret)
//   account = SHA-256( F ‖ SHA-256(R) )
//
// Ally code: M ‖ F as 16 words (176 bits). Guest code: "g1." + base64url(K ‖ R ‖ F).
// ---------------------------------------------------------------------------
const KEY_V2 = 2;
const unhex = h => Uint8Array.from(h.match(/../g).map(x => parseInt(x, 16)));
const sha256 = async (...parts) => new Uint8Array(await crypto.subtle.digest("SHA-256", new Uint8Array(parts.flatMap(p => [...p]))));
async function hkdf(keyBytes, info, bits = 256) {
  const k = await crypto.subtle.importKey("raw", keyBytes, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: new Uint8Array(0), info: TE.encode(info) }, k, bits));
}
async function hmac256(keyBytes, msg) {
  const k = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, TE.encode(msg)));
}
// From the ally secret M: journal key K, write token W, read token R.
async function fromAllySecret(m) {
  const K = await hkdf(m, "outheis-agenda/v2/enc"), W = await hkdf(m, "outheis-agenda/v2/write");
  return { K, W, R: await hmac256(W, "outheis-agenda/read") };
}
async function keysV2({ level, K, W, R, F, D, P }) {
  const rh = await sha256(R);
  return {
    v: KEY_V2, level, enc: b64(K), r: hex(R), f: hex(F), rh: hex(rh),
    ...(W ? { w: hex(W) } : {}), ...(D ? { d: hex(D) } : {}), ...(P ? { priv: b64(P) } : {}),
    acct: hex(await sha256(F, rh)),
  };
}
// Owner keys from the eight words of a version 2 journal.
async function deriveKeysV2(phrase) {
  const pw = await crypto.subtle.importKey("raw", TE.encode(normPhrase(phrase)), "PBKDF2", false, ["deriveBits"]);
  const master = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", salt: TE.encode("outheis-agenda/v2"), iterations: 600000, hash: "SHA-256" }, pw, 256));
  const P = await hkdf(master, "outheis-agenda/v2/private"), D = await hkdf(master, "outheis-agenda/v2/delete");
  const M = await hkdf(master, "outheis-agenda/v2/ally", 88);
  const F = (await sha256(D)).slice(0, 11);
  return keysV2({ level: "owner", ...(await fromAllySecret(M)), F, D, P, M });
}
const bitsToWords = bytes => {
  let bits = [...bytes].map(b => b.toString(2).padStart(8, "0")).join("");
  const out = [];
  for (let i = 0; i + 11 <= bits.length; i += 11) out.push(BIP39[parseInt(bits.slice(i, i + 11), 2)]);
  return out.join(" ");
};
const wordsToBits = words => {
  const bits = normPhrase(words).split(" ").map(w => BIP39.indexOf(w).toString(2).padStart(11, "0")).join("");
  return Uint8Array.from(bits.match(/.{8}/g).map(b => parseInt(b, 2)));
};
// The ally code of a journal: 16 words. Only the owner can compute it (it needs M).
async function allyCodeOf(phrase) {
  const pw = await crypto.subtle.importKey("raw", TE.encode(normPhrase(phrase)), "PBKDF2", false, ["deriveBits"]);
  const master = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", salt: TE.encode("outheis-agenda/v2"), iterations: 600000, hash: "SHA-256" }, pw, 256));
  const M = await hkdf(master, "outheis-agenda/v2/ally", 88);
  const F = (await sha256(await hkdf(master, "outheis-agenda/v2/delete"))).slice(0, 11);
  return bitsToWords(new Uint8Array([...M, ...F]));
}
async function keysFromAllyCode(words) {
  const b = wordsToBits(words), M = b.slice(0, 11), F = b.slice(11, 22);
  return keysV2({ level: "ally", ...(await fromAllySecret(M)), F });
}
// The guest code of a journal: K, R and F, as text for a link or a QR code.
function guestCodeOf(keys) {
  const raw = new Uint8Array([...Uint8Array.from(atob(keys.enc), c => c.charCodeAt(0)), ...unhex(keys.r), ...unhex(keys.f)]);
  return "g1." + btoa(String.fromCharCode(...raw)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function keysFromGuestCode(code) {
  const s = code.trim().replace(/^g1\./, "").replace(/-/g, "+").replace(/_/g, "/");
  const raw = Uint8Array.from(atob(s + "=".repeat((4 - s.length % 4) % 4)), c => c.charCodeAt(0));
  if (raw.length !== 75) throw new Error("not a guest code");
  return keysV2({ level: "guest", K: raw.slice(0, 32), R: raw.slice(32, 64), F: raw.slice(64, 75) });
}
// The handover code of a journal (architecture 8.11i): its ally secret and a secret T of
// the owner who hands it over, "h1." + base64url(M ‖ F ‖ T). T is a base64 AES key.
const b64u = raw => btoa(String.fromCharCode(...raw)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
async function handoverCodeOf(phrase, T) {
  const mf = wordsToBits(await allyCodeOf(phrase)), t = Uint8Array.from(atob(T), c => c.charCodeAt(0));
  return "h1." + b64u(new Uint8Array([...mf, ...t]));
}
function parseHandoverCode(code) {
  const s = code.trim().replace(/^h1\./, "").replace(/-/g, "+").replace(/_/g, "/");
  const raw = Uint8Array.from(atob(s + "=".repeat((4 - s.length % 4) % 4)), c => c.charCodeAt(0));
  if (raw.length !== 54) throw new Error("not a handover code");
  return { ally: bitsToWords(raw.slice(0, 22)), secret: btoa(String.fromCharCode(...raw.slice(22))) };
}
// What kind of code a text is: "phrase" (8 words), "ally" (16 words), "guest", "handover", or "".
function codeKind(text) {
  const t = (text || "").trim();
  if (/^g1\.[A-Za-z0-9_-]{90,}$/.test(t)) return "guest";
  if (/^h1\.[A-Za-z0-9_-]{70,}$/.test(t)) return "handover";
  const w = normPhrase(t).split(" ").filter(Boolean);
  if (w.some(x => !BIP39_SET.has(x))) return "";
  return w.length === PHRASE_WORDS ? "phrase" : w.length === 16 ? "ally" : "";
}
// Account ID of any keys: version 1 from the token, version 2 as stored.
async function acctOf(keys) { return keys.v === KEY_V2 ? keys.acct : accountId(keys.token); }
// Headers that prove the access of keys, for reading and writing (architecture 8.4).
function authHeaders(keys) {
  if (keys.v !== KEY_V2) return { Authorization: "Bearer " + keys.token };
  return keys.w ? { Authorization: "Write " + keys.w, "X-Agenda-Fingerprint": keys.f } : { Authorization: "Read " + keys.r, "X-Agenda-Fingerprint": keys.f };
}
// Headers for deleting: the owner's delete token, or a version 1 token.
function deleteHeaders(keys) {
  if (keys.v !== KEY_V2) return { Authorization: "Bearer " + keys.token };
  return keys.d ? { Authorization: "Delete " + keys.d, "X-Agenda-Read-Hash": keys.rh } : null;
}
const canWrite = keys => keys.v !== KEY_V2 || !!keys.w;
// Replacing the whole file (compaction) is the owner's (audit S2): in version 2 the
// request carries the delete token as proof, which only the owner holds.
const canReplace = keys => keys.v !== KEY_V2 || !!keys.d;
function replaceHeaders(keys) {
  const h = authHeaders(keys);
  return keys.v === KEY_V2 && keys.d ? { ...h, "X-Agenda-Owner": keys.d } : h;
}

// Member ID of a person in a journal (architecture 8.4a): HMAC-SHA256 over the
// journal's account ID, keyed with a key derived from the enc key of the person's
// own default journal, which the service never sees. Same on all devices of the
// person, different for every journal, and not traceable to the person's account.
async function memberId(ownEncB64, journalAcctHex) {
  const raw = Uint8Array.from(atob(ownEncB64), c => c.charCodeAt(0));
  const seed = new Uint8Array([...TE.encode("outheis-agenda/member"), ...raw]);
  const mk = await crypto.subtle.importKey("raw", await crypto.subtle.digest("SHA-256", seed), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", mk, TE.encode(journalAcctHex)));
}

function addDays(iso, n) {
  const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

// Fixed values of the grammar (spec section 4). Facet and topic values are not
// configured: they are the values used in the journal (spec 3.4).
const VOCAB = {
  action: ["required", "now", "waiting", "idle"],
  type: ["event", "task", "memo"],
  anchor: ["fix", "flex"],
  rank: ["high", "medium", "low"],
  size: ["s", "m", "l"],
  recurring: ["daily", "weekly", "biweekly", "monthly", "yearly", "mon", "tue", "wed", "thu", "fri", "sat", "sun", "mon-tue-wed-thu-fri"],
};

// Used only while the journal contains no facet at all.

const RE_FACET = /^[\p{Ll}\p{Lo}\p{N}_]+$/u;

const RE_TOPIC = /^[\p{Ll}\p{Lo}\p{N}_]+(-[\p{Ll}\p{Lo}\p{N}_]+)*$/u;

const NAME_RE = /^Journal name:\s*/;

const RE_TIME = /^(([01]\d|2[0-3]):[0-5]\d(-([01]\d|2[0-3]):[0-5]\d)?|\d+h(\d+m)?|\d+m)$/;

// Same day n months later; the last day of the month if that day does not exist.
function addMonths(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(y, m - 1 + n, 1, 12);
  const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
  t.setDate(Math.min(d, last));
  return t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");
}

function nextMonday(iso) { let d = addDays(iso, 1); while (new Date(d + "T12:00:00").getDay() !== 1) d = addDays(d, 1); return d; }

function firstOfNextMonth(iso) { const d = new Date(iso + "T12:00:00"); return d.getFullYear() + (d.getMonth() === 11 ? 1 : 0) + "-" + String((d.getMonth() + 1) % 12 + 1).padStart(2, "0") + "-01"; }

function dayDiff(a, b) { return Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000); }

// Next occurrence of a recurring item on or after `from` (spec 4.4).
const WD = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function nextOccurrence(anchor, pat, from) {
  if (anchor >= from) return anchor;
  return firstOn(anchor, pat, from) || anchor;
}
// First day >= from on which the pattern falls (anchor: the day the pattern is counted
// from), or "" within 400 days.
function firstOn(anchor, pat, from) {
  const a = new Date(anchor + "T12:00:00");
  for (let i = 0, d = from; i < 400; i++, d = addDays(d, 1)) {
    const x = new Date(d + "T12:00:00");
    const hit = pat === "daily" ? true
      : pat === "weekly" ? x.getDay() === a.getDay()
      : pat === "biweekly" ? ((dayDiff(anchor, d) % 14) + 14) % 14 === 0
      : pat === "monthly" ? x.getDate() === a.getDate()
      : pat === "yearly" ? x.getDate() === a.getDate() && x.getMonth() === a.getMonth()
      : pat.startsWith("monthly-") ? pat.split("-").slice(1).map(Number).includes(x.getDate())
      : pat.split("-").includes(WD[x.getDay()]);
    if (hit) return d;
  }
  return "";
}

// Date binding (architecture 5.5): "fix" entries belong to their date, "flex" entries are
// carried forward until done. An explicit #anchor decides (or #type-fix/-flex, its older
// spelling); then the kind (#type-event fixed, #type-task flexible); otherwise the
// journal's type, then a calendar origin, a repetition or a clock time make it fixed.
function bindingOf(e, journalFixed) {
  const a = get(e, "anchor"), t = get(e, "type");
  if (a === "fix" || a === "flex") return a;
  if (t === "fix" || t === "flex") return t;
  if (t === "event") return "fix";
  if (t === "task") return "flex";
  if (journalFixed || has(e, "cal") || has(e, "recurring") || has(e, "time")) return "fix";
  return "flex";
}
// Kinds without a date (architecture 3.2, 5.6): a memo is kept to be found again, a meta
// line says something about the journal (its name, keys, definitions, overlays …). Both
// were written with the date 3000-12-31 before 0.5.0, which is still read.
const FAR_DATE = "3000-12-31";
const isMeta = e => get(e, "type") === "meta" || DEF_RE.test(e.text);
const isMemo = e => get(e, "type") === "memo" || (get(e, "date") === FAR_DATE && !isMeta(e));
// Brings a line to the present spelling, or returns it unchanged:
// #type-fix/-flex become #anchor-fix/-flex; meta lines and memos lose the far date and
// carry their kind instead.
function migrateLine(line) {
  const e = parse(line);
  if (!e) return line;
  let n = 0;
  for (const t of e.tags) if (t.dim === "type" && (t.val === "fix" || t.val === "flex")) { t.dim = "anchor"; n++; }
  const far = e.tags.some(t => t.dim === "date" && t.val === FAR_DATE);
  if (far && (isMeta(e) || isMemo(e))) {
    const kind = isMeta(e) ? "meta" : "memo";
    e.tags = e.tags.filter(t => !(t.dim === "date" && t.val === FAR_DATE));
    if (!has(e, "type")) e.tags.push({ dim: "type", val: kind });
    n++;
  } else if (DEF_RE.test(e.text) && !has(e, "type")) { e.tags.push({ dim: "type", val: "meta" }); n++; }
  if (!n) return line;
  e.tags.sort((x, y) => (DIM_RANK[x.dim] ?? 99) - (DIM_RANK[y.dim] ?? 99));
  return toLine(e);
}
// A fixed entry that passes without asking: from a calendar (its source decides) or in a
// journal of fixed dates (birthdays, holidays).
const passesSilently = (e, journalFixed) => !!journalFixed || has(e, "cal");

// A recurring entry with two dates (architecture 4.4a): if the dates are less than one
// period apart (weekly, monthly, yearly), they are one occurrence over several days that
// repeats; otherwise they bound the series. Weekday lists, days of month and daily
// always bound the series. Returns null, "occurrence" or "series".
function recurrenceMode(e) {
  const pat = get(e, "recurring"), dates = e.tags.filter(t => t.dim === "date").map(t => t.val).sort();
  if (!pat || dates.length < 2) return null;
  const [a, b] = dates;
  const end = pat === "weekly" ? addDays(a, 7) : pat === "biweekly" ? addDays(a, 14) : pat === "monthly" ? addMonths(a, 1) : pat === "yearly" ? addMonths(a, 12) : null;
  return end && b < end ? "occurrence" : "series";
}
// Something about the dates of a recurring entry that is probably not meant, or "".
function recurrenceDoubt(e) {
  const mode = recurrenceMode(e);
  if (!mode) return "";
  const pat = get(e, "recurring"), [a, b] = e.tags.filter(t => t.dim === "date").map(t => t.val).sort();
  if (mode === "occurrence") {
    const half = pat === "weekly" ? 3 : pat === "biweekly" ? 7 : pat === "monthly" ? 14 : 182;
    return dayDiff(a, b) > half ? "each occurrence lasts " + (dayDiff(a, b) + 1) + " days, more than half of its period" : "";
  }
  const f = firstOn(a, pat, a);
  return !f || f > b ? "no occurrence falls between the two dates" : "";
}
// Date on which an item is shown: next occurrence for recurring items (today while a
// multi-day occurrence is in progress; "9999-12-31" once a bounded series has ended),
// today for multi-day items in progress, otherwise the first date.
function shownDate(e, t0) {
  if (isMeta(e) || isMemo(e)) return "9999-12-31"; // never due
  const dates = e.tags.filter(t => t.dim === "date").map(t => t.val).sort();
  const d = dates[0] || t0;
  if (has(e, "recurring")) {
    const pat = get(e, "recurring"), mode = recurrenceMode(e);
    // Occurrences cancelled or moved by #skip are passed over (architecture 4.4b).
    const skips = new Set(e.tags.filter(t => t.dim === "skip").map(t => t.val));
    const next = (from, f) => { let n = f(from); for (let i = 0; n && skips.has(n) && i < 400; i++) n = f(addDays(n, 1)); return n; };
    if (mode === "series") { const n = next(d > t0 ? d : t0, x => firstOn(d, pat, x)); return !n || n > dates[1] ? "9999-12-31" : n; }
    if (mode === "occurrence") {
      const len = dayDiff(d, dates[1]), s = next(addDays(t0, -len), x => nextOccurrence(d, pat, x));
      return s < t0 ? t0 : s; // an occurrence in progress is shown today
    }
    return next(t0, x => nextOccurrence(d, pat, x));
  }
  if (dates[1] && d < t0 && dates[1] >= t0) return t0;
  return d;
}


// Days of [from, to] on which an entry takes place, for a calendar (ui.md 4.15): every
// occurrence of a series except those passed over by #skip, and every day of a span.
// An entry without a date has no day of its own and yields none.
function occurrences(e, from, to) {
  const dates = e.tags.filter(t => t.dim === "date").map(t => t.val).sort();
  const out = [];
  const span = (a, b) => { for (let d = a < from ? from : a; d <= b && d <= to; d = addDays(d, 1)) out.push(d); };
  if (!has(e, "recurring")) { if (dates.length) span(dates[0], dates[1] || dates[0]); return out; }
  const pat = get(e, "recurring"), mode = recurrenceMode(e);
  const a = dates[0] || today();
  const skips = new Set(e.tags.filter(t => t.dim === "skip").map(t => t.val));
  const len = mode === "occurrence" ? dayDiff(a, dates[1]) : 0;
  const end = mode === "series" ? (dates[1] < to ? dates[1] : to) : to;
  let d = addDays(from, -len) > a ? addDays(from, -len) : a;
  for (let i = 0; i < 400 && d <= end; i++) {
    const n = firstOn(a, pat, d);
    if (!n || n > end) break;
    if (!skips.has(n)) span(n, addDays(n, len));
    d = addDays(n, 1);
  }
  return [...new Set(out)];
}


// ---------------------------------------------------------------------------
// Snowflakes (spec 4.11): a generator for one machine ID (0-1023)
// ---------------------------------------------------------------------------

function makeSnow(machine) {
  let last = 0n, seq = 0n;
  return () => {
    let ms = BigInt(Date.now()) - EPOCH;
    if (ms <= last) { ms = last; seq = (seq + 1n) & 0xFFFn; if (seq === 0n) ms += 1n; } else seq = 0n;
    last = ms;
    return ((ms << 22n) | (BigInt(machine) << 12n) | seq).toString().padStart(19, "0");
  };
}

// ---------------------------------------------------------------------------
// Encryption of lines with an explicit key (spec 8.3)
// ---------------------------------------------------------------------------

function importEncKey(encB64) {
  return crypto.subtle.importKey("raw", unb64(encB64), "AES-GCM", false, ["encrypt", "decrypt"]);
}
// One plaintext line -> one stored line; null if the line is too long.
async function encryptWith(key, text) {
  const data = TE.encode(text);
  const size = Math.ceil((data.length + 1) / PAD) * PAD;
  if (NONCE + GCM_TAG + size > MAX_LINE) return null;
  const padded = new Uint8Array(size); padded.set(data); padded[data.length] = 0x80;
  const nonce = crypto.getRandomValues(new Uint8Array(NONCE));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, padded));
  const out = new Uint8Array(NONCE + ct.length); out.set(nonce); out.set(ct, NONCE);
  return b64(out);
}
async function decryptWith(key, line) {
  try {
    const b = unb64(line.trim());
    const pt = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: b.slice(0, NONCE) }, key, b.slice(NONCE)));
    let n = pt.length; while (n > 0 && pt[n - 1] === 0) n--;
    if (n === 0 || pt[n - 1] !== 0x80) return null;
    return TD.decode(pt.slice(0, n - 1));
  } catch { return null; }
}
async function decryptFileWith(key, text) {
  const plain = [], broken = [];
  for (const l of text.split("\n")) {
    if (!l.trim()) continue;
    const p = await decryptWith(key, l);
    if (p === null) broken.push(l.trim()); else plain.push(p);
  }
  return { plain, broken };
}

// ---------------------------------------------------------------------------
// Journals (spec 3.4, 8.11), on lists of entries
// ---------------------------------------------------------------------------

// Name from the newest open "Journal name:" entry, or "".
function journalNameOf(entries) {
  let best = null;
  for (const e of entries) if (NAME_RE.test(e.text) && !has(e, "done") && (!best || (e.rev || "z") > (best.rev || "z"))) best = e;
  return best ? best.text.replace(NAME_RE, "").trim() : "";
}
// Facets declared by open "Tag definition:" entries.
function declaredFacetsOf(entries) {
  const out = new Set();
  for (const e of entries) if (/^Tag definition:/.test(e.text) && !has(e, "done") && get(e, "facet")) out.add(get(e, "facet"));
  return out;
}
// Accepted learned rules (spec 8.12).
function learnedRulesOf(entries) {
  return entries.filter(e => /^Learned Rule:/.test(e.text) && !has(e, "done") && get(e, "source") === "mixed")
    .map(e => e.text.replace(/^Learned Rule:\s*/, ""));
}

// ---------------------------------------------------------------------------
// Rules for bots (spec 8.12)
// ---------------------------------------------------------------------------

const sourceOf = e => get(e, "source") || "human";
// Checks a stored version against the versions before it. Returns a reason if
// the line is a bot writing over an entry of a human (change or closing), else "".
function botViolation(e, previous) {
  if (sourceOf(e) !== "bot" || !e.id || e.rev === e.id) return "";
  if (previous && sourceOf(previous) !== "bot") return "a bot changed an entry written by a human";
  return "";
}
// Applies botViolation to a decrypted journal; returns { lines, rejected }.
function enforceBotRules(lines) {
  const entries = lines.map(l => ({ l, e: parse(l) }));
  // Versions per id in rev order.
  const byId = new Map();
  for (const x of entries) if (x.e && x.e.id) (byId.get(x.e.id) || byId.set(x.e.id, []).get(x.e.id)).push(x);
  const bad = new Set(), rejected = [];
  for (const versions of byId.values()) {
    versions.sort((a, b) => a.e.rev.localeCompare(b.e.rev));
    let prev = null;
    for (const x of versions) {
      const why = botViolation(x.e, prev);
      if (why) { bad.add(x); rejected.push({ line: x.l, reason: why }); continue; }
      prev = x.e;
    }
  }
  return { lines: entries.filter(x => !bad.has(x)).map(x => x.l), rejected };
}

// ---------------------------------------------------------------------------
// Calendar files (iCalendar, RFC 5545): import and export (spec 4.10d, 8.13)
// ---------------------------------------------------------------------------

const pad2 = n => String(n).padStart(2, "0");
const isoOf = d => d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
const hmOf = d => pad2(d.getHours()) + ":" + pad2(d.getMinutes());

// Offset of a time zone at an instant, in ms (Intl; throws for unknown zones).
function tzOffset(ms, tz) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
    .formatToParts(new Date(ms)).map(p => [p.type, p.value]));
  return Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute, +parts.second) - ms;
}
// An iCalendar date or date-time value -> { date, time } in local time; time is null for dates.
function icsTime(value, params) {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(value.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi, sec, z] = m;
  if (h === undefined || /VALUE=DATE(?!-)/i.test(params)) return { date: `${y}-${mo}-${d}`, time: null };
  let ms;
  const tz = (/TZID=("?)([^;:"]+)\1/i.exec(params) || [])[2];
  if (z) ms = Date.UTC(+y, +mo - 1, +d, +h, +mi, +(sec || 0));
  else if (tz) {
    try {
      const guess = Date.UTC(+y, +mo - 1, +d, +h, +mi, +(sec || 0));
      ms = guess - tzOffset(guess, tz);
      ms = guess - tzOffset(ms, tz);
    } catch { ms = null; } // unknown zone name (e.g. Windows names): read as local time
  }
  const local = ms != null ? new Date(ms) : new Date(+y, +mo - 1, +d, +h, +mi, +(sec || 0));
  return { date: isoOf(local), time: hmOf(local) };
}
const icsText = v => v.replace(/\\n/gi, " ").replace(/\\([,;\\])/g, "$1").trim();
const icsLong = v => v.replace(/\\n/gi, "\n").replace(/\\([,;\\])/g, "$1").trim(); // keeps line breaks (notes)

// Parses one or more calendars into events.
function parseICS(text) {
  const lines = text.replace(/\r\n|\r/g, "\n").replace(/\n[ \t]/g, "").split("\n");
  const events = [];
  let ev = null, depth = 0;
  for (const line of lines) {
    if (/^BEGIN:VEVENT$/i.test(line)) { ev = { props: {} }; depth = 0; continue; }
    if (!ev) continue;
    if (/^BEGIN:/i.test(line)) { depth++; continue; } // VALARM and others inside the event
    if (/^END:/i.test(line) && depth) { depth--; continue; }
    if (/^END:VEVENT$/i.test(line)) { events.push(ev); ev = null; continue; }
    if (depth) continue;
    const c = line.indexOf(":");
    if (c < 0) continue;
    const head = line.slice(0, c), value = line.slice(c + 1);
    const semi = head.indexOf(";");
    const name = (semi < 0 ? head : head.slice(0, semi)).toUpperCase(), params = semi < 0 ? "" : head.slice(semi + 1);
    if (name === "EXDATE") { (ev.exdates = ev.exdates || []).push(...value.split(",").map(v => (icsTime(v, params) || {}).date).filter(Boolean)); continue; }
    if (!(name in ev.props)) ev.props[name] = { value, params };
  }
  return events.map(({ props: p, exdates }) => {
    const get1 = n => p[n] ? p[n].value : "";
    const start = p.DTSTART ? icsTime(p.DTSTART.value, p.DTSTART.params) : null;
    let end = p.DTEND ? icsTime(p.DTEND.value, p.DTEND.params) : null;
    if (!end && start && p.DURATION) {
      const m = /^P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?/.exec(p.DURATION.value) || [];
      const mins = ((+m[1] || 0) * 7 * 1440) + ((+m[2] || 0) * 1440) + ((+m[3] || 0) * 60) + (+m[4] || 0);
      if (start.time) {
        const d = new Date(start.date + "T" + start.time + ":00"); d.setMinutes(d.getMinutes() + mins);
        end = { date: isoOf(d), time: hmOf(d) };
      } else end = { date: addDays(start.date, Math.max(1, Math.round(mins / 1440))), time: null };
    }
    const rrule = {};
    for (const kv of get1("RRULE").split(";")) { const [k, v] = kv.split("="); if (k && v) rrule[k.toUpperCase()] = v.toUpperCase(); }
    return {
      uid: get1("UID"), rid: get1("RECURRENCE-ID"),
      summary: icsText(get1("SUMMARY")), location: icsText(get1("LOCATION")), description: icsLong(get1("DESCRIPTION")),
      start, end, rrule: get1("RRULE") ? rrule : null,
      cancelled: /CANCELLED/i.test(get1("STATUS")),
      exdates: exdates || [],
    };
  }).map((ev, i, all) => {
    // A changed or cancelled occurrence (RECURRENCE-ID) is an exception of its series: the
    // series skips that day, and a changed occurrence becomes an entry of its own.
    if (!ev.rid && ev.rrule) {
      for (const o of all) if (o.rid && o.uid === ev.uid) { const r = icsTime(o.rid, ""); if (r && r.date) ev.exdates.push(r.date); }
    }
    return ev;
  });
}

const BYDAY = { MO: "mon", TU: "tue", WE: "wed", TH: "thu", FR: "fri", SA: "sat", SU: "sun" };
// An RRULE -> a #recurring pattern, or null when the grammar cannot express it exactly.
function rruleToPattern(r, anchor) {
  if (r.COUNT || r.BYSETPOS) return null;
  // Every second week on the anchor's weekday is the only interval the grammar knows.
  if (r.INTERVAL === "2" && r.FREQ === "WEEKLY")
    return !r.BYDAY || r.BYDAY === Object.keys(BYDAY).find(k => BYDAY[k] === WD[new Date(anchor + "T12:00:00").getDay()]) ? "biweekly" : null;
  if (r.INTERVAL && r.INTERVAL !== "1") return null;
  if (r.FREQ === "DAILY" && !r.BYDAY) return "daily";
  if (r.FREQ === "WEEKLY" || (r.FREQ === "DAILY" && r.BYDAY)) {
    if (!r.BYDAY) return "weekly";
    const days = r.BYDAY.split(",").map(d => BYDAY[d]);
    if (days.some(d => !d)) return null;
    const order = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const sorted = order.filter(d => days.includes(d));
    return sorted.length === 1 && sorted[0] === WD[new Date(anchor + "T12:00:00").getDay()] ? "weekly" : sorted.join("-");
  }
  if (r.FREQ === "MONTHLY" && !r.BYDAY) {
    if (!r.BYMONTHDAY) return "monthly";
    const ds = r.BYMONTHDAY.split(",").map(Number);
    if (ds.some(d => !(d >= 1 && d <= 31))) return null;
    return "monthly-" + ds.sort((a, b) => a - b).join("-");
  }
  if (r.FREQ === "YEARLY" && !r.BYDAY && !r.BYMONTH?.includes(",")) return "yearly";
  return null;
}

// First 10 hex characters of SHA-256(UID + "|" + RECURRENCE-ID): the #cal tag that
// lets a later import of the same event update the entry instead of adding another.
async function calHash(uid, rid) {
  return hex(await crypto.subtle.digest("SHA-256", TE.encode(uid + "|" + (rid || "")))).slice(0, 10);
}

// One event -> { line, cal, skip, note }. `skip` gives the reason when it is not imported.
async function icsEventToLine(ev, t0) {
  if (ev.cancelled) return { skip: "cancelled" };
  // A changed occurrence of a series is imported as an entry of its own (its series skips the day).
  if (!ev.start || !ev.summary) return { skip: "no date or title" };
  let pattern = null, note = "", until = null;
  if (ev.rrule) {
    until = ev.rrule.UNTIL ? icsTime(ev.rrule.UNTIL, "") : null;
    if (until && until.date < t0) return { skip: "series ended" };
    pattern = rruleToPattern(ev.rrule, ev.start.date);
    if (!pattern) note = "repetition not supported; imported once";
  }
  const s = ev.start, e = ev.end;
  let endDate = e ? (e.time ? e.date : addDays(e.date, -1)) : s.date; // DTEND of whole days is exclusive
  if (endDate < s.date) endDate = s.date;
  if (!pattern && endDate < t0) return { skip: "in the past" };
  // Words starting with # would be read as tags; they keep a full-width sign.
  const text = (ev.summary + (ev.location ? " (" + ev.location + ")" : "")).replace(/(^|\s)#/g, "$1＃");
  const tags = ["#date-" + s.date];
  if (endDate > s.date && !pattern) tags.push("#date-" + endDate);
  // A recurring event: several days per occurrence, or a series that ends (architecture 4.4a).
  let intent = null;
  if (pattern && endDate > s.date) { tags.push("#date-" + endDate); intent = "occurrence"; if (until) note = "the end of the series cannot be kept together with occurrences over several days"; }
  else if (pattern && until) { tags.push("#date-" + until.date); intent = "series"; }
  if (s.time) tags.push("#time-" + s.time + (e && e.time && e.date === s.date && e.time > s.time ? "-" + e.time : ""));
  if (pattern) tags.push("#recurring-" + pattern);
  if (pattern) for (const x of [...new Set(ev.exdates || [])].sort()) if (x >= t0) tags.push("#skip-" + x);
  if (intent && recurrenceMode(parse("x " + tags.join(" "))) !== intent) {
    // The two dates would be read the other way; keep the start only and ask for review.
    tags.splice(1, 1);
    note = note || (intent === "series" ? "end of series too close to its start; not kept" : "occurrence too long for its repetition; imported for one day");
  }
  if (note) tags.push("#review-needed");
  const cal = await calHash(ev.uid || ev.summary + s.date, ev.rid || "");
  tags.push("#cal-" + cal);
  // The description becomes the entry's note (at most NOTE_MAX characters).
  const desc = (ev.description || "").trim().slice(0, NOTE_MAX);
  return { line: normalizeSpace(text) + (desc ? " {{" + encodeNote(desc) + "}}" : "") + " " + tags.join(" "), cal, note };
}

const icsEsc = v => v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const icsDate = iso => iso.replace(/-/g, "");
const icsUTC = (iso, hm) => new Date(iso + "T" + hm + ":00").toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
// Lines of 75 octets at most (RFC 5545 3.1); continuation lines start with a space.
function icsFold(line) {
  const out = []; let cur = "", n = 0;
  for (const ch of line) {
    const b = TE.encode(ch).length;
    if (n + b > (out.length ? 74 : 75)) { out.push(cur); cur = ""; n = 0; }
    cur += ch; n += b;
  }
  out.push(cur);
  return out.join("\r\n ");
}
function patternToRRule(p) {
  if (p === "biweekly") return "FREQ=WEEKLY;INTERVAL=2";
  if (["daily", "weekly", "monthly", "yearly"].includes(p)) return "FREQ=" + p.toUpperCase();
  if (p.startsWith("monthly-")) return "FREQ=MONTHLY;BYMONTHDAY=" + p.split("-").slice(1).join(",");
  const inv = Object.fromEntries(Object.entries(BYDAY).map(([k, v]) => [v, k]));
  return "FREQ=WEEKLY;BYDAY=" + p.split("-").map(d => inv[d]).join(",");
}
// Entries -> one calendar. Whole-day events for entries without a clock time.
function entriesToICS(entries, name, now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const out = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//outheis-labs//outheis-agenda//EN", "CALSCALE:GREGORIAN"];
  if (name) out.push("X-WR-CALNAME:" + icsEsc(name));
  for (const e of entries) {
    const dates = e.tags.filter(t => t.dim === "date").map(t => t.val).sort();
    if (!dates.length) continue;
    const time = get(e, "time"), m = /^(\d\d:\d\d)(?:-(\d\d:\d\d))?$/.exec(time);
    const pat = get(e, "recurring"), mode = recurrenceMode(e);
    // A bounded series starts on its first occurrence and ends on the same day; otherwise
    // the event runs from the first to the last date (architecture 4.4a).
    const first = mode === "series" ? (firstOn(dates[0], pat, dates[0]) || dates[0]) : dates[0];
    const last = mode === "series" ? first : dates[dates.length - 1];
    out.push("BEGIN:VEVENT", "UID:" + (e.id || hex(TE.encode(contentKey(e))).slice(0, 32)) + "@outheis-agenda", "DTSTAMP:" + stamp);
    if (m) {
      out.push("DTSTART:" + icsUTC(first, m[1]));
      if (m[2]) out.push("DTEND:" + icsUTC(last, m[2]));
    } else {
      out.push("DTSTART;VALUE=DATE:" + icsDate(first), "DTEND;VALUE=DATE:" + icsDate(addDays(last, 1)));
    }
    if (pat) out.push("RRULE:" + patternToRRule(pat) + (mode === "series" ? ";UNTIL=" + (m ? icsUTC(dates[1], "23:59") : icsDate(dates[1])) : ""));
    if (pat) for (const x of e.tags.filter(t => t.dim === "skip").map(t => t.val).sort()) out.push(m ? "EXDATE:" + icsUTC(x, m[1]) : "EXDATE;VALUE=DATE:" + icsDate(x));
    out.push("SUMMARY:" + icsEsc(e.text));
    if (e.note) out.push("DESCRIPTION:" + icsEsc(e.note));
    const cats = e.tags.filter(t => (t.dim === "facet" || t.dim === "topic") && t.val).map(t => t.val);
    if (cats.length) out.push("CATEGORIES:" + cats.map(icsEsc).join(","));
    out.push("END:VEVENT");
  }
  out.push("END:VCALENDAR");
  return out.map(icsFold).join("\r\n") + "\r\n";
}

export {
  BIP39, BIP39_SET, DIM_ORDER, DIM_RANK, LIST_MARKERS, normalizeSpace, normSnowflake, NOTE_MAX, encodeNote, decodeNote, parse, get, has, contentKey, toLine, addTag,
  EPOCH, makeSnow, snowTime, today, parseLines, currentOf, sortKey,
  validDate, checkTag, validate, TAG_MAX, facetsOf, DEF_RE, PRIVATE_RE, COMMENT_RE, NAME_RE, VOCAB, RE_FACET, RE_TOPIC, RE_TIME,
  TE, TD, b64, unb64, hex, PHRASE_WORDS, PAD, MAX_LINE, NONCE, GCM_TAG,
  normPhrase, phraseProblem, newPhrase, accountId, deriveKeys, memberId,
  deriveKeysV2, allyCodeOf, keysFromAllyCode, guestCodeOf, keysFromGuestCode, handoverCodeOf, parseHandoverCode, codeKind, acctOf, authHeaders, deleteHeaders, canWrite, canReplace, replaceHeaders, KEY_V2, importEncKey, encryptWith, decryptWith, decryptFileWith,
  addDays, addMonths, nextMonday, firstOfNextMonth, dayDiff, WD, nextOccurrence, shownDate, occurrences, recurrenceMode, recurrenceDoubt,
  journalNameOf, declaredFacetsOf, learnedRulesOf, sourceOf, botViolation, enforceBotRules,
  bindingOf, isMemo, isMeta, FAR_DATE, migrateLine, passesSilently, tzOffset, icsTime, parseICS, rruleToPattern, calHash, icsEventToLine, entriesToICS, patternToRRule,
};
