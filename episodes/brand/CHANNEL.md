# शास्त्र कथा · Shastra Katha

Copy-paste for YouTube setup. Art renders from `episodes/brand/episode.js`.

---

## Identity

| field | value |
|---|---|
| Channel name | **शास्त्र कथा \| Shastra Katha** |
| Handle | **@shastrakatha** — free as of the check; confirm in YouTube's own picker |
| Avatar | `out/brand/logo.png` (800×800) — solemn Surya. `face: 'none'` in `episodes/brand/episode.js` swaps to the faceless mandala (`logo-faceless.png`) |
| Banner | `out/brand/banner.png` (2048×1152) |
| Language | Hindi |
| Country | India |
| Category | Education |

**Why this name:** every topic the channel covers is literally a *shastra* —
Vastu Shastra, Jyotish Shastra, Yoga Shastra, Dharma Shastra. It is exactly as
wide as the scope and no wider, and *katha* already means a spoken telling, so
it describes the format too. Both words are everyday Hindi and write cleanly in
Devanagari and Latin.

---

## Channel description (About)

```
शास्त्र क्या कहते हैं — बिना अतिशयोक्ति, बिना डर।

हर वीडियो में हम एक सवाल लेते हैं — रसोई किस दिशा में हो, मंगलवार का दिन किसका
है, कौन सा कोना खाली छोड़ना चाहिए — और सीधे मूल ग्रंथों से जवाब खोजते हैं।

हर दावे के साथ उसका स्रोत स्क्रीन पर दिखता है: मयमतम्, विश्वकर्मा प्रकाश,
बृहत् संहिता, समरांगण सूत्रधार, पतंजलि योग सूत्र।

हम यह नहीं कहते कि क्या होगा। हम बताते हैं कि परंपरा क्या कहती है, और क्यों
कहती है।

नया वीडियो हर चार दिन में। छोटे वीडियो रोज़।

— वास्तु · ज्योतिष · योग · परंपरा

What the shastras actually say — sourced, on screen, without exaggeration.
Every claim names the text it comes from.
```

**Why it is written this way.** The line *"हम यह नहीं कहते कि क्या होगा"* (we
don't tell you what will happen) is deliberate. It separates explaining a
tradition from promising an outcome — which is the difference between a channel
that lasts and one that gets demonetised. The sourcing promise is the moat; it
belongs in the first screen, not the fine print.

---

## Keywords

```
वास्तु शास्त्र, vastu shastra, वास्तु टिप्स, ज्योतिष, jyotish, हिंदी वास्तु,
रसोई वास्तु, घर की दिशा, मयमतम्, विश्वकर्मा प्रकाश, बृहत् संहिता, योग सूत्र,
भारतीय परंपरा, sanatan, hindi education, indian architecture, vastu for home
```

---

## Video description template

Replace `{{...}}`. Paste `out/<episode>/chapters.txt` under CHAPTERS.

```
{{एक पंक्ति का हुक — वही सवाल जो थंबनेल पर है}}

{{दो-तीन पंक्तियाँ: वीडियो में क्या-क्या है}}

⏱ CHAPTERS
{{paste out/<episode>/chapters.txt here — must start at 0:00}}

📖 स्रोत / SOURCES
• {{ग्रंथ का नाम}} — {{अध्याय / श्लोक}}
• {{ग्रंथ का नाम}} — {{अध्याय / श्लोक}}

ℹ️ यह वीडियो पारंपरिक ग्रंथों में लिखी बातों की जानकारी देता है। यह किसी
परिणाम की गारंटी नहीं है, और चिकित्सा, कानूनी या वित्तीय सलाह नहीं है।

🔔 नया वीडियो हर चार दिन में — @shastrakatha

#वास्तुशास्त्र #vastu #ज्योतिष #हिंदी #भारतीयपरंपरा
```

The disclaimer is not boilerplate. This channel explains what a tradition holds;
it does not promise outcomes. `npm run review` enforces the same line in the
script — `PROMISES_OUTCOME` and `REGULATED_ADVICE` block a build outright.

---

## Disclaimers

> **I am not a lawyer and this is not legal advice.** What follows is a sensible
> template built on common practice for this kind of content. Before you
> monetise seriously, have someone qualified in Indian law review it — a few
> thousand rupees once is cheap next to a strike or a claim.

The principle everything rests on: **this channel describes what traditional
texts say. It never promises an outcome, and it never gives advice in a
regulated field.** Say it in the video, in the description, and on the channel —
and let the pipeline enforce it.

### 1. On screen, every video

Rendered automatically by `engine/disclaimer.js`, held 3.6 seconds:

> यह वीडियो पारंपरिक ग्रंथों की जानकारी देता है — किसी परिणाम की गारंटी नहीं।

`npm run build` prints a **warning if an episode has no disclaimer card**, so it
cannot be forgotten on a busy upload day.

### 2. In every video description

```
ℹ️ अस्वीकरण / DISCLAIMER

यह वीडियो केवल शैक्षिक और सांस्कृतिक जानकारी के लिए है। इसमें बताई गई बातें
पारंपरिक ग्रंथों पर आधारित हैं और इन्हें उसी रूप में प्रस्तुत किया गया है —
किसी वैज्ञानिक दावे या परिणाम की गारंटी के रूप में नहीं।

• यह चिकित्सा, मानसिक स्वास्थ्य, कानूनी या वित्तीय सलाह नहीं है।
• किसी भी निर्माण, निवेश, स्वास्थ्य या व्यक्तिगत निर्णय से पहले योग्य
  पेशेवर से सलाह लें।
• ग्रंथों की व्याख्या अलग-अलग परंपराओं में भिन्न हो सकती है।
• चैनल किसी भी निर्णय या उसके परिणाम के लिए उत्तरदायी नहीं है।

This video is for educational and cultural information only. It describes what
traditional texts state; it is not a scientific claim and guarantees no outcome.
It is not medical, mental-health, legal or financial advice. Consult a qualified
professional before any construction, investment, health or personal decision.
Interpretations differ between traditions. The channel accepts no liability for
decisions taken on the basis of this content.
```

### 3. On the channel About page

Append to the description:

```
अस्वीकरण: यह चैनल पारंपरिक ग्रंथों की शैक्षिक जानकारी देता है। यह किसी परिणाम
की गारंटी नहीं देता, और चिकित्सा, कानूनी या वित्तीय सलाह नहीं है।
```

### 4. Pinned comment, first video on the channel

```
इस चैनल पर हर दावे के साथ उसका स्रोत बताया जाता है। हम यह नहीं कहते कि क्या
होगा — हम बताते हैं कि परंपरा क्या कहती है। किसी भी बड़े निर्णय से पहले योग्य
व्यक्ति से सलाह ज़रूर लें। 🙏
```

### What actually keeps you safe

The wording matters less than the habit. Four rules:

1. **Never promise a result.** Not wealth, health, marriage, a job, safety.
   *"शास्त्र कहते हैं…"* — never *"ऐसा करने से धन आएगा"*. `npm run review`
   blocks a build on `PROMISES_OUTCOME`.
2. **Never enter a regulated field.** No illness, no remedies, no investments,
   no legal questions. Blocked on `REGULATED_ADVICE`.
3. **Always name the text.** An unsourced doctrinal claim is both a credibility
   and a liability problem. Blocked on `UNSOURCED`.
4. **Attribute, do not assert.** *"मयमतम् के अनुसार…"* rather than
   *"यह सच है कि…"*. Flagged as `STATED_AS_FACT`.

Those four are enforced in `engine/decisions.js`, so the editorial line and the
build gate are the same thing rather than two rules that can drift apart.

---

## Episode 1

```
Title  रसोई किस दिशा में होनी चाहिए? | शास्त्र क्या कहते हैं
Thumb  out/brand/thumb.png  — grid left, question right, chulha below
```

Alternative titles worth testing:
- `आग्नेय कोण में ही रसोई क्यों? | वास्तु शास्त्र`
- `रसोई की दिशा — मयमतम् और विश्वकर्मा प्रकाश क्या कहते हैं`

Keep the question form. It is what people type.

---

## Upload checklist

1. Title in Hindi, question form, under 60 characters
2. Thumbnail 1280×720 — one idea, large Devanagari, readable at 168px wide
3. Paste `chapters.txt` into the description; it **must** start at `0:00`
4. **Upload `out/<episode>/<episode>.srt` as subtitles.** Never rely on
   auto-captions — they mangle Devanagari and Indian numbering
5. Set language Hindi, category Education
6. Add to the topic playlist (वास्तु / ज्योतिष / योग / परंपरा)
7. End screen → previous video + subscribe
8. Release the Shorts over following days, one at a time, never batched
