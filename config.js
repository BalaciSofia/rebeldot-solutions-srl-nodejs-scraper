const CONFIG = {
  SOLR_URL: "https://solr.peviitor.ro/solr/job",
  SOLR_COMPANY_URL: "https://solr.peviitor.ro/solr/company",

  ANAF_API_URL: "https://demoanaf.ro/api/company/",
  ANAF_SEARCH_URL: "https://demoanaf.ro/api/search",
  ANAF_MAX_RETRIES: 3,
  ANAF_RETRY_DELAY_MS: 2000,

  COMPANY_BRAND: "RebelDot",
  COMPANY_CIF: "39271439",
  PEVIITOR_API_URL: "https://api.peviitor.ro/v1/company/",

  JOBS_URL: "https://careers.rebeldot.com/jobs",
  JOBS_BASE_URL: "https://careers.rebeldot.com",
  SOURCE: "rebeldot.com",
  FETCH_TIMEOUT_MS: 15000,

  TAG_KEYWORDS: {
    "java": "java",
    "react": "react",
    "python": "python",
    "devops": "devops",
    "azure": "azure",
    "generative ai": "generative ai",
    "genai": "generative ai",
    "artificial intelligence": "ai",
    "ai": "ai",
    "data": "data",
    ".net": ".net",
    "ux": "ux design",
    "designer": "ux design",
    "architect": "architect",
    "security": "security",
    "devsecops": "security"
  },

  CITY_FALLBACK_RULES: [
    { keywords: ["cluj"], city: "Cluj-Napoca" },
    { keywords: ["brașov", "brasov"], city: "Brașov" },
    { keywords: ["oradea"], city: "Oradea" },
    { keywords: ["bucurești", "bucharest"], city: "București" }
  ],

  ROMANIAN_CITIES: [
    "Bucharest", "București", "Cluj-Napoca", "Cluj Napoca",
    "Timișoara", "Timisoara", "Iași", "Iasi", "Brașov", "Brasov",
    "Constanța", "Constanta", "Craiova", "Bacău", "Sibiu",
    "Târgu Mureș", "Targu Mures", "Oradea", "Baia Mare", "Satu Mare",
    "Ploiești", "Ploiesti", "Pitești", "Pitesti", "Arad", "Galați", "Galati",
    "Brăila", "Braila", "Drobeta-Turnu Severin", "Râmnicu Vâlcea", "Ramnicu Valcea",
    "Buzău", "Buzau", "Botoșani", "Botosani", "Zalău", "Zalau", "Hunedoara", "Deva",
    "Suceava", "Bistrița", "Bistrita", "Tulcea", "Călărași", "Calarasi",
    "Giurgiu", "Alba Iulia", "Slatina", "Piatra Neamț", "Piatra Neamt", "Roman",
    "Dumbrăvița", "Dumbravita", "Voluntari", "Popești-Leordeni", "Popesti-Leordeni",
    "Chitila", "Mogoșoaia", "Mogosoaia", "Otopeni"
  ]
};

export default CONFIG;
