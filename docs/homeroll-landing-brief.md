# homeroll.app — landing page brief

**Problem being solved:** the root domain isn't a landing page. `/` renders the authenticated library, which client-side-redirects a logged-out visitor to `/login` — so a stranger gets a spinner, then a URL change, then a form for a product they've never heard of. This has already cost one warm lead in person, on a phone.

**The half of the problem that isn't copy:** the SPA is 561 KB gzipped in one chunk with no route splitting, and it parses the full GraphQL SDL at module scope on every load. Nothing paints until all of that lands. On party wifi the warm lead spent several seconds watching nothing before he got to the wrong content. Rewriting the words does not fix that, which is why the landing page is a static document rather than a screen in the app.

**Constraint that reframes the whole page:** guest-link recipients never see this page — they land on an album URL. So the root domain has exactly two audiences: strangers who just heard about it, and returning users. Today it serves only the second.

---

## 0. What the reference sites actually say on the first screen

| Site                  | First screen, verbatim-ish                                                                                                                                          | Does it tell you what it is?                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **are.na**            | "Are.na is / 1. Online software for saving and organizing the content that is important to you / 2. A toolkit for assembling new worlds from the scraps of the old" | **Yes.** Line one, no scroll.                                                                                     |
| **hey.com**           | "We finally fixed your email + calendar!" then "Gmail, Outlook, and Apple got complacent and took their eye off the ball. Then along came HEY."                     | Only because you already know what email is. Names the incumbent in the subhead — that's the move worth stealing. |
| **standardnotes.com** | "Free your mind." then a run-on subhead listing free, secure, note-taking, end-to-end encryption, unparalleled privacy, cross-platform sync, unlimited devices      | Buried. The headline is a sentiment; the subhead is a spec sheet doing all the work.                              |
| **family-album.com**  | "Cherish Every Moment" then "The free, all-in-one resource to securely share your family's photos and videos." Then two app-store buttons.                          | Buried, and the headline is a greeting card.                                                                      |

**The read:** three of four hide the definition behind a mood. Only are.na puts it in the first sentence, using the "Are.na is ___" construction to force itself to be literal.

You have to do what are.na does, because nobody knows what "homeroll" is. The competitors get to be vague — Standard Notes can say "Free your mind" because "notes app" is in the page title, and HEY can be cocky because it has a decade of reputation and 150k newsletter subscribers. You have one tester and a guy at a party. Plain beats clever here, and it isn't a compromise — plain _is_ the voice you want.

**On family-album's smarm, specifically:** the tell isn't the warmth, it's that the warmth is unearned and generic. "Cherish Every Moment" could be printed on a picture frame at Target. The site also leads with _free_, _unlimited_, and _11 free prints every month_ — which tells you the product is a funnel for prints and premium, and that it's owned by a company (MIXI) whose business is not you. The warmth you actually want is the specificity underneath it: one album, eight people, the trip you actually took. Concrete is warm. Sentimental is smarm.

**Best sentence on any of the four**, and your model for the privacy copy: Standard Notes' _"Note-taking services like Evernote, Google Keep, Notion, and Simplenote cannot prevent employers and governments from reading your data."_ Specific, checkable, zero indignation. It doesn't call anyone evil. It states a fact and lets you do the math.

---

## 1. Headline

**Recommended: "Shared photo albums that stay private."**

Alternates, tradeoff in the label:

- **A — "Shared photo albums that stay private."** — _shortest, holds the entire product tension; abstract, doesn't name family or contributors._
- **B — "A private photo album everyone on the trip can add to."** — _most concrete, carries the origin story and contributor uploads; narrows the product to trips._
- **C — "Private photo albums for your family, not for Google's."** — _sharpest positioning, does the competitive work in the headline; leads with the enemy and lets the negative dominate — exactly what you flagged._
- **D — "Your photos, shared with the people in them."** — _warmest, most human; vaguest — could describe Instagram._

**Reasoning**

**A** works because _shared_ and _private_ are normally opposites, and the entire product is the resolution of that contradiction. A stranger reading it has one question — "how?" — which is what the subhead and the rest of the page answer. It's also the only option that stays true across all three of your origin motivations (trip album, cross-platform, parents avoiding social media) without picking one.

**B** is the strongest option if you want concrete over abstract, and "everyone on the trip can add to" is the feature nobody else's headline mentions. The cost is that a parent who wants grandma to see baby photos doesn't see themselves in "the trip." You could soften it to "…everyone who was there can add to," which broadens it slightly and reads better, but "there" still implies a past event.

**C** is the one you flagged the danger on, and the danger is real. Put it at the top and the page becomes an argument. Every section after it gets read as ammunition rather than description, and you end up sounding like you're mad at Google instead of like you built something. The phrase is a knife — it's much sharper below the fold, after the reader already likes the thing. Keep it, move it.

**D** is the family-album trap wearing better clothes. It's pleasant and it doesn't commit to anything.

**Deciding factor: is your traffic warm or cold, and that's your knowledge, not mine.** Warm traffic (someone you just talked to, pulling it up on their phone) needs the headline to _confirm_ — they already have the pitch, the page just has to not confuse them. That's **A** or **B**. Cold traffic that arrived with no context needs the privacy hook up front to have any reason to care. That's **C**. Right now your traffic is 100% warm — a guy at a party is the entire reason this document exists. Design for that. Revisit if you ever have search traffic.

**Wordmark note:** "homeroll" appears above the headline as the wordmark. Don't explain the name anywhere on the page.

---

## 2. Subhead

**Recommended:**

> Like a Google Photos album, except nothing in it gets scanned, profiled, or used to train anything.

_("Indexed" was the original middle verb and it's ambiguous — photo rows are of course indexed in Postgres, and a technical reader will notice the gap between what the word says and what it means. "Profiled" says the actual thing, in a word a non-technical reader also understands. Cheapest correctness fix on the page.)_

**Why this shape:** it names the incumbent (hey.com's move), it borrows Google's own product as the explanation of what yours does — which saves you a paragraph — and it states the difference as facts about _your_ product rather than accusations about theirs. That's the difference between positioning and preaching. You never say Google is bad; you say what doesn't happen here, and the reader draws the line themselves.

**Alternates:**

- "It does what a Google Photos album does. It just doesn't do anything else with your photos." — _quieter, more confident, slightly oblique._
- "Google Photos can do albums too. Homeroll doesn't do anything else with them." — _most restrained; may be too subtle for a first-time reader._

**Where "not training data" goes:** it is the header of the privacy section below the fold, stated once, in the same type size as the other section headers — no red, no bold, no icon, no repetition. Understatement is what makes it land. It's also the right line for the OG/social share card, where it does the cold-traffic work that you've deliberately kept off the first screen.

---

## 3. Above the fold (mobile first — this is the design, desktop is a reflow of it)

Order, top to bottom:

1. **Wordmark** `homeroll`, top-left, small. Not a logo lockup. Type is fine.
2. **Log in** — top-right, plain text link, not a button. Small. This is the whole fix: findable in the corner, not the door.
3. **Headline** — the largest thing on the screen. Must not wrap past three lines at 375px. Test at 320px.
4. **Subhead** — one sentence, body size, generous line height.
5. **Primary action** — full-width or near it, in thumb reach. _Must be above the fold._ If the image threatens it, the image loses.
6. **Micro-line under the button** — see below.
7. **Image** — starts here and gets cut by the fold. That's correct; a partially visible image is the best scroll cue you have.

**Primary action — decided: self-serve signup. The product is public, ungated, and works.**

Label: **"Create your first album."** "Sign up" and "Get started" both describe work the reader has to do; "create your first album" describes the thing they came for. If it reads too long next to the headline at 320px, "Start an album" is the shorter version that keeps the outcome framing. Use "Get started" only if you specifically want the plainest possible button — it's the default SaaS label, which is safe and slightly anonymous.

**Cut, now that gating is off the table:** the email-capture / "Get an invite" variant. Don't invite-gate a product that's actually open — from an unknown domain it reads as manufactured scarcity, which is the one flavor of dishonesty this page can't afford.

**Pruned: "Learn more."** A Learn More button above the fold is an admission the headline didn't work. The whole page is learn more.

**Secondary action:** a text link under the primary — "See how it works ↓". Text, not a button. It should lose to the primary.

**Micro-line under the button** — one short line, small, low contrast. Pick one:

- "No ads. No tracking. No feed."
- "Free while it's small." _(only if true, and it commits you to being honest later)_
- Nothing at all. Also fine.

**The image.** Options in order of preference:

- **Real photographs, presented as photographs.** Three or four overlapping shots — a trip, a kid, a table with people at it — arranged like prints someone laid out. No phone frame, no browser chrome, no UI. It communicates "photos of people you know" without showing the product, and it's the honest version of the app screenshot you're not allowed to use.
- **One full-bleed photo.** Quiet, specific, real. Somebody's actual vacation, not a composition.
- **No image at all.** are.na does this. Type on a background, enormous confidence, zero risk, zero cost. This is a genuinely defensible option for a solo build and you should not treat it as the fallback.

**Hard constraint on the image:** it must be real photos of real people who said yes. Not stock. A page arguing that your family isn't a data source cannot be illustrated with a purchased photograph of a family being used as a data source. If you can't get permission from anyone, take option three.

**Build note:** if a session cookie exists, redirect the root to the app. The marketing page is for logged-out visitors only. Nobody who already uses it should ever see this page again.

---

## 4. Below the fold

Four sections. Each is a header and one paragraph. No icons, no columns, no cards — a single column of text with air between the sections. Copy is written to be used as-is; edit for accuracy where noted.

### Section 1 — What it is

**One album. Everyone who was there.**

You make an album and invite the people it's about. They add their own photos to the same album, so the trip doesn't end up scattered across six phones, two group chats, and one AirDrop that didn't work. Everybody sees the whole thing. It doesn't matter who's on an iPhone and who isn't, and the people you share with don't need an account to look — they get a link that just works. If they decide they want an account later, everything they already have stays exactly where it is.

_(This paragraph carries three of your four product textures: contributor uploads, cross-platform, guest access with upgrade path. It earns its length.)_

### Section 2 — What it isn't

**Your family is not training data.**

Homeroll isn't a social network. No feed, no strangers, no algorithm deciding who your kids get shown to. No ads, no follower count, nothing that can go viral. Your photos aren't scanned to build a profile of you, aren't sold to anyone, and aren't used to train a model — not mine, not anybody else's. There is nothing clever happening to your pictures in the background. They're just your pictures.

_(Sentence two is lifted verbatim from the existing `LoggedOutScreen` copy. It's sharper than what I wrote — "who your kids get shown to" names the actual fear where "what you see" only gestures at it — and it's already in the welcome email, so it's load-bearing product voice rather than landing copy. Keep it consistent across both.)_

_(Say the training-data line here, once, and then never again anywhere on the page. Repetition is what turns a position into a rant.)_

### Section 3 — Who it's for

**Who this is for**

Parents who want their kids' grandparents to see the photos but don't want their kids on Facebook. Families split across the wrong mix of phones, where half the album shows up sideways and blurry. The eight people who went on the trip, who each have a different forty photos of it. Anyone who's tired of firing two hundred pictures into a group chat where they get crushed to mush and buried by Tuesday.

_(All four sentences are concrete. This is where the warmth lives — not in adjectives, in recognizing someone's actual Tuesday.)_

### Section 4 — How privacy actually works

**How this actually works**

Albums are private by default. There's no public gallery, no discovery, and no way to browse anyone else's photos — you see an album because a specific person sent it to you, and you can stop sharing it whenever you want. Nothing gets scanned to sort it, tag it, or figure out who's in it. And I'm not selling anything on the side, which means there's no version of this where your photos quietly become the product: it costs money to store them, so eventually it'll cost money to store them, and that'll be the whole business model.

**Edit for accuracy before shipping. Build the page first, verify second — but the build must make the second step impossible to forget:**

- Adjust the last sentence to whatever's actually true about free tier vs. paid. Don't promise free forever.
- **Do not claim end-to-end encryption unless it is literally true.** Your server processes images. If someone technical checks and finds "end-to-end" was doing marketing work rather than describing a system, the entire page loses credibility retroactively — this is the single highest-cost mistake available on this page. If you want to say something true and strong instead: encrypted in transit and at rest, no human at Homeroll browsing your albums, no third-party analytics on the photo surfaces. Say exactly what you do.
- **Required build deliverable: `CLAIMS.md`.** Every factual assertion the page makes about privacy, data handling, and business model, extracted into a checklist with an unchecked box and the exact line of copy it came from. Two purposes: it's the pre-ship gate, and it doubles as a to-do list — some of these are claims you'll want to make true rather than soften. Anything still unchecked at ship time gets cut from the page, not shipped with fingers crossed.

### Optional fifth section — strongly recommended

**Who made this**

I'm one person. I've been building Homeroll for [DURATION], mostly because I wanted a way to share photos with my own family that didn't involve handing them to a company that wants something from them. There's no investor waiting on a return, no growth target, and no acquisition that ends with your albums somewhere you didn't pick. [EXPORT SENTENCE — see below.]

**Two unverified claims in this paragraph. Both have to resolve before ship:**

- **`[DURATION]`.** Git history starts 2026-02-23, which is about six and a half months, not "about a year." Check whether there's earlier history under the betaname name; if there isn't, use the true number. Six months stated precisely is _stronger_ than a year stated loosely — specific is the entire voice of this page, and an overstated duration is the worst possible error on a page whose argument is "check what I'm telling you." The duration is also optional. "I'm one person" is the claim; the timespan is decoration, and cutting it removes something you'd have to keep accurate forever.
- **`[EXPORT SENTENCE]`.** The draft was: _"If I ever can't keep running it, I'll tell you, and I'll give you a way to take everything with you."_ There is currently no export, download-all, or archive operation anywhere — individual originals are reachable one at a time and that's it. The brief's own rule applies: mean it or cut it. Cut it from the page now and restore it when export exists. It's worth building regardless — data portability is load-bearing for this positioning, and it's the one promise here that costs a competitor real money to match.

**Why this section is worth more than any feature paragraph:** for a privacy product from an unknown domain, the reader's real question isn't "what does it do," it's "who are you and what do you want from me." Standard Notes answers this with three numbers — 100% revenue from paying users, $0 in venture capital, 10 years in service. are.na answers it with one sentence: their only business is being worth paying for, and the people who use it are their only customers. You can't claim ten years, but "one person, no investors, a year of work, and here's my exit plan if it dies" is a stronger answer than either, because it's the kind of thing a company literally cannot say.

**Only ship the last sentence if you mean it** — it commits you to an export path.

---

## 5. Voice

**First person singular, and never plural.** "I built this," "I'm not selling anything." One person is the credibility here, not something to hide behind a "we." Every "we" on this page is a small lie that costs you the thing that makes you different from Google Photos.

**Say each thing once, flatly, and move on.** Confidence reads as not repeating yourself. Steal are.na's register: _"Our only business is to make Are.na an experience that is worth paying for."_ No adjectives, no intensifiers, no exclamation point. Steal Standard Notes' competitor sentence for the privacy copy: specific, checkable, unbothered. Steal hey.com's willingness to name Gmail out loud, at about half the volume — hey has earned cocky and you haven't, but you've both earned direct.

**Never write a sentence family-album would write.** The test: if a phrase would fit on a picture frame at Target, cut it. "Cherish every moment," "capture the memories," "bringing families closer together" — all disqualified. The warmth comes from specificity: _the eight people who went on the trip_, _crushed to mush and buried by Tuesday_. Concrete is warm. Sentimental is smarm. That's the dose of family-album you want, without the thing you hate about it.

---

## 6. Visual register

**The problem this section solves:** the copy is deliberately low-marketing, but the page still has to have some heat in it. Those two things sound like they're in tension and they aren't — the tension is only there if you assume "pop" has to come from marketing devices.

**Diagnosis first: the formality is visual, not verbal.** A login form is a bureaucratic object; you brace when you see one, the way you do at a counter with a clipboard. Put that on top of the default clean-web-page register — neutral grotesk, grey body text, one blue button, everything centered, lots of even air — and the result reads _institutional_, because neutral has nowhere else to land when there's no warmth anywhere in the frame. Deleting the login form fixes about half of this before a single visual decision gets made.

**The rule that makes low-marketing and high-pop compatible: pop comes from the material, not the packaging.** Gradients, badges, glow, animated counters, confetti — packaging, and packaging is exactly the marketing smell to avoid. Photographs, type, color, handwriting — material. Material can be as loud as you want and it never reads as marketing, because it _is_ the thing rather than an advertisement for the thing.

### The levers, in order of impact

**1. Photographs, bad on purpose. This is the whole answer and everything else is support.**

Every competitor in this category illustrates with photographs that were art-directed — lit, styled, a family that does not exist. You are the only product here that can put up a picture where somebody's blinking, the food is half-eaten, the horizon is crooked, and there's a thumb in the corner. Direct flash is fine. A kid mid-tantrum is better than a kid smiling.

That isn't a compromise on production value. The contrast _is_ the thesis, rendered visually, before anyone reads a word — and no competitor can copy it without abandoning their own positioning. It's loud, it's warm, and it is structurally impossible to mistake for an insurance ad.

**Sourcing is a hard gate.** Real photos, real people, explicit permission. If you can't get permission from anyone, the fallback is **type only, no images at all** — the are.na route, which is a genuinely good page. The fallback is _not_ stock. There is no version of this page where purchased photographs of a fake family sit above a paragraph about your family not being a data source.

**2. Scale contrast.** Headline enormous — think 40–56px at 375px — and let it be the only large thing on the screen. Everything else stays small, quiet, and close together. This is free, it takes an hour, and it's the fastest available fix for institutional feel, because institutional design is _medium everything_. One loud element and a lot of quiet ones reads as a person making a choice. Uniform sizing reads as a template.

**3. One committed color — and it already exists.** Clay `#AA5C39`, the app's accent, on the primary button and link underlines and nowhere else. My original advice here was to pull the accent out of the hero photograph; that was written not knowing the product already had a warm terracotta accent one click away on `/login`. Inventing a second one would put the landing page and the login page in visible disagreement for no gain. Clay already satisfies what that advice was actually for — one color, not a palette, not SaaS blue, warm. **Invert the dependency: choose hero photographs that sit well against clay,** rather than choosing a color from the photographs.

Background is `#FAFAF7` — already the app's paper white, already warm, no new token needed. Single light theme, no dark mode, no toggle. That part of the brief is satisfied by what's built.

**4. Type with a face — using what's already loaded.** The app ships zero web fonts; every stack is system-local, which means the page currently makes no font network request at all. Don't spend that. The existing serif stack (`Iowan Old Style, Charter, Hoefler Text, Cambria, Georgia`) set at 48px is genuinely characterful — Iowan and Georgia are both warm, high-contrast, and nothing like a SaaS grotesque. Headline in the serif, body in the system sans at 17–18px, and no `@font-face` anywhere.

The existing type scale tops out at 32px, so a marketing-only step above that has to be added. That's the one new token this page needs. Don't set the whole page in one display face — that's the art-directed trap, and it's the failure mode most likely to look designed-at rather than made-by.

**5. Photos rotated one to three degrees, overlapping slightly.** Prints laid out on a table. Past 3° it's a gimmick and it starts performing casualness instead of being casual. Zero rotation gives you a grid, and a grid is a spreadsheet.

**6. Your handwriting, exactly once.** Best placement is a signature under the "Who made this" section — that's the one part of the page where a human being is the actual point. The wordmark is the weaker option. Once is warmth; twice is a theme, and a theme is packaging.

### Banned as packaging

Gradients, glassmorphism, animated counters, scroll-triggered reveals, parallax, illustration, mascots, badges, glow, drop shadows doing emotional work, and anything that moves without being asked to.

### The mechanism, for whoever builds this

**Casual is not the opposite of formal. Specific is.** Generic is what reads formal — including generic _warmth_, which is precisely why family-album feels smarmy rather than friendly. A stock family is formal. Somebody's kid with a popsicle down their shirt is not.

Every decision on this page resolves toward the more specific option. When two choices look equally good, take the one that could only have come from this particular person shipping this particular thing.

**Test for whether it's working:** screenshot the first screen and ask whether it could be swapped onto any other product's site with a wordmark change. If yes, it's still packaging.

---

## 7. What not to do

**Visual**

- **No app screenshots.** Photos behind phone chrome look worse than photos. You're selling the pictures, so show pictures.
- **No stock families.** Insurance-ad energy, and self-refuting on this page specifically.
- **No feature grid.** Three icons in a row with eight-word captions is the shape of a page with nothing to say. You have a four-paragraph argument; let it be paragraphs.
- **No carousels.** A grandparent will not swipe.

**Claims**

- **No testimonials.** You have one real user and he's your brother. A fabricated or over-framed quote is the single fastest way to lose a reader who came here _because_ they're suspicious of companies.
- **No "trusted by 10,000 families," no user counts, no logo wall, no press strip.** Zero social proof beats fake social proof, and the "Who made this" section is your honest substitute.
- **No awards, no badges.** family-album has four award logos on its homepage and they make it look like it's trying.
- **No "end-to-end encrypted"** unless it's true down to the architecture. See Section 4.
- **No "free forever," no "unlimited."** Both are checks a solo dev's S3 bill will eventually have to cash.
- **No app-store badges** if this is a web app. They imply an install step that doesn't exist, and a badge with a broken promise behind it is worse than no badge.

**Structure and behavior**

- **Don't repeat "not training data."** Once, in one section header. A knife used four times is a butter knife.
- **No cookie banner, and nothing on the page that would require one.** A privacy pitch with a consent modal in front of it refutes itself before the reader gets to the headline. If you want traffic numbers, use something server-side that doesn't set cookies.
- **No newsletter capture, no chat widget, no exit-intent modal, no scroll-triggered anything.**
- **Don't put the login form on the page.** A text link in the corner. That's the entire bug you're fixing.
- **Don't explain the name.** "Homeroll" does not need a paragraph, and explaining a name reads as apologizing for it.
- **No AI anything.** Obviously, but worth writing down given the current default.

---

## 8. Mobile-first

**Design at 375px wide. Check at 320px. Desktop is this layout with more margin and a max content width around 640–720px — not a redesign, and not a two-column rework.**

- **First screen budget: roughly 600px of vertical space.** Wordmark, headline, subhead, button, and micro-line all have to fit. Nothing else is entitled to that space. If the headline wraps to four lines at 320px, shorten the headline — don't shrink the type.
- **The button lives in the lower-thumb zone,** not at the top of a long scroll. Full-width or close to it, 48px minimum height.
- **Body copy at 17–18px with loose line height.** The audience includes grandparents. Small grey text on a light background is the default failure mode of design-conscious sites and it's disqualifying for this one.
- **One column, everywhere, at every width.** No two-up, no side-by-side, no reflowing grids.
- **No hover-dependent behavior.** Anything only reachable by hover doesn't exist on a phone.
- **Watch the weight.** This page's images are photographs, which means it will be heavy unless you're deliberate. Your warm lead is on party wifi with two bars. Responsive sizes, lazy-load anything below the first screen, and set an actual budget — the first screen should be usable well under a second on 4G.
- **Log in must be tappable at the top,** and repeated as plain text in the footer — "Already have an account? Log in." The grandparent who was sent a link and got lost will scroll to the bottom before they'll look in a corner.

**Acceptance test, and it's the only one that matters:** pull the page up on a phone, hand it to somebody who's never heard of Homeroll, and ask what it does. If they can't tell you in one sentence, the headline is wrong. Run this specifically against the failure that started this — the guy at the party — and if you can, go find him and hand him the phone.
7
