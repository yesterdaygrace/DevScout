export interface ScoreInput {
  publicRepos: number
  followers: number
  totalStars: number
  languages: number
  recentActivity: boolean
  accountAgeDays: number
  hasWebsite: boolean
  hasBio: boolean
}

export interface ScoreResult {
  total: number
  factors: {
    repositoryQuality: number
    openSourceActivity: number
    languageDiversity: number
    communityEngagement: number
    recentActivity: number
    projectConsistency: number
  }
  strengths: string[]
}

const MAX_REPOS_SCORE = 50
const MAX_FOLLOWERS_SCORE = 5000
const MAX_STARS_SCORE = 10000
const MAX_LANGUAGES = 8
const MAX_ACCOUNT_AGE = 3650

export function calculateScore(input: ScoreInput): ScoreResult {
  const repoScore = Math.min(input.publicRepos / MAX_REPOS_SCORE, 1) * 20
  const communityScore = Math.min(input.followers / MAX_FOLLOWERS_SCORE, 1) * 20
  const starsScore = Math.min(input.totalStars / MAX_STARS_SCORE, 1) * 20
  const langScore = Math.min(input.languages / MAX_LANGUAGES, 1) * 15
  const activityScore = input.recentActivity ? 15 : 0
  const consistencyScore = Math.min(input.accountAgeDays / MAX_ACCOUNT_AGE, 1) * 10

  const total = Math.round(repoScore + communityScore + starsScore + langScore + activityScore + consistencyScore)

  const strengths: string[] = []
  if (input.publicRepos >= 20) strengths.push('Strong repository portfolio')
  if (input.followers >= 100) strengths.push('Significant community reach')
  if (input.totalStars >= 1000) strengths.push('High-impact projects')
  if (input.languages >= 4) strengths.push('Diverse language skills')
  if (input.recentActivity) strengths.push('Active in recent months')
  if (input.hasWebsite) strengths.push('Has portfolio website')
  if (input.hasBio) strengths.push('Complete GitHub profile')

  return {
    total: Math.min(total, 100),
    factors: {
      repositoryQuality: Math.round(repoScore),
      openSourceActivity: Math.round(starsScore),
      languageDiversity: Math.round(langScore),
      communityEngagement: Math.round(communityScore),
      recentActivity: Math.round(activityScore),
      projectConsistency: Math.round(consistencyScore),
    },
    strengths,
  }
}
