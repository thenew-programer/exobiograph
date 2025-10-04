/**
 * Valid academic and research institution email domains and patterns
 * Used for email verification system
 */

export const ACADEMIC_EMAIL_PATTERNS = [
  // Educational domains
  '.edu',           // United States educational institutions
  '.ac.',           // Academic institutions (UK, Australia, New Zealand, etc.)
  '.edu.',          // Educational institutions (various countries)
  
  // University patterns
  'uni-',           // University domains (Germany, etc.)
  'university.',    // University domains
  'univ-',          // University domains (France, etc.)
  'research.',      // Research institutions
  
  // Country-specific academic domains
  '.ac.uk',         // United Kingdom - Academic
  '.ac.jp',         // Japan - Academic
  '.ac.kr',         // South Korea - Academic
  '.ac.cn',         // China - Academic
  '.ac.in',         // India - Academic
  '.ac.nz',         // New Zealand - Academic
  '.ac.za',         // South Africa - Academic
  '.ac.il',         // Israel - Academic
  '.ac.be',         // Belgium - Academic
  '.ac.th',         // Thailand - Academic
  
  // Educational domains by country
  '.edu.au',        // Australia
  '.edu.br',        // Brazil
  '.edu.in',        // India
  '.edu.sg',        // Singapore
  '.edu.my',        // Malaysia
  '.edu.pk',        // Pakistan
  '.edu.eg',        // Egypt
  '.edu.mx',        // Mexico
  '.edu.ar',        // Argentina
  '.edu.co',        // Colombia
  '.edu.ph',        // Philippines
  '.edu.tr',        // Turkey
  '.edu.sa',        // Saudi Arabia
  '.edu.vn',        // Vietnam
  '.edu.tw',        // Taiwan
  '.edu.hk',        // Hong Kong
];

export const RESEARCH_INSTITUTIONS = [
  // Space Agencies
  'nasa.gov',           // NASA (United States)
  'esa.int',            // European Space Agency
  'jaxa.jp',            // Japan Aerospace Exploration Agency
  'cnes.fr',            // French Space Agency
  'dlr.de',             // German Aerospace Center
  'isro.gov.in',        // Indian Space Research Organisation
  'asc-csa.gc.ca',      // Canadian Space Agency
  
  // Major Research Organizations
  'cern.ch',            // European Organization for Nuclear Research
  'nih.gov',            // US National Institutes of Health
  'nsf.gov',            // US National Science Foundation
  'cnrs.fr',            // French National Center for Scientific Research
  'inria.fr',           // French Institute for Research in Computer Science
  'mpg.de',             // Max Planck Society (Germany)
  'csiro.au',           // Australian research
  'riken.jp',           // RIKEN (Japan)
  'nrc-cnrc.gc.ca',     // National Research Council Canada
  'csic.es',            // Spanish National Research Council
  'cnr.it',             // Italian National Research Council
  
  // Top Universities Worldwide
  // United States
  'caltech.edu',        // California Institute of Technology
  'mit.edu',            // Massachusetts Institute of Technology
  'stanford.edu',       // Stanford University
  'harvard.edu',        // Harvard University
  'yale.edu',           // Yale University
  'princeton.edu',      // Princeton University
  'ucla.edu',           // University of California, Los Angeles
  'berkeley.edu',       // University of California, Berkeley
  'utexas.edu',         // University of Texas at Austin
  
  // United Kingdom
  'ox.ac.uk',           // Oxford University
  'cam.ac.uk',          // Cambridge University
  'imperial.ac.uk',     // Imperial College London
  
  // Europe
  'ethz.ch',            // ETH Zurich (Switzerland)
  'epfl.ch',            // EPFL (Switzerland)
  'tudelft.nl',         // Delft University of Technology (Netherlands)
  'kth.se',             // KTH Royal Institute of Technology (Sweden)
  
  // Asia
  'u-tokyo.ac.jp',      // University of Tokyo (Japan)
  'nus.edu.sg',         // National University of Singapore
  'ntu.edu.sg',         // Nanyang Technological University (Singapore)
  'iisc.ac.in',         // Indian Institute of Science
  
  // Africa
  'uca.ac.ma',          // University Cadi Ayyad (Morocco)
  
  // Australia
  'monash.edu',         // Monash University
  'uwa.edu.au',         // University of Western Australia
  
  // Canada
  'utoronto.ca',        // University of Toronto
  'mcgill.ca',          // McGill University
  'ubc.ca',             // University of British Columbia
  'uwo.ca',             // University of Western Ontario
];

/**
 * Validates if an email is from an academic or research institution
 * @param email - Email address to validate
 * @returns true if email is from a valid institution
 */
export function isAcademicEmail(email: string): boolean {
  const normalizedEmail = email.toLowerCase().trim();
  
  // Check against academic patterns
  const matchesPattern = ACADEMIC_EMAIL_PATTERNS.some(pattern => 
    normalizedEmail.includes(pattern)
  );
  
  // Check against known research institutions
  const matchesInstitution = RESEARCH_INSTITUTIONS.some(institution => 
    normalizedEmail.endsWith(institution)
  );
  
  return matchesPattern || matchesInstitution;
}

/**
 * Gets a hint message for invalid email domains
 */
export function getAcademicEmailHint(): string {
  return 'Accepted domains include: .edu, .ac.uk, .edu.au, university emails, or known research institutions (NASA, ESA, CERN, etc.)';
}

/**
 * Extracts institution domain from email for display
 */
export function getInstitutionDomain(email: string): string {
  const parts = email.toLowerCase().split('@');
  return parts.length === 2 ? parts[1] : '';
}
