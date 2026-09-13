# Data schema — Orthopedic Infection Surveillance

## Storage

| Key | Description |
|-----|-------------|
| `ortho-inf-surv` | IndexedDB database name, version 1 |
| Settings store (`settings`) | Singletons: `{id:'config', ...}` app settings; `{id:'seq', n:...}` auto-increment counter for Case IDs |

All stores below use a string `id` as the primary key unless noted.

---

## Object stores

| Store | Contents |
|-------|----------|
| `settings` | `{id:'config', hospital:string, clusterMin:number, clusterWindow:number, lang:'ar'|'en', seedLoaded:boolean}` and `{id:'seq', n:number}` |
| `staff` | `{id:string('st-...'), name:string, role:string, inactive:boolean}` |
| `rooms` | `{id:string('r...'), name:string, inactive:boolean}` |
| `procedures` | `{id:string('p...'), name:string, inactive:boolean}` |
| `organisms` | `{id:string('o...'), name:string, inactive:boolean}` |
| `antibiotics` | `{id:string('ab...'), name:string, inactive:boolean}` |
| `infectionTypes` | `{id:string('it...'), name:string, inactive:boolean}` |
| `cases` | See **Case object** below |
| `exposures` | See **Exposure record** below |

All list items (`staff`, `rooms`, `procedures`, `organisms`, `antibiotics`, `infectionTypes`) share the same shape: `{id, name, inactive}`. Setting `inactive: true` hides the item from new-form dropdowns but preserves historical data.

---

## Case object

Generated IDs follow the pattern `CTF-{YYYY}-{NNNN}`, e.g. `CTF-2026-0001`.

```jsonc
{
  // identification
  "id": "CTF-2026-0001",
  "caseName": "",                      // optional free-text name/label for the case
  "ptName": "",                        // optional free-text patient name (PII notice applies)
  "status": "complete",               // "complete" | "draft"
  "createdAt": "...",                  // ISO string
  "updatedAt": "...",                  // ISO string

  // patient (optional PII — avoid entering names)
  "mrn": "",
  "age": "",                           // years, string or number
  "sex": "",                           // "M" | "F" | ""
  "weight": "",
  "bmi": "",

  // dates
  "opDate": "",                        // YYYY-MM-DD — original operation
  "infectionSuspectedDate": "",
  "infectionDiagnosedDate": "",        // used for rate calculations (cDiag)

  // original operation
  "procedure": "",                     // ID from procedures store
  "site": "",                          // free text (anatomical site)
  "side": "Right",                     // "Right" | "Left" | "Bilateral"
  "trauma": "no",                      // "yes" | "no" | "unknown"
  "emergency": "unknown",              // "yes" | "no" | "unknown"
  "primaryRevision": "primary",        // "primary" | "revision" | "unknown"
  "openClosed": "unknown",             // "open" | "closed" | "unknown"
  "fxClass": "",                       // fracture classification, free text
  "duration": "",                      // minutes
  "ebl": "",                           // estimated blood loss
  "implantUsed": "unknown",           // "yes" | "no" | "unknown"
  "implantType": "",                   // free text (matched to IMPLANTS list via datalist)
  "boneSite": "",                      // defaults to site
  "tourniquetUse": "unknown",         // "yes" | "no" | "unknown"
  "tourniquetDur": "",
  "drainUsed": "unknown",             // "yes" | "no" | "unknown"

  // prophylaxis
  "prophylaxis": {
    "given": "yes",                    // "yes" | "no" | "unknown"
    "antibiotic": "",                  // ID from antibiotics store
    "antibioticText": "",              // legacy / fallback text
    "dose": "",
    "time": "pre60",                   // "pre60" | "pre60p" | "incision" | "post" | "unknown"
    "redosingRequired": "unknown",    // "yes" | "no" | "unknown"
    "redosingPerformed": "unknown",   // "yes" | "no" | "unknown"
    "problem": "correct"              // "correct" | "delayed" | "wrong" | "missed" | "unknown"
  },

  // operating room
  "or": {
    "room": "",                        // ID from rooms store
    "date": "",
    "startTime": "",
    "endTime": "",
    "previousCase": "",
    "prevCount": "",
    "envProblem": "",
    "sterilityBreak": "unknown",      // "yes" | "no" | "unknown"
    "instrumentProblem": "",
    "packagingProblem": "",
    "other": ""
  },

  // surgical team (all arrays of staff IDs)
  "team": {
    "surgeons": [],                    // primary surgeon (first element)
    "assistants": [],
    "otherSurgeons": [],
    "residents": [],
    "scrub": [],
    "circulating": [],
    "instrument": [],
    "otherNursing": [],
    "anesthesiaDoc": [],
    "anesthesiaTeam": [],
    "worker": [],
    "otherStaff": []
  },

  // risk factors (arrays of IDs from RISK_MEDICAL / RISK_LOCAL)
  "riskFactors": {
    "medical": [],
    "local": [],
    "unknown": false
  },

  // infection details
  "infection": {
    "types": [],                       // array of infectionTypes IDs
    "days": "",                        // days to infection (or computed at display)
    "fever": false,
    "discharge": false,
    "erythema": false,
    "pain": false,
    "crp": false,
    "esr": false,
    "leuko": false,
    "imaging": "",
    "other": ""
  },

  // cultures — array of culture objects (see Culture object)
  "cultures": [],

  // treatment
  "treatment": {
    "debridement": false,
    "repeatDebridement": false,
    "implantRetention": false,
    "implantRemoval": false,
    "revisionFixation": false,
    "externalFixation": false,
    "abCement": false,
    "abBeads": false,
    "stimulan": false,
    "ivAntibiotics": false,
    "oralAntibiotics": false,
    "antibioticDuration": "",
    "other": ""
  },

  // outcome
  "outcome": {
    "controlled": false,
    "persistent": false,
    "recurrence": false,
    "repeatOp": false,
    "implantRetained": false,
    "implantRemoved": false,
    "amputation": false,
    "death": false,
    "lost": false,
    "followUpDuration": "",
    "finalOutcome": "",
    "notes": ""
  }
}
```

---

## Culture object

```jsonc
{
  "removed": false,                    // soft-delete flag
  "date": "",                          // culture collection date
  "specimen": "deep",                  // specimen type ID (swab|deep|pus|bone|blood|implant|other)
  "samples": 1,                        // number of samples
  "extras": [],                        // additional specimen types (array of IDs)
  "negative": false,                   // culture-negative
  "pending": false,                    // culture-pending
  "organisms": []                      // array of Organism-in-culture objects
}
```

---

## Organism-in-culture object

```jsonc
{
  "organismId": "",                    // ID from organisms store
  "sensitivity": "",                   // free-text sensitivity pattern (e.g. "S / R …")
  "resistance": [],                    // array of strings, currently: "mrsa" | "esbl" | "vre" | "mdr"
  "mrsa": false,
  "esbl": false,
  "vre": false,
  "mdr": false,
  "otherRes": ""
}
```

---

## Exposure record

```jsonc
{
  "id": "e...",                        // generated unique ID
  "type": "surgeon",                   // "surgeon" | "room" | "procedure" | "team" | "implant" | "other"
  "targetId": "",                      // ID from the relevant list store (or free-text for 'other')
  "name": "",                          // display name (frozen at creation)
  "from": "",                          // period start YYYY-MM-DD
  "to": "",                            // period end YYYY-MM-DD
  "den": 0,                            // denominator — total operations in this period/context
  "numerator": null,                   // manual override (null = use auto-match)
  "auto": 0,                           // computed at runtime (not persisted); count of infected cases matching this exposure
  "note": ""
}
```

**Auto-match logic**: a complete (non-draft) case matches an exposure when:
- `type = 'surgeon'`: primary surgeon (`team.surgeons[0]`) equals `targetId` **OR** any team member equals `targetId`
- `type = 'room'`: `or.room` equals `targetId`
- `type = 'procedure'`: `procedure` equals `targetId`
- `type = 'team'`: any team member equals `targetId`
- `type = 'implant'`: case `implantUsed = 'yes'` **AND** `implantType` contains `targetId` (case-insensitive)
- The case's operation date (`opDate`) falls within `[from, to]`
- Case status is not `draft`

**Rate display** (always shown on device):

```
numerator or auto / denominator = X%
```

- If `numerator` is explicitly set (not null), it is used as the numerator.
- Otherwise `auto` count is used.
- If `den = 0`, no rate is computed (error state shown).

---

## Settings store

```jsonc
{
  "id": "config",
  "hospital": "",                      // hospital/centre name
  "clusterMin": 3,                     // minimum case count to flag a potential cluster
  "clusterWindow": 45,                 // days — time window for temporal cluster detection
  "lang": "ar",                        // default language
  "seedLoaded": false                  // true after synthetic demo data is loaded
}
```

A separate record `{id: 'seq', n: <number>}` tracks the next case ID number.

---

## Key calculations

| Metric | Rule |
|--------|------|
| **Case ID** | `CTF-{YYYY}-{NNNN}` where NNNN is zero-padded 4-digit sequential number. Reset each year automatically. |
| **Days to infection** | `daysBetween(opDate, infectionDiagnosedDate)` if both dates present; otherwise `infection.days` (manual entry). |
| **Month key** | First 7 characters of `infectionDiagnosedDate` (YYYY-MM), falling back to `opDate` then `createdDate`. |
| **Deep infection** | Any of: `it_deep`, `it_organ`, `it_implant`, `it_osteo`, `it_pji` in `infection.types`. |
| **Culture-positive** | At least one culture with `negative: false`, `pending: false`, and ≥1 organism. |
| **Risk factor labels** | `RISK_MEDICAL` and `RISK_LOCAL` items are translated via `App.riskLabel`. |

---

## Export formats

| Format | Notes |
|--------|-------|
| **Research CSV** | One row per organism per culture per case. UTF-8 with BOM. No server upload. |
| **JSON backup** | Contains all stores verbatim. Can be imported to restore data. |
| **Monthly report** | HTML table (printable via `window.print()`). |
| **Cluster investigation report** | HTML table for the selected cluster's cases. |

---

## Privacy notes

- Patient names are **not required** and should be avoided. `mrn` is free text.
- All data is stored **locally in IndexedDB** on the user's device.
- No data is sent to any server.
- Users are responsible for device encryption and backup security.
