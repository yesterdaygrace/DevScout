// Re-export everything from the service layer
// This preserves backward compatibility for any existing imports from api/github
export {
  searchUsers,
  getUser,
  getUserRepos,
  getRepoLanguages,
  getSkillBreakdown,
  getGitHubToken,
  isUsingPAT,
  onRateLimitUpdate,
} from '../services/githubService'

// Re-export utilities
export { Cache } from '../utils/cache'
export { withRetry } from '../utils/retry'
export { httpClient, requestWithRetry } from './httpClient'
