# Sources

The channel's one real advantage is that it names its texts. That only holds if
the citations are checked. This file records what has actually been verified,
what has not, and the rule for telling them apart.

## The rule

**Cite only what you have read in a named edition.** Not what a vastu blog says
the text says. Not what "is well known". If you have not seen the sentence, do
not put a verse number on screen.

Three tiers, and the tier goes in the notes for every claim:

| tier | meaning |
|---|---|
| **VERIFIED** | read in a named edition; chapter and verse quoted below |
| **ATTRIBUTED** | the text is right, the exact verse is not yet located |
| **TRADITION** | widely taught, no textual citation found — say so on screen |

A **TRADITION** claim is still worth making. It just has to be framed as
"परंपरा में कहा जाता है", never "शास्त्र कहते हैं".

---

## The core texts

Your framing is right: the tradition calls these **vidyā** and **śāstra** —
bodies of systematic knowledge. Bṛhat Saṃhitā 53.1 says so in its first line:

> "We shall now proceed to treat of the **science of house-building
> (vāstu-vidyā)**, which has come down to us from the Ṛṣis who obtained it from
> Brahmā, for the pleasure of learned Jyotiṣakas."
> — *Bṛhat Saṃhitā* 53.1, tr. N. Chidambaram Iyer, 1884 · **VERIFIED**

| domain | core text | author / date | English edition |
|---|---|---|---|
| **Vāstu** | Bṛhat Saṃhitā ch. 53–56 | Varāhamihira, 6th c. | N. Chidambaram Iyer, 1884 — full text free at wisdomlib |
| | Mayamatam | S. India, c. 9–12th c. | Bruno Dagens, Motilal Banarsidass (in print) |
| | Mānasāra | S. India, c. 5–7th c. | P. K. Acharya, Oxford 1934 |
| | Samarāṅgaṇa Sūtradhāra | attrib. Bhoja, 11th c. | Sanskrit ed. T. Ganapati Sastri |
| | Viśvakarma Prakāśa | later compilation | Hindi tika eds. |
| **Jyotiṣa** | Bṛhat Parāśara Horā Śāstra | attrib. Parāśara | R. Santhanam |
| | Bṛhat Jātaka | Varāhamihira | — |
| **Yoga** | Yoga Sūtra | Patañjali, c. 2nd c. BCE–4th c. CE | many |
| | Haṭha Yoga Pradīpikā | Svātmārāma, 15th c. | — |

**Start with Bṛhat Saṃhitā.** It is the oldest of the vāstu sources here, it is
by a named author, and Iyer's translation is complete, free and linkable — so a
viewer can check you. That is worth more than a text you cannot point them to.

---

## Verified — Bṛhat Saṃhitā ch. 53

Edition: N. Chidambaram Iyer, 1884. Full text:
`https://www.wisdomlib.org/hinduism/book/brihat-samhita/d/doc229297.html`

**53.2–3 — the Vāstupuruṣa**
> "At one time, a monster appeared with a body so vast as to conceal the Earth
> and the sky. The Devas then caught hold of parts of his body and forcibly laid
> him down with his face towards the ground. … The monster, therefore, known as
> **Vāstupuruṣa**, represents in his body all the Devas by order of Brahmā."

**53.42 — the 81-square grid**
> "Divide the house ground into 81 squares by 10 lines drawn from east to west
> and 10 lines drawn from north to south. 32 Devas occupy the 32 exterior squares
> and 13 Devas occupy the inner squares."

**53.118 — room placement** ← the citation episode 1 rests on
> "The apartment for the Devas shall be built in the **north-east**; the
> **kitchen in the south-east**; the room for the household utensils shall be
> erected in the south-west; and the treasury and the granary rooms shall be
> erected in the north-west."

**53.119 — water**
> "If there be any piece of water in the east, south-east, south, south-west,
> west, north-west, north and north-east, there will respectively be the death of
> sons, injury from fire, troubles from enemies, quarrels among women, unchastity
> among women, poverty, increase of wealth and increase of sons."

---

## An open problem — read this before scripting

The prescription in **53.118** is unambiguous: **kitchen in the south-east.**

The *reason* everyone gives — that Agni, the fire deity, occupies the south-east,
so fire belongs there — does **not** follow from this translation's own grid.
53.43 reads:

> "Squares marked **1, 9, 81 and 73** are respectively the **north-eastern,
> south-eastern**, north-western and south-western corners. The eight eastern
> squares from 1 to 8 are respectively occupied by the Devas **Agni**, Parjanya,
> Jayanta, Indra, Sūrya, Satyā, Bhṛśa and Antarikṣa."

That places **Agni at square 1 = the north-east**, and 53.44–45 puts **Vāyu at
square 9 = the south-east** — the reverse of the modern convention, where Agni
holds the south-east and Vāyu the north-west.

Three possible explanations, and I cannot settle it from an OCR of an 1884
translation:

1. Iyer's corner assignment or square numbering differs from later usage
2. A printing or transcription error in that edition
3. The text genuinely differs from the convention that later hardened

**What to do meanwhile:** cite **53.118** for the placement — it is solid — and
do **not** assert the Agni-corner reasoning as something the text says. Check
53.43 against Dagens' Mayamatam or Acharya's Mānasāra, or ask someone who reads
the Sanskrit, before building a script on it.

This is exactly the kind of thing the channel exists to get right. Almost every
vastu video online states the fire-corner reasoning as scripture. At minimum it
needs a second source.

---

## Problems in the `vastu-disha` demo script

Written before this research. Do not ship it as-is:

| line | problem |
|---|---|
| `a2` | cites **मयमतम् और विश्वकर्मा प्रकाश** for the kitchen rule. Neither has been verified. The verified source is **Bṛhat Saṃhitā 53.118**. |
| `a3` | "सुबह की धूप इसी कोने से आती है" — a modern rationalisation, not in any text checked. **TRADITION** at best. |
| `r2` | "ईशान कोण में रसोई कभी नहीं" — plausible from 53.118 placing the shrine in the north-east, but the text does not say *never a kitchen there*. That is inference, not citation. |

`npm run review` cannot catch these. It checks whether a line *names* a source,
not whether the source *says* it. Only reading does that.

---

## Research method

1. Find a full translation you can link to. wisdomlib hosts several complete
   public-domain ones; archive.org has scans, but the OCR of Devanagari is
   unusable and its English OCR needs checking against the page image.
2. Search the chapter for the specific claim.
3. Copy the sentence and its verse number into this file verbatim.
4. Put the text and chapter on screen. Verse number too, if you have it.
5. Where two texts disagree, say so in the video. Disagreement is more
   interesting than false certainty, and it is the honest position.
