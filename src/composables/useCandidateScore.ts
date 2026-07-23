import type { GitHubUser, GitHubRepo } from '../types/github'

export interface ScoreFactor {
  name: string
  score: number
  weight: number
  description: string
  detail: string
  icon: string
}

export interface CandidateScoreResult {
  total: number
  strengths: string[]
  weaknesses: string[]
  factors: ScoreFactor[]
  rank: string
  rankColor: string
}

export function useCandidateScore() {
  function calculateScore(profile: GitHubUser, repos: GitHubRepo[]): CandidateScoreResult {
    const factors: ScoreFactor[] = []

    // 1. Repository Quality (weight: 20%)
    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0)
    const avgStars = repos.length > 0 ? Math.round(totalStars / repos.length) : 0
    const topRepoStars = Math.max(...repos.map(r => r.stargazers_count), 0)
    const forkedRepos = repos.filter(r => r.fork).length
    const forkRatio = repos.length > 0 ? forkedRepos / repos.length : 0

    let qualityScore = 10
    let qualityDetail = ''
    if (totalStars > 10000) { qualityScore = 100; qualityDetail = 'Exceptional star count across repos' }
    else if (totalStars > 5000) { qualityScore = 90; qualityDetail = 'Very high star accumulation' }
    else if (totalStars > 1000) { qualityScore = 75; qualityDetail = 'Strong star count' }
    else if (totalStars > 500) { qualityScore = 60; qualityDetail = 'Moderate star count' }
    else if (totalStars > 100) { qualityScore = 40; qualityDetail = 'Some popular repos' }
    else { qualityDetail = 'Limited star history' }

    // Adjust for fork ratio (too many forks = less original work)
    if (forkRatio > 0.7 && qualityScore > 40) qualityScore = Math.max(30, qualityScore - 20)
    if (forkRatio < 0.3) qualityScore = Math.min(100, qualityScore + 5)

    factors.push({
      name: 'Repository Quality',
      score: qualityScore,
      weight: 0.20,
      description: `${totalStars} total stars · avg ${avgStars}/repo · top repo ${topRepoStars} stars`,
      detail: qualityDetail,
      icon: '⭐'
    })

    // 2. Open Source Activity (weight: 15%)
    const originalRepos = repos.filter(repo => !repo.fork)
    const originalRatio = repos.length > 0 ? (originalRepos.length / repos.length) * 100 : 0
    let osScore = 10
    let osDetail = ''
    if (originalRatio > 90) { osScore = 100; osDetail = 'Nearly all original projects' }
    else if (originalRatio > 70) { osScore = 80; osDetail = 'Mostly original work' }
    else if (originalRatio > 50) { osScore = 60; osDetail = 'Balanced original and forked repos' }
    else if (originalRatio > 20) { osScore = 40; osDetail = 'Some original projects' }
    else { osDetail = 'Primarily forked repositories' }

    factors.push({
      name: 'Open Source Activity',
      score: osScore,
      weight: 0.15,
      description: `${Math.round(originalRatio)}% original repos (${originalRepos.length}/${repos.length})`,
      detail: osDetail,
      icon: '🔗'
    })

    // 3. Language Diversity (weight: 10%)
    const languages = new Set(
      repos
        .map(repo => repo.language)
        .filter((lang): lang is string => lang !== null)
    )
    const languageCount = languages.size
    let langScore = 10
    let langDetail = ''
    if (languageCount > 8) { langScore = 100; langDetail = 'Polyglot — broad language expertise' }
    else if (languageCount > 5) { langScore = 80; langDetail = 'Multi-language proficiency' }
    else if (languageCount > 3) { langScore = 60; langDetail = 'Comfortable in several languages' }
    else if (languageCount > 1) { langScore = 40; langDetail = 'Works with a couple languages' }
    else if (languageCount === 1) { langScore = 15; langDetail = 'Focused on one language' }

    factors.push({
      name: 'Language Diversity',
      score: langScore,
      weight: 0.10,
      description: `${languageCount} programming languages: ${[...languages].slice(0, 5).join(', ')}${languageCount > 5 ? '...' : ''}`,
      detail: langDetail,
      icon: '📐'
    })

    // 4. Community Engagement (weight: 20%)
    const followerCount = profile.followers
    let engagementScore = 10
    let engagementDetail = ''
    if (followerCount > 5000) { engagementScore = 100; engagementDetail = 'Industry-recognized influencer' }
    else if (followerCount > 1000) { engagementScore = 85; engagementDetail = 'Significant community reach' }
    else if (followerCount > 500) { engagementScore = 70; engagementDetail = 'Growing community presence' }
    else if (followerCount > 100) { engagementScore = 50; engagementDetail = 'Building community traction' }
    else if (followerCount > 20) { engagementScore = 30; engagementDetail = 'Early community building' }
    else { engagementDetail = 'Minimal community presence yet' }

    // Factor following ratio
    const followingRatio = profile.following > 0 ? followerCount / profile.following : followerCount
    if (followingRatio > 5) engagementScore = Math.min(100, engagementScore + 5)

    factors.push({
      name: 'Community Engagement',
      score: engagementScore,
      weight: 0.20,
      description: `${followerCount} followers · following ${profile.following} · ratio ${followingRatio.toFixed(1)}x`,
      detail: engagementDetail,
      icon: '👥'
    })

    // 5. Recent Activity (weight: 20%)
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const recent3m = repos.filter(repo => new Date(repo.updated_at) >= threeMonthsAgo).length
    const recent6m = repos.filter(repo => {
      const d = new Date(repo.updated_at)
      return d >= sixMonthsAgo && d < threeMonthsAgo
    }).length

    const activityRatio = repos.length > 0 ? (recent3m / repos.length) * 100 : 0
    let activityScore = 10
    let activityDetail = ''
    if (activityRatio > 80) { activityScore = 100; activityDetail = `Actively maintained — ${recent3m} repos updated recently` }
    else if (activityRatio > 50) { activityScore = 75; activityDetail = `Regular activity — ${recent3m} repos active in 3 months` }
    else if (activityRatio > 20) { activityScore = 50; activityDetail = `Some recent activity — ${recent3m} repos updated` }
    else if (activityRatio > 5) { activityScore = 25; activityDetail = 'Minimal recent activity' }
    else { activityDetail = 'No recent repository activity detected' }

    factors.push({
      name: 'Recent Activity',
      score: activityScore,
      weight: 0.20,
      description: `${recent3m} repos active in 3mo, ${recent6m} in 3-6mo`,
      detail: activityDetail,
      icon: '⚡'
    })

    // 6. Project Consistency (weight: 15%)
    const repoCount = profile.public_repos
    let consistencyScore = 10
    let consistencyDetail = ''
    if (repoCount > 80) { consistencyScore = 100; consistencyDetail = 'Prolific contributor with extensive portfolio' }
    else if (repoCount > 50) { consistencyScore = 85; consistencyDetail = 'Very active project creator' }
    else if (repoCount > 30) { consistencyScore = 70; consistencyDetail = 'Consistent project contributor' }
    else if (repoCount > 15) { consistencyScore = 50; consistencyDetail = 'Regular project activity' }
    else if (repoCount > 5) { consistencyScore = 30; consistencyDetail = 'Early stage portfolio' }
    else { consistencyDetail = 'Just getting started with public repos' }

    // Check for pinned/notable repos by looking at descriptions
    const describedRepos = repos.filter(r => r.description && r.description.length > 20).length
    const descRatio = repos.length > 0 ? describedRepos / repos.length : 0
    if (descRatio > 0.5 && consistencyScore > 30) consistencyScore = Math.min(100, consistencyScore + 5)

    factors.push({
      name: 'Project Consistency',
      score: consistencyScore,
      weight: 0.15,
      description: `${repoCount} public repos · ${describedRepos} with detailed descriptions`,
      detail: consistencyDetail,
      icon: '📊'
    })

    // Calculate total weighted score
    const total = Math.round(
      factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0)
    )
    const clampedTotal = Math.max(0, Math.min(100, total))

    // Strengths (factors with score >= 65)
    const strengths = factors
      .filter(f => f.score >= 65)
      .map(f => `${f.icon} ${f.detail}`)

    // Weaknesses (factors with score < 40)
    const weaknesses = factors
      .filter(f => f.score < 40)
      .map(f => `${f.icon} ${f.detail}`)

    // Rank
    let rank: string
    let rankColor: string
    if (clampedTotal > 85) { rank = 'Exceptional'; rankColor = 'text-green-600 dark:text-green-400' }
    else if (clampedTotal > 70) { rank = 'Strong'; rankColor = 'text-emerald-600 dark:text-emerald-400' }
    else if (clampedTotal > 55) { rank = 'Solid'; rankColor = 'text-blue-600 dark:text-blue-400' }
    else if (clampedTotal > 40) { rank = 'Developing'; rankColor = 'text-amber-600 dark:text-amber-400' }
    else { rank = 'Emerging'; rankColor = 'text-gray-600 dark:text-gray-400' }

    return {
      total: clampedTotal,
      strengths,
      weaknesses,
      factors,
      rank,
      rankColor
    }
  }

  function getScoreColor(score: number): string {
    if (score > 70) return 'text-green-600 dark:text-green-400'
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  function getScoreLabel(score: number): string {
    if (score > 85) return 'Exceptional'
    if (score > 70) return 'Strong'
    if (score > 55) return 'Solid'
    if (score > 40) return 'Developing'
    return 'Emerging'
  }

  return {
    calculateScore,
    getScoreColor,
    getScoreLabel
  }
}
