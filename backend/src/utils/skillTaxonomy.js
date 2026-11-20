/**
 * Taxonomy helper for backend skill normalization.
 * Mirrors the canonical industry taxonomy from the AI microservice.
 */

const CANONICAL_TAXONOMY = {
  Python: ['python', 'python3', 'python 3', 'py'],
  JavaScript: ['javascript', 'js', 'ecmascript', 'es6'],
  TypeScript: ['typescript', 'ts'],
  Java: ['java', 'core java', 'j2ee'],
  'C++': ['c++', 'cpp'],
  'C#': ['c#', 'c-sharp', 'csharp', '.net c#'],
  Go: ['golang', 'go language', 'go'],
  Rust: ['rust', 'rust-lang'],
  SQL: ['sql', 'structured query language', 'pl/sql', 't-sql'],
  HTML: ['html', 'html5'],
  CSS: ['css', 'css3'],
  React: ['react', 'react.js', 'reactjs', 'react-native'],
  'Next.js': ['next.js', 'nextjs', 'next js'],
  Angular: ['angular', 'angularjs', 'angular.js'],
  'Vue.js': ['vue', 'vue.js', 'vuejs'],
  Redux: ['redux', 'redux toolkit', 'rtk'],
  'Tailwind CSS': ['tailwind', 'tailwindcss', 'tailwind css'],
  Bootstrap: ['bootstrap', 'bootstrap 5'],
  'Node.js': ['node.js', 'nodejs', 'node js', 'node'],
  Express: ['express', 'express.js', 'expressjs'],
  FastAPI: ['fastapi', 'fast-api', 'fast api'],
  Django: ['django', 'django rest framework', 'drf'],
  Flask: ['flask'],
  'Spring Boot': ['spring boot', 'springboot', 'spring-boot', 'spring framework'],
  NestJS: ['nestjs', 'nest.js'],
  MongoDB: ['mongodb', 'mongo', 'nosql mongodb'],
  PostgreSQL: ['postgresql', 'postgres', 'psql'],
  MySQL: ['mysql', 'my-sql'],
  Redis: ['redis'],
  SQLite: ['sqlite', 'sqlite3'],
  Docker: ['docker', 'dockerfile', 'docker-compose'],
  Kubernetes: ['kubernetes', 'k8s', 'kube'],
  AWS: ['aws', 'amazon web services', 'ec2', 's3', 'lambda'],
  Azure: ['azure', 'microsoft azure'],
  GCP: ['gcp', 'google cloud', 'google cloud platform'],
  Git: ['git', 'github', 'gitlab', 'git version control'],
  Linux: ['linux', 'unix', 'ubuntu', 'bash', 'shell scripting'],
  GraphQL: ['graphql', 'gql'],
  'REST API': ['rest api', 'restful', 'rest apis', 'rest services'],
  Microservices: ['microservices', 'microservice architecture']
};

/**
 * Normalizes a raw skill string into its canonical taxonomy name.
 * If not in taxonomy, returns trimmed title-cased or original string.
 */
function normalizeSkillName(rawName) {
  if (!rawName || typeof rawName !== 'string') return '';
  const clean = rawName.trim().toLowerCase();

  for (const [canonical, aliases] of Object.entries(CANONICAL_TAXONOMY)) {
    if (canonical.toLowerCase() === clean) return canonical;
    for (const alias of aliases) {
      if (alias.toLowerCase() === clean) return canonical;
    }
  }

  // Capitalize first letter of each word if unknown
  return rawName.trim();
}

/**
 * Proficiency level weight hierarchy: advanced > intermediate > beginner
 */
const LEVEL_HIERARCHY = {
  beginner: 1,
  intermediate: 2,
  advanced: 3
};

function compareLevels(levelA, levelB) {
  const scoreA = LEVEL_HIERARCHY[(levelA || 'beginner').toLowerCase()] || 1;
  const scoreB = LEVEL_HIERARCHY[(levelB || 'beginner').toLowerCase()] || 1;
  return scoreA - scoreB;
}

module.exports = {
  CANONICAL_TAXONOMY,
  normalizeSkillName,
  compareLevels,
  LEVEL_HIERARCHY
};
