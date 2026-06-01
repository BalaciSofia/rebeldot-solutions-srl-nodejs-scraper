# Actualizare About repo pe GitHub

Pentru a actualiza secțiunea **About** din dreapta paginii principale a repo-ului pe GitHub (descriere, website, topics):

## CLI (gh)

```bash
# Descriere
gh repo edit BalaciSofia/rebeldot-solutions-srl-nodejs-scraper \
  --description "web scraper pentru a aduce locurile de munca de la RebelDot in platforma peviitor.ro"

# Website
gh repo edit BalaciSofia/rebeldot-solutions-srl-nodejs-scraper \
  --homepage "https://BalaciSofia.github.io/rebeldot-solutions-srl-nodejs-scraper/"

# Topics
gh repo edit BalaciSofia/rebeldot-solutions-srl-nodejs-scraper \
  --add-topic scraper --add-topic rebeldot --add-topic peviitor --add-topic jobs --add-topic romania
```

## Web UI

1. Mergi la `https://github.com/BalaciSofia/rebeldot-solutions-srl-nodejs-scraper`
2. Click pe ⚙️ **Settings** (tab-ul din dreapta sus)
3. Mergi la secțiunea **General** → **Description**
4. Completează:
   - **Description**: textul de mai sus
   - **Website**: URL-ul GitHub Pages
   - **Topics**: cuvinte cheie separate prin spațiu
5. Click **Save changes**

## Verificare

```bash
gh repo view BalaciSofia/rebeldot-solutions-srl-nodejs-scraper --json description,homepage,topics
```
