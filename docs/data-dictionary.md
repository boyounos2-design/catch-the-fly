# Data dictionary — Orthopedic Infection Surveillance

Field-by-field reference for every data point collected, with allowed values and bilingual labels. English `EN` | Arabic `AR`. All labels are looked up by the app via `App.t(key)` in `js/i18n.js`.

---

## 1. Case information

| Field name (code) | Type | Allowed values | EN label | AR label |
|---|---|---|---|---|
| `id` | string | auto-generated `CTF-YYYY-NNNN` | Case ID | رقم الحالة |
| `caseName` | string (free text, optional) | any | Case name | اسم الحالة |
| `ptName` | string (free text, optional) | any | Patient name | اسم المريض |
| `mrn` | string (free text) | any (optional; PII notice applies) | Medical record no. | رقم الملف الطبي |
| `age` | number | ≥0 | Age | العمر |
| `sex` | string | `M`, `F`, `` (unknown) | Sex | الجنس |
| `weight` | number | ≥0 | Weight (kg) | الوزن |
| `bmi` | number | ≥0 | BMI | مؤشر كتلة الجسم |
| `opDate` | date | YYYY-MM-DD | Original operation date | تاريخ العملية الأصلية |
| `infectionSuspectedDate` (`suspDate`) | date | YYYY-MM-DD | Infection suspected date | تاريخ الاشتباه بالعدوى |
| `infectionDiagnosedDate` (`diagDate`) | date | YYYY-MM-DD | Infection diagnosed date | تاريخ تشخيص العدوى |

**Privacy warning**: entering patient names is neither required nor encouraged.

---

## 2. Original operation

| Code | Type | Allowed values | EN | AR |
|---|---|---|---|---|
| `procedure` | ID (procedures) | list / `NEW:` free text | Procedure | نوع العملية |
| `site` | free text (sites) | e.g. Tibia, Knee, Hip… | Anatomical site | الموضع التشريحي |
| `side` | string | `Right`, `Left`, `Bilateral` | Side | الجانب |
| `trauma` | string | `yes`, `no`, `unknown` | Trauma | رضّية |
| `emergency` | string | `yes`, `no`, `unknown` | Emergency | إسعافية |
| `primaryRevision` | string | `primary`, `revision`, `unknown` | Primary / revision | أولي / مراجعة |
| `openClosed` | string | `open`, `closed`, `unknown` | Open / closed | مفتوحة / مغلقة |
| `fxClass` | free text | e.g. Gustilo IIIC | Fracture classification | تصنيف الكسر |
| `duration` | number | ≥0 min | Operation duration | مدة العملية |
| `ebl` | number | ≥0 | Estimated blood loss | فقد الدم التقديري |
| `implantUsed` | string | `yes`, `no`, `unknown` | Implant used | استخدام غرسة |
| `implantType` | free text (implants) | Plate & screws, IM nail… | Implant type | نوع الغرسة |
| `tourniquetUse` | string | `yes`, `no`, `unknown` | Tourniquet | عاصبة |
| `tourniquetDur` | number | ≥0 min | Tourniquet duration | مدة العاصبة |
| `drainUsed` | string | `yes`, `no`, `unknown` | Drain | تصريف جراحي |

---

## 3. Prophylaxis (`prophylaxis`)

| Code | Type | Allowed values | EN | AR |
|---|---|---|---|---|
| `given` | string | `yes`, `no`, `unknown` | Prophylaxis given | إعطاء وقائي |
| `antibiotic` | ID (antibiotics) | list / `NEW:` | Prophylactic antibiotic | المضاد الوقائي |
| `dose` | free text | e.g. `2 g` | Dose | الجرعة |
| `time` | string | `pre60`, `pre60p`, `incision`, `post`, `unknown` | Timing | التوقيت |
| `redosingRequired` | string | `yes`, `no`, `unknown` | Redosing required | الحاجة لإعادة الجرعة |
| `redosingPerformed` | string | `yes`, `no`, `unknown` | Redosing performed | إعادة الجرعة |
| `problem` | string | `correct`, `delayed`, `wrong`, `missed`, `unknown` | Prophylaxis problem | مشكلة الوقاية |

Timing labels: `pre60` = within 60 min before incision; `pre60p` = >60 min before; `incision` = at incision; `post` = after incision.

---

## 4. Operating room (`or`)

| Code | Type | Allowed values | EN | AR |
|---|---|---|---|---|
| `room` | ID (rooms) | list / `NEW:` | OR | غرفة العمليات |
| `date` | date | YYYY-MM-DD | OR date | تاريخ العمليات |
| `startTime` | time | HH:MM | OR start | بداية |
| `endTime` | time | HH:MM | OR end | نهاية |
| `previousCase` | free text | optional | Previous case in OR | العملية السابقة |
| `prevCount` | number | ≥0 | Cases before this one | عدد العمليات السابقة |
| `envProblem` | free text | optional | Environment issue | مشكلة بيئية |
| `sterilityBreak` | string | `yes`, `no`, `unknown` | Sterility break | كسر التعقيم |
| `instrumentProblem` | free text | optional | Instrument problem | مشكلة الأدوات |
| `packagingProblem` | free text | optional | Packaging problem | مشكلة التغليف |
| `other` | free text | optional | Other | أخرى |

---

## 5. Surgical team (`team`) — all fields are arrays of staff IDs

| Code | EN | AR |
|---|---|---|
| `surgeons` | Primary surgeon(s) | الجرّاح الرئيسي |
| `assistants` | Assistant surgeon(s) | مساعد الجرّاح |
| `otherSurgeons` | Other surgeons | جرّاحون آخرون |
| `residents` | Residents | الأطباء المقيمون |
| `scrub` | Scrub nurse | ممرضة التمريض (/ المناولة) |
| `circulating` | Circulating nurse | الممرضة الجوالة |
| `instrument` | Instrument nurse | ممرضة الأدوات |
| `otherNursing` | Other nursing | تمريض آخر |
| `anesthesiaDoc` | Anesthesia doctor | طبيب التخدير |
| `anesthesiaTeam` | Anesthesia team | فريق التخدير |
| `worker` | OR worker | عامل العمليات |
| `otherStaff` | Other staff | آخرون |

Staff role values: `surgeon`, `resident`, `nurse`, `worker`, `anesthesia`, `other`.

---

## 6. Risk factors (`riskFactors`)

### Medical (`medical` array)

| ID | EN | AR |
|---|---|---|
| `diabetes` | Diabetes | السكري |
| `smoking` | Smoker | تدخين |
| `obesity` | Obesity | سمنة |
| `malnutrition` | Malnutrition | سوء تغذية |
| `immunosuppression` | Immunosuppression | كبت مناعي |
| `steroid` | Steroid use | استخدام كورتيزون |
| `renal` | Renal disease | أمراض كلوية |
| `liver` | Liver disease | أمراض كبدية |
| `pvd` | Peripheral vascular disease | مرض وعائي محيطي |
| `neuropathy` | Neuropathy | اعتلال عصبي |
| `other_med` | Other medical | طبية أخرى |

### Local (`local` array)

| ID | EN | AR |
|---|---|---|
| `open_fx` | Open fracture | كسر مفتوح |
| `soft_tissue` | Soft-tissue injury | إصابة أنسجة رخوة |
| `prev_surg` | Previous surgery | عملية سابقة |
| `prev_inf` | Previous infection | عدوى سابقة |
| `prev_hosp` | Previous hospital stay | تنويم سابق |
| `deadspace` | Dead space | فراغ ميت |
| `hematoma` | Hematoma | ورم دموي |
| `coverage` | Poor soft-tissue coverage | تغطية أنسجة ضعيفة |
| `other_local` | Other local | موضعية أخرى |

---

## 7. Infection details (`infection`)

| Code | Type | Allowed values | EN | AR |
|---|---|---|---|---|
| `types` | array of IDs (infectionTypes) | list | Infection type | نوع العدوى |
| `days` | number | ≥0 | Days to infection | الأيام حتى العدوى |
| `fever` | boolean | — | Fever | حمى |
| `discharge` | boolean | — | Purulent discharge | إفرازات قيحية |
| `erythema` | boolean | — | Erythema | احمرار |
| `pain` | boolean | — | Pain / tenderness | ألم |
| `crp` | boolean | — | Raised CRP | ارتفاع CRP |
| `esr` | boolean | — | Raised ESR | ارتفاع ESR |
| `leuko` | boolean | — | Elevated WBC | ارتفاع كريات الدم |
| `imaging` | free text | optional | Imaging findings | نتائج التصوير |
| `other` | free text | optional | Other clinical findings | نتائج سريرية أخرى |

Built-in infection types (`infectionTypes` store, editable):
`it_superf` (Superficial incisional SSI / عدوى سطحية), `it_deep` (Deep incisional / عميقة), `it_organ` (Organ-space / حيّزية), `it_implant` (Implant-associated / مرتبطة بالغرسة), `it_osteo` (Osteomyelitis / التهاب العظم والنقي), `it_pji` (Prosthetic joint infection / عدوى البدلة المفصلية), `it_dehis` (Wound dehiscence / انحراف الجرح), `it_other` (Other / أخرى).

---

## 8. Cultures (`cultures` array)

| Code | Type | Allowed values | EN | AR |
|---|---|---|---|---|
| `date` | date | YYYY-MM-DD | Culture date | تاريخ الزرع |
| `specimen` | string | `swab`, `deep`, `pus`, `bone`, `blood`, `implant`, `other` | Specimen type | نوع العينة |
| `samples` | number | ≥1 | No. of samples | عدد العينات |
| `extras` | array | subset of specimen values | Extra samples | عينات إضافية |
| `negative` | boolean | — | Culture-negative | زرع سلبي |
| `pending` | boolean | — | Culture-pending | زرع قيد الانتظار |
| `organisms` | array | — (see below) | Organisms | الكائنات |

### Organism-in-culture

| Code | Type | Allowed values | EN | AR |
|---|---|---|---|---|
| `organismId` | ID (organisms) | list / `NEW:` | Organism | الكائن الدقيق |
| `sensitivity` | free text | e.g. `S`, `S / R` | Sensitivity | الحساسية |
| `resistance` | array | `mrsa`, `esbl`, `vre`, `mdr` | Resistance flags | مقاومة |
| `mrsa` | boolean | — | MRSA | مكورات عنقودية ذهبية مقاومة للميثيسيلين |
| `esbl` | boolean | — | ESBL | بيتا لاكتاماز واسعة الطيف |
| `vre` | boolean | — | VRE | معوية مقاومة للفانكومايسين |
| `mdr` | boolean | — | MDR | مقاومة متعددة الأدوية |
| `otherRes` | free text | optional | Other resistance | مقاومة أخرى |

---

## 9. Treatment (`treatment`)

Each of the following is a boolean: `debridement` (Debridement / تنظيف جراحي), `repeatDebridement` (Repeat debridement / تنظيف متكرر), `implantRetention` (Implant retention / إبقاء الغرسة), `implantRemoval` (Implant removal / إزالة الغرسة), `revisionFixation` (Revision fixation / تثبيت مراجعة), `externalFixation` (External fixation / تثبيت خارجي), `abCement` (Antibiotic cement / أسمنت مضاد حيوي), `abBeads` (Antibiotic beads / خرز مضاد حيوي), `stimulan` (Stimulan beads / حبيبات ستيميولان), `ivAntibiotics` (IV antibiotics / مضادات وريدية), `oralAntibiotics` (Oral antibiotics / مضادات فموية).

| Code | Type | EN | AR |
|---|---|---|---|
| `antibioticDuration` | free text | Antibiotic duration | مدة المضادات |
| `other` | free text | Other treatment | علاج آخر |

---

## 10. Outcome (`outcome`)

Booleans: `controlled` (Controlled / مسيطر عليها), `persistent` (Persistent / مستمرة), `recurrence` (Recurrence / انتكاس), `repeatOp` (Repeat operation / عملية متكررة), `implantRetained` (Implant retained / غرسة محفوظة), `implantRemoved` (Implant removed / غرسة مزالة), `amputation` (Amputation / بتر), `death` (Death / وفاة), `lost` (Lost to follow-up / فقد المتابعة).

| Code | Type | EN | AR |
|---|---|---|---|
| `followUpDuration` | free text | Follow-up duration | مدة المتابعة |
| `finalOutcome` | free text | Final outcome | النتيجة النهائية |
| `notes` | free text | Clinical notes | ملاحظات سريرية |

---

## Prefixes and ID conventions

| Prefix | Store |
|---|---|
| `st-` | staff |
| `r` | rooms (r1, r2…) |
| `p` | procedures (p_orifti…) |
| `o` | organisms (o_sa…) |
| `ab` | antibiotics (ab_cz…) |
| `it` | infectionTypes (it_deep…) |
| `e` | exposures |
| `CTF-YYYY-NNNN` | cases |

The prefix `NEW:` in any entity field marks a free-text entry that will be resolved (created) at save time and persisted to the corresponding list store.