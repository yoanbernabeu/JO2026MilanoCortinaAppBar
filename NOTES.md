# JO 2026 Milano Cortina - API Olympics.com

## Base URL

```
https://www.olympics.com/wmr-owg2026/
```

Aucune authentification requise. Les endpoints renvoient du JSON directement.

---

## Endpoints disponibles

### 1. Liste des medailles (Medallists)

```
GET /wmr-owg2026/competition/api/{LANG}/medallists
```

Liste de tous les athletes medailles avec le detail de chaque medaille.

**Structure de la reponse :**

```json
{
  "info": {
    "lastUpdateOdfTime": "2026-02-07T12:22:31.312Z",
    "finishedEvents": 1
  },
  "athletes": [ ... ],
  "competitionCode": "OWG2026"
}
```

**Structure d'un athlete :**

```json
{
  "organisation": "SUI",
  "organisationName": "Switzerland",
  "code": "48729",
  "fullName": "von ALLMEN Franjo",
  "initialName": "von ALLMEN F",
  "tvName": "Franjo von ALLMEN",
  "tvInitialName": "F. von ALLMEN",
  "gender": "M",
  "medalsGold": 1,
  "medalsSilver": 0,
  "medalsBronze": 0,
  "medalsTotal": 1,
  "medals": [
    {
      "medalType": "ME_GOLD",
      "event": "ALPMDH----------------------------",
      "eventName": "Men's Downhill",
      "category": "M",
      "date": "2026-02-07",
      "disciplineCode": "ALP",
      "disciplineName": "Alpine Skiing",
      "class": "",
      "official": true
    }
  ]
}
```

**Valeurs de `medalType` :** `ME_GOLD`, `ME_SILVER`, `ME_BRONZE`

---

### 2. Tableau des medailles par pays (Medal Table)

```
GET /wmr-owg2026/competition/api/{LANG}/medals
```

Classement des pays avec ventilation par discipline et par epreuve.

**Structure de la reponse :**

```json
{
  "medalStandings": {
    "medalsTable": [
      {
        "disciplines": [
          {
            "code": "ALP",
            "name": "Alpine Skiing",
            "gold": 1,
            "silver": 0,
            "bronze": 0,
            "total": 1,
            "medalWinners": [
              {
                "disciplineCode": "ALP",
                "eventCode": "ALPMDH----------------------------",
                "eventCategory": "Men",
                "eventDescription": "Men's Downhill",
                "medalType": "ME_GOLD",
                "official": true,
                "competitorCode": "48729",
                "competitorType": "A",
                "competitorDisplayName": "von ALLMEN Franjo",
                "noc": "SUI"
              }
            ]
          }
        ],
        "organisation": "SUI",
        "organisationName": "Switzerland",
        "gold": 1,
        "silver": 0,
        "bronze": 0,
        "total": 1,
        "rank": 1,
        "rankTotalMedals": 1
      }
    ]
  },
  "competitionCode": "OWG2026"
}
```

---

### 3. Programme complet (Full Schedule)

```
GET /wmr-owg2026/schedules/api/{LANG}/schedule
```

Toutes les unites de competition (644 unites : entrainements, qualifications, finales...).

**Structure de la reponse :**

```json
{
  "units": [ ... ],
  "groups": [ ... ]
}
```

**Structure d'une unite :**

```json
{
  "disciplineName": "Ski Jumping",
  "eventUnitName": "Women's NH - Official Training 2",
  "id": "SJPWNHTRAIN-----------TRNO0200SJ--",
  "disciplineCode": "SJP",
  "genderCode": "W",
  "eventCode": "NHTRAIN-----------",
  "phaseCode": "TRNO",
  "eventId": "SJPWNHTRAIN-----------------------",
  "eventName": "Women's Normal Hill",
  "eventType": "INDV",
  "phaseId": "SJPWNHTRAIN-----------TRNO--------",
  "phaseName": "Women's NH Training",
  "disciplineId": "SJP-------------------------------",
  "eventOrder": 0,
  "phaseType": "1",
  "eventUnitType": "ATH",
  "olympicDay": "2026-02-06",
  "startDate": "2026-02-06T09:00:00+01:00",
  "endDate": "2026-02-06T11:00:00+01:00",
  "hideStartDate": false,
  "hideEndDate": true,
  "venue": "PSJ",
  "venueDescription": "Predazzo Ski Jumping",
  "status": "SCHEDULED",
  "medalEvent": false
}
```

---

### 4. Programme par jour (Daily Schedule)

```
GET /wmr-owg2026/schedules/api/{LANG}/schedule/lite/day/{YYYY-MM-DD}
```

Programme filtre pour un jour specifique.

**Dates disponibles :** `2026-02-04` a `2026-02-22`

Meme structure que le programme complet, mais filtre sur la journee.

---

### 5. Premier evenement a medaille (First Medal Event)

```
GET /wmr-owg2026/schedules/api/{LANG}/schedule/firstmedalevent
```

Retourne les informations sur le prochain evenement donnant lieu a une remise de medaille.

---

### 6. Disciplines et epreuves (Disciplines & Events)

```
GET /wmr-owg2026/info/api/{LANG}/disciplinesevents
```

Liste complete des 16 disciplines et de toutes leurs epreuves.

**Structure de la reponse :**

```json
{
  "disciplines": [
    {
      "id": "ALP",
      "name": "Alpine Skiing",
      "events": [
        {
          "category": "W",
          "id": "ALPWDH----------------------------",
          "name": "Women's Downhill"
        }
      ]
    }
  ]
}
```

---

### 7. Comites Olympiques Nationaux (NOCs)

```
GET /wmr-owg2026/info/api/{LANG}/nocs
```

Liste de tous les comites olympiques nationaux participants.

**Structure de la reponse :**

```json
{
  "nocs": [
    {
      "id": "FRA",
      "name": "France",
      "longName": "France",
      "continent": "EUR",
      "medalCount": "Y",
      "nameOrder": 730,
      "longNameOrder": 740
    }
  ]
}
```

**Continents :** `EUR`, `AME`, `ASI`, `OCE`, `AFR`, `XXN` (AIN - athletes individuels neutres)

---

### 8. Categories d'evenements (Event Categories)

```
GET /wmr-owg2026/info/api/{LANG}/eventcategories
```

Liste des categories de genre pour les epreuves.

**Structure de la reponse :**

```json
{
  "eventCategories": [
    { "id": "M", "name": "Men" },
    { "id": "W", "name": "Women" },
    { "id": "X", "name": "Mixed" }
  ]
}
```

---

### 9. Informations competition (Competition Info)

```
GET /wmr-api/api/v2/competitions?competitionCode=OWG2026&languageCode={LANG}
```

> **Note :** Cet endpoint utilise une base URL differente (`/wmr-api/`) et des query params au lieu de path params.

Metadonnees completes de la competition avec liste detaillee de toutes les disciplines et epreuves.

**Structure de la reponse :**

```json
{
  "ResponseCode": 200,
  "Message": "",
  "TotalRows": 1,
  "Data": [
    {
      "Code": "OWG2026",
      "Description": "Olympic Winter Games Milano Cortina 2026",
      "Type": "Games",
      "StartDate": "2026-02-06T01:00:00+01:00",
      "EndDate": "2026-02-22T01:00:00+01:00",
      "GamesEdition": "XXV OLYMPIC WINTER GAMES",
      "HostCity": "MILANO/CORTINA",
      "HostNation": "ITALY",
      "HostTimezone": "GMT+1",
      "DisciplinesNumber": 16,
      "Disciplines": [
        {
          "DisciplineCode": "ALP",
          "Description": "Alpine Skiing",
          "Order": 1,
          "IsCultural": 0,
          "HasRecords": 0,
          "Events": [
            {
              "GenderCode": "W",
              "EventCode": "DH----------------",
              "Description": "Women's Downhill",
              "LongDescription": "Women's Downhill",
              "TeamEvent": "N",
              "ParticipantType": "INDV",
              "SortOrder": 1
            }
          ]
        }
      ]
    }
  ]
}
```

---

### 10. Traductions UI (Translations)

```
GET /wmr-owg2026/translations/api/translations/{lang_lowercase}
```

> **Note :** Ce endpoint utilise le code langue en **minuscules** (`eng`, `fra`, etc.) contrairement aux autres endpoints.

Dictionnaire cle-valeur des traductions de l'interface utilisateur. Utile pour localiser les labels, filtres et messages.

**Structure de la reponse :**

```json
{
  "common_gold_medal": "Gold medal",
  "common_silver_medal": "Silver medal",
  "common_bronze_medal": "Bronze medal",
  "daily_schedule_filter_by_day": "Jump to the schedule of a specific day",
  "medal_table_title": "Medal Table",
  ...
}
```

---

## Langues disponibles

Le parametre `{LANG}` accepte les valeurs suivantes (toutes testees en status 200) :

| Code  | Langue      |
|-------|-------------|
| `ENG` | English     |
| `FRA` | Francais    |
| `SPA` | Espanol     |
| `DEU` | Deutsch     |
| `ITA` | Italiano    |
| `JPN` | Japanese    |
| `KOR` | Korean      |
| `POR` | Portugues   |
| `CHI` | Chinese     |
| `HIN` | Hindi       |
| `RUS` | Russian     |

---

## Images / Assets

Les images (drapeaux, photos athletes, etc.) sont servies depuis :

```
https://wmr-static-assets.scd.dgplatform.net/sm-cloudinary/...
```

---

## Codes disciplines (liste complete - 16 disciplines)

| Code  | Discipline              |
|-------|-------------------------|
| `ALP` | Alpine Skiing           |
| `BTH` | Biathlon                |
| `BOB` | Bobsleigh               |
| `CCS` | Cross-Country Skiing    |
| `CUR` | Curling                 |
| `FSK` | Figure Skating          |
| `FRS` | Freestyle Skiing        |
| `IHO` | Ice Hockey              |
| `LUG` | Luge                    |
| `NCB` | Nordic Combined         |
| `STK` | Short Track Speed Skating |
| `SKN` | Skeleton                |
| `SJP` | Ski Jumping             |
| `SMT` | Ski Mountaineering      |
| `SBD` | Snowboard               |
| `SSK` | Speed Skating           |

---

## Exemples d'appels curl

```bash
# Tous les medailles (en francais)
curl -s "https://www.olympics.com/wmr-owg2026/competition/api/FRA/medallists" | jq .

# Tableau des medailles par pays
curl -s "https://www.olympics.com/wmr-owg2026/competition/api/ENG/medals" | jq .

# Programme complet
curl -s "https://www.olympics.com/wmr-owg2026/schedules/api/ENG/schedule" | jq .

# Programme du 7 fevrier 2026
curl -s "https://www.olympics.com/wmr-owg2026/schedules/api/ENG/schedule/lite/day/2026-02-07" | jq .

# Premier evenement a medaille
curl -s "https://www.olympics.com/wmr-owg2026/schedules/api/ENG/schedule/firstmedalevent" | jq .

# Disciplines et epreuves
curl -s "https://www.olympics.com/wmr-owg2026/info/api/ENG/disciplinesevents" | jq .

# Liste des NOCs
curl -s "https://www.olympics.com/wmr-owg2026/info/api/ENG/nocs" | jq .

# Categories d'evenements
curl -s "https://www.olympics.com/wmr-owg2026/info/api/ENG/eventcategories" | jq .

# Infos competition (API v2)
curl -s "https://www.olympics.com/wmr-api/api/v2/competitions?competitionCode=OWG2026&languageCode=ENG" | jq .

# Traductions UI (anglais)
curl -s "https://www.olympics.com/wmr-owg2026/translations/api/translations/eng" | jq .
```

---

## Notes techniques

- **Framework front** : Angular (avec Zone.js et SSR via transfer state `ng-state`)
- **Pas d'auth** : Tous les endpoints sont accessibles sans token ni cookie
- **Format** : JSON pur, pas de pagination observee
- **Mise a jour** : Le champ `info.lastUpdateOdfTime` indique la derniere actualisation des donnees
- **CDN interne** : `scd.dgplatform.net/wmr-owg2026/` (meme contenu que les endpoints publics)
- **Competition code** : `OWG2026`
- **CDN Akamai** : curl peut etre bloque (403 Access Denied) selon les headers envoyes. HTTPie fonctionne sans probleme (`http GET url`)
- **CORS** : `Access-Control-Allow-Origin: *` — tous les endpoints sont accessibles depuis n'importe quel domaine front
