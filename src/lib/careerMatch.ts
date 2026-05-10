// Maps user-selected interests (from Onboarding) to KUCCPS clusters / career titles
export const interestToClusters: Record<string, string[]> = {
  Engineering: ["Engineering & Technology", "Applied Sciences"],
  Medicine: ["Health Sciences"],
  Technology: ["Engineering & Technology", "Pure Sciences"],
  "Arts & Design": ["Applied Sciences", "Humanities & Social Sciences"],
  Business: ["Business & Commerce"],
  Sports: ["Education", "Health Sciences"],
  Music: ["Humanities & Social Sciences", "Applied Sciences"],
  Writing: ["Humanities & Social Sciences"],
  Coding: ["Engineering & Technology", "Pure Sciences"],
  Robotics: ["Engineering & Technology"],
  Environment: ["Agriculture & Environment", "Pure Sciences"],
  Law: ["Law"],
  Teaching: ["Education"],
  Agriculture: ["Agriculture & Environment"],
  "Media & Journalism": ["Humanities & Social Sciences"],
  Entrepreneurship: ["Business & Commerce"],
};

export const interestKeywords: Record<string, string[]> = {
  Coding: ["software", "data", "cyber", "computer"],
  Robotics: ["engineer", "mechatronic", "robot"],
  Medicine: ["medic", "nurs", "pharm", "health"],
  Law: ["law"],
  Teaching: ["teach", "education"],
  "Media & Journalism": ["journal", "media", "communic"],
  Entrepreneurship: ["business", "market", "account"],
  Environment: ["environ", "agric", "climate"],
  Agriculture: ["agric", "farm"],
  "Arts & Design": ["architect", "design", "art"],
};

export type Career = {
  id: string;
  title: string;
  cluster: string;
  description?: string | null;
  required_subjects?: string[] | null;
};

export function scoreCareer(
  career: Career,
  subjects: string[],
  interests: string[]
): number {
  let score = 0;
  const reqs = (career.required_subjects || []).map((s) => s.toLowerCase());
  const subs = subjects.map((s) => s.toLowerCase());
  const overlap = reqs.filter((r) => subs.some((s) => r.includes(s) || s.includes(r))).length;
  score += overlap * 3;

  const titleDesc = `${career.title} ${career.description ?? ""}`.toLowerCase();
  for (const interest of interests) {
    const clusters = interestToClusters[interest] || [];
    if (clusters.includes(career.cluster)) score += 4;
    const kws = interestKeywords[interest] || [];
    if (kws.some((k) => titleDesc.includes(k))) score += 2;
  }
  return score;
}

export function recommendCareers(
  careers: Career[],
  subjects: string[],
  interests: string[],
  limit = 6
) {
  return careers
    .map((c) => ({ career: c, score: scoreCareer(c, subjects, interests) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
