import type { User, Claim, DocumentAnalysis } from '@/types'

export const USE_FALLBACKS = process.env.NEXT_PUBLIC_USE_FALLBACKS === 'true'

// --- Fallback document analysis ---

export const FALLBACK_DOCUMENT_ANALYSIS: DocumentAnalysis = {
  extracted_name: 'Sarah Mitchell',
  doc_type: 'passport',
  confidence: 0.95,
  institution: null,
}

// --- Fallback users (representative sample across boroughs for heatmap) ---

export const FALLBACK_USERS: Partial<User>[] = [
  // Demo users
  { node_id: 'BLK-00471-LDN', username: 'dr_osei',    display_name: 'Dr. James Osei',      skill: 'Doctor',   score: 74,  tier: 'verified',     borough: 'Southwark' },
  { node_id: 'BLK-00001-LDN', username: 'nhs_admin',  display_name: 'NHS Emergency Admin', skill: 'Doctor',   score: 100, tier: 'gov_official', borough: 'Westminster' },
  { node_id: 'BLK-00002-LDN', username: 'met_police', display_name: 'Met Police Command',  skill: 'Other',    score: 100, tier: 'gov_official', borough: 'Westminster' },
  // Camden
  { node_id: 'BLK-00101-LDN', username: 'amara_c',    display_name: 'Amara Conteh',        skill: 'Nurse',    score: 62,  tier: 'verified',     borough: 'Camden' },
  { node_id: 'BLK-00102-LDN', username: 'petra_v',    display_name: 'Petra Vasquez',       skill: 'Legal',    score: 55,  tier: 'verified',     borough: 'Camden' },
  // Tower Hamlets
  { node_id: 'BLK-00103-LDN', username: 'rahul_th',   display_name: 'Rahul Singh',         skill: 'Engineer', score: 68,  tier: 'verified',     borough: 'Tower Hamlets' },
  { node_id: 'BLK-00104-LDN', username: 'yasmin_th',  display_name: 'Yasmin Kaur',         skill: 'Doctor',   score: 57,  tier: 'verified',     borough: 'Tower Hamlets' },
  { node_id: 'BLK-00105-LDN', username: 'tom_th',     display_name: 'Tom Bradley',         skill: 'Builder',  score: 53,  tier: 'verified',     borough: 'Tower Hamlets' },
  // Hackney
  { node_id: 'BLK-00106-LDN', username: 'priya_h',    display_name: 'Priya Nair',          skill: 'Doctor',   score: 80,  tier: 'verified',     borough: 'Hackney' },
  { node_id: 'BLK-00107-LDN', username: 'leo_h',      display_name: 'Leo Ferreira',        skill: 'Engineer', score: 60,  tier: 'verified',     borough: 'Hackney' },
  // Lambeth
  { node_id: 'BLK-00108-LDN', username: 'clara_l',    display_name: 'Clara Mensah',        skill: 'Nurse',    score: 65,  tier: 'verified',     borough: 'Lambeth' },
  { node_id: 'BLK-00109-LDN', username: 'david_l',    display_name: 'David Okonkwo',       skill: 'Legal',    score: 71,  tier: 'verified',     borough: 'Lambeth' },
  // Newham
  { node_id: 'BLK-00110-LDN', username: 'fatima_n',   display_name: 'Fatima Al-Rashid',    skill: 'Doctor',   score: 58,  tier: 'verified',     borough: 'Newham' },
  { node_id: 'BLK-00111-LDN', username: 'kwame_n',    display_name: 'Kwame Asante',        skill: 'Builder',  score: 55,  tier: 'verified',     borough: 'Newham' },
  // Islington
  { node_id: 'BLK-00112-LDN', username: 'sara_i',     display_name: 'Sara Johansson',      skill: 'Engineer', score: 88,  tier: 'verified',     borough: 'Islington' },
  { node_id: 'BLK-00113-LDN', username: 'mike_i',     display_name: 'Michael Chen',        skill: 'Doctor',   score: 90,  tier: 'trusted',      borough: 'Islington' },
  // Greenwich
  { node_id: 'BLK-00114-LDN', username: 'ali_g',      display_name: 'Ali Hassan',          skill: 'Builder',  score: 54,  tier: 'verified',     borough: 'Greenwich' },
  // Lewisham
  { node_id: 'BLK-00115-LDN', username: 'nia_le',     display_name: 'Nia Williams',        skill: 'Nurse',    score: 63,  tier: 'verified',     borough: 'Lewisham' },
  // Wandsworth
  { node_id: 'BLK-00116-LDN', username: 'james_w',    display_name: 'James Carter',        skill: 'Legal',    score: 77,  tier: 'verified',     borough: 'Wandsworth' },
  // Croydon
  { node_id: 'BLK-00117-LDN', username: 'bola_cr',    display_name: 'Bola Adeyemi',        skill: 'Doctor',   score: 52,  tier: 'verified',     borough: 'Croydon' },
  { node_id: 'BLK-00118-LDN', username: 'aisha_cr',   display_name: 'Aisha Patel',         skill: 'Engineer', score: 61,  tier: 'verified',     borough: 'Croydon' },
  // Ealing
  { node_id: 'BLK-00119-LDN', username: 'omar_e',     display_name: 'Omar Sheikh',         skill: 'Builder',  score: 58,  tier: 'verified',     borough: 'Ealing' },
  // Haringey
  { node_id: 'BLK-00120-LDN', username: 'grace_ha',   display_name: 'Grace Adebayo',       skill: 'Nurse',    score: 70,  tier: 'verified',     borough: 'Haringey' },
  // Barnet
  { node_id: 'BLK-00121-LDN', username: 'dan_ba',     display_name: 'Daniel Levy',         skill: 'Legal',    score: 66,  tier: 'verified',     borough: 'Barnet' },
  // Brent
  { node_id: 'BLK-00122-LDN', username: 'sunita_br',  display_name: 'Sunita Sharma',       skill: 'Doctor',   score: 59,  tier: 'verified',     borough: 'Brent' },
  // Hammersmith and Fulham
  { node_id: 'BLK-00123-LDN', username: 'joe_hf',     display_name: 'Joseph Mbeki',        skill: 'Engineer', score: 73,  tier: 'verified',     borough: 'Hammersmith and Fulham' },
  // Kensington and Chelsea
  { node_id: 'BLK-00124-LDN', username: 'lena_kc',    display_name: 'Lena Kovacs',         skill: 'Legal',    score: 91,  tier: 'trusted',      borough: 'Kensington and Chelsea' },
  // Waltham Forest
  { node_id: 'BLK-00125-LDN', username: 'tunde_wf',   display_name: 'Tunde Afolabi',       skill: 'Builder',  score: 51,  tier: 'verified',     borough: 'Waltham Forest' },
  // Enfield
  { node_id: 'BLK-00126-LDN', username: 'ivan_en',    display_name: 'Ivan Petrov',         skill: 'Engineer', score: 56,  tier: 'verified',     borough: 'Enfield' },
  // Hounslow
  { node_id: 'BLK-00127-LDN', username: 'kavya_ho',   display_name: 'Kavya Reddy',         skill: 'Doctor',   score: 64,  tier: 'verified',     borough: 'Hounslow' },
]

// --- Fallback claims ---

export const FALLBACK_CLAIMS: Partial<Claim>[] = [
  {
    type: 'credential',
    status: 'verified',
    doc_type: 'degree',
    extracted_name: 'Dr. James Osei',
    extracted_institution: 'UCL Medicine',
    confidence: 0.92,
    vouches: 3,
    flags: 0,
  },
]

export function withFallback<T>(live: T, fallback: T): T {
  return USE_FALLBACKS ? fallback : live
}
