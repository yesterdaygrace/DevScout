<script setup lang="ts">
import { onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useGitHubProfile } from '../composables/useGitHubApi'
import { getUserPRs } from '../services/githubService'
import { useSkillBreakdown } from '../composables/useSkillBreakdown'
import { useShortlistStore } from '../stores/shortlist'
import { useNotesStore } from '../stores/notes'
import { useCompareStore } from '../stores/compare'
import { useRecentlyViewedStore } from '../stores/recentlyViewed'
import { useCollectionsStore } from '../stores/collections'
import CandidateScoreCard from '../components/CandidateScoreCard.vue'
import MarkdownEditor from '../components/MarkdownEditor.vue'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { marked } from 'marked'
import { StarIcon as StarOutline, DocumentPlusIcon, CodeBracketIcon, FolderPlusIcon } from '@heroicons/vue/24/outline'
import { StarIcon as StarSolid } from '@heroicons/vue/24/solid'
import { ref } from 'vue'

ChartJS.register(ArcElement, Tooltip, Legend)

const renderedNote = computed(() => {
  if (!noteContent.value) return ''
  return marked.parse(noteContent.value)
})

const route = useRoute()
const username = computed(() => route.params.username as string)
const { profile, repos, loading, error, load } = useGitHubProfile()
const { skills, loading: skillsLoading, load: loadSkills } = useSkillBreakdown()
const shortlistStore = useShortlistStore()
const notesStore = useNotesStore()
const compareStore = useCompareStore()
const recentlyViewedStore = useRecentlyViewedStore()
const collectionsStore = useCollectionsStore()
const noteContent = ref('')
const noteTags = ref<string[]>([])
const showNoteEditor = ref(false)
const showCollectionPicker = ref(false)

async function addToCollection(collectionId: string) {
  await collectionsStore.addMember(collectionId, profile.value!.login)
  showCollectionPicker.value = false
}

const mostStarredRepo = computed(() =>
  repos.value.length > 0
    ? [...repos.value].sort((a, b) => b.stargazers_count - a.stargazers_count)[0]
    : null
)

const mostForkedRepo = computed(() =>
  repos.value.length > 0
    ? [...repos.value].sort((a, b) => b.forks_count - a.forks_count)[0]
    : null
)

const recentlyUpdatedRepo = computed(() =>
  repos.value.length > 0
    ? [...repos.value].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]
    : null
)

const allTopics = computed(() => {
  const topicSet = new Set<string>()
  repos.value.slice(0, 20).forEach(repo => repo.topics?.forEach(t => topicSet.add(t)))
  return Array.from(topicSet).slice(0, 15)
})

const prCount = ref(0)

const totalOpenIssues = computed(() =>
  repos.value.reduce((sum, r) => sum + (r.open_issues_count || 0), 0)
)

const programmingLanguages = computed(() => {
  const langSet = new Set<string>()
  repos.value.slice(0, 30).forEach(repo => {
    if (repo.language) langSet.add(repo.language)
  })
  return Array.from(langSet).sort()
})

const chartData = computed(() => ({
  labels: skills.value.slice(0, 8).map(s => s.language),
  datasets: [{
    data: skills.value.slice(0, 8).map(s => s.percentage),
    backgroundColor: [
      '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
      '#ec4899', '#f43f5e', '#f97316', '#eab308',
    ],
    borderWidth: 0,
  }],
}))

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { position: 'bottom' as const, labels: { padding: 16, font: { size: 12 } } },
  },
}

async function loadProfile() {
  await Promise.all([
    load(username.value),
    loadSkills(username.value),
    shortlistStore.fetch(),
    notesStore.fetch(),
    getUserPRs(username.value).then(n => { prCount.value = n }).catch(() => {}),
    collectionsStore.fetch(),
  ])
  const existingNote = notesStore.getNote(username.value)
  if (existingNote) {
    noteContent.value = existingNote.content
    noteTags.value = existingNote.tags || []
  }
  recentlyViewedStore.add(username.value)
}

async function saveNote() {
  await notesStore.upsert(username.value, noteContent.value, noteTags.value)
  showNoteEditor.value = false
}

onMounted(loadProfile)
watch(username, loadProfile)
</script>

<template>
  <div v-if="loading" class="text-center py-12 text-gray-500">
    <div class="animate-pulse space-y-8">
      <div class="flex flex-col sm:flex-row items-start gap-6">
        <div class="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" aria-hidden="true" />
        <div class="flex-1 space-y-3 flex-1">
          <div class="h-8 w-1/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" aria-hidden="true" />
          <div class="h-4 w-1/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" aria-hidden="true" />
          <div class="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" aria-hidden="true" />
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="error" class="text-center py-12 text-red-500">
    {{ error }}
  </div>

  <div v-else-if="profile" class="space-y-8">
    <div class="flex flex-col sm:flex-row items-start gap-6">
      <img :src="profile.avatar_url" :alt="profile.login" class="w-24 h-24 rounded-full" loading="lazy" />
      <div class="flex-1">
        <h1 class="text-2xl font-bold">{{ profile.name || profile.login }}</h1>
        <p class="text-gray-500">@{{ profile.login }}</p>
        <p v-if="profile.bio" class="mt-2 text-gray-600 dark:text-gray-300">{{ profile.bio }}</p>
        <div class="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
          <span v-if="profile.location">{{ profile.location }}</span>
          <span v-if="profile.company" class="flex items-center gap-1">🏢 {{ profile.company }}</span>
          <span>{{ profile.public_repos }} public repos</span>
          <span>{{ profile.followers }} followers</span>
          <span>{{ profile.following }} following</span>
          <span>{{ totalOpenIssues }} open issues</span>
          <span v-if="prCount">{{ prCount }} PRs</span>
        </div>
        <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <a v-if="profile.blog" :href="profile.blog.startsWith('http') ? profile.blog : 'https://' + profile.blog" target="_blank" rel="noopener" class="text-indigo-500 hover:underline">
            🌐 {{ profile.blog }}
          </a>
          <a v-if="profile.email" :href="'mailto:' + profile.email" class="text-indigo-500 hover:underline">
            📧 {{ profile.email }}
          </a>
          <a v-if="profile.twitter_username" :href="'https://twitter.com/' + profile.twitter_username" target="_blank" rel="noopener" class="text-indigo-500 hover:underline">
            🐦 @{{ profile.twitter_username }}
          </a>
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          <button
            @click="shortlistStore.isShortlisted(profile.login) ? shortlistStore.remove(profile.login) : shortlistStore.add(profile.login)"
            class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border"
            :class="shortlistStore.isShortlisted(profile.login) ? 'bg-yellow-50 border-yellow-300 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-600 dark:text-yellow-400' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'"
          >
            <StarSolid v-if="shortlistStore.isShortlisted(profile.login)" class="w-4 h-4" />
            <StarOutline v-else class="w-4 h-4" />
            {{ shortlistStore.isShortlisted(profile.login) ? 'Shortlisted' : 'Shortlist' }}
          </button>
          <button
            @click="compareStore.add(profile.login)"
            :disabled="compareStore.isSelected(profile.login) || compareStore.usernames.length >= 3"
            class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30"
          >
            <DocumentPlusIcon class="w-4 h-4" />
            {{ compareStore.isSelected(profile.login) ? 'Added to Compare' : 'Compare' }}
          </button>
          <div class="relative inline-block">
            <button
              @click="showCollectionPicker = !showCollectionPicker"
              class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <FolderPlusIcon class="w-4 h-4" />
              Add to Collection
            </button>
            <div
              v-if="showCollectionPicker"
              class="absolute z-20 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto"
            >
              <div class="p-1">
                <div v-if="collectionsStore.collections.length === 0" class="px-3 py-2 text-sm text-gray-400">
                  No collections yet
                </div>
                <button
                  v-for="col in collectionsStore.collections"
                  :key="col.id"
                  @click="addToCollection(col.id)"
                  class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  {{ col.name }}
                </button>
              </div>
            </div>
          </div>
          <a
            :href="profile.html_url"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            GitHub Profile →
          </a>
        </div>
      </div>
    </div>

    <section>
      <h2 class="text-lg font-semibold mb-3">Skill Breakdown</h2>
      <div v-if="skillsLoading" class="text-gray-400">Analyzing repositories...</div>
      <div v-else-if="skills.length === 0" class="text-gray-400 text-sm">No language data available.</div>
      <div v-else class="flex flex-col sm:flex-row items-center gap-8">
        <div class="w-64 h-64">
          <Doughnut :data="chartData" :options="chartOptions" />
        </div>
        <div class="flex-1 space-y-2 w-full">
          <div v-for="skill in skills.slice(0, 8)" :key="skill.language" class="flex items-center gap-3">
            <span class="text-sm font-medium w-24 truncate">{{ skill.language }}</span>
            <div class="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full bg-indigo-500"
                :style="{ width: skill.percentage + '%' }"
              />
            </div>
            <span class="text-xs text-gray-500 w-12 text-right">{{ skill.percentage }}%</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Repository Insights -->
    <section class="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <CodeBracketIcon class="w-5 h-5 text-indigo-500" />
        Repository Insights
      </h2>
      <div v-if="repos.length > 0" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div v-if="mostStarredRepo" class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Most Starred</p>
          <a :href="mostStarredRepo.html_url" target="_blank" class="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline truncate block">
            {{ mostStarredRepo.name }}
          </a>
          <p class="text-xs text-gray-400 mt-1">★ {{ mostStarredRepo.stargazers_count }}</p>
        </div>
        <div v-if="mostForkedRepo" class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Most Forked</p>
          <a :href="mostForkedRepo.html_url" target="_blank" class="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline truncate block">
            {{ mostForkedRepo.name }}
          </a>
          <p class="text-xs text-gray-400 mt-1">{{ mostForkedRepo.forks_count }} forks</p>
        </div>
        <div v-if="recentlyUpdatedRepo" class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Recently Updated</p>
          <a :href="recentlyUpdatedRepo.html_url" target="_blank" class="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline truncate block">
            {{ recentlyUpdatedRepo.name }}
          </a>
          <p class="text-xs text-gray-400 mt-1">{{ new Date(recentlyUpdatedRepo.updated_at).toLocaleDateString() }}</p>
        </div>
      </div>
      <div v-if="allTopics.length > 0" class="mt-4">
        <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Topics</p>
        <div class="flex flex-wrap gap-1.5">
          <span v-for="topic in allTopics" :key="topic" class="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs rounded-full">
            {{ topic }}
          </span>
        </div>
      </div>
      <div v-if="programmingLanguages.length > 0" class="mt-4">
        <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Languages Used</p>
        <div class="flex flex-wrap gap-1.5">
          <span v-for="lang in programmingLanguages" :key="lang" class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
            {{ lang }}
          </span>
        </div>
      </div>
    </section>

    <!-- Candidate Score -->
    <CandidateScoreCard v-if="profile && repos.length > 0" :profile="profile" :repos="repos" />

    <section>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-semibold">Private Note</h2>
        <button
          v-if="!showNoteEditor"
          @click="showNoteEditor = true"
          class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          {{ notesStore.getNote(profile.login) ? 'Edit' : 'Add Note' }}
        </button>
      </div>
      <div v-if="showNoteEditor">
        <MarkdownEditor
          v-model="noteContent"
          v-model:tags="noteTags"
          placeholder="Notes about this developer. Supports **bold**, *italic*, `code`, [links](url)..."
          :rows="6"
        />
        <div class="mt-3 flex gap-2">
          <button @click="saveNote" class="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
            Save
          </button>
          <button @click="showNoteEditor = false" class="px-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
            Cancel
          </button>
        </div>
      </div>
      <div v-else-if="notesStore.getNote(profile.login)" class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div class="flex items-center gap-2 mb-2 flex-wrap">
          <span v-for="tag in noteTags" :key="tag" class="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs rounded-full">
            {{ tag }}
          </span>
        </div>
        <div class="text-sm prose prose-sm dark:prose-invert max-w-none" v-html="renderedNote" />
      </div>
      <div v-else class="text-sm text-gray-400">No notes yet.</div>
    </section>

    <section v-if="repos.length > 0">
      <h2 class="text-lg font-semibold mb-3">Top Repositories</h2>
      <div class="grid gap-3">
        <div
          v-for="repo in repos.slice(0, 10)"
          :key="repo.id"
          class="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <a :href="repo.html_url" target="_blank" class="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
            {{ repo.name }}
          </a>
          <p v-if="repo.description" class="text-sm text-gray-500 mt-1">{{ repo.description }}</p>
          <div class="flex items-center gap-4 mt-2 text-xs text-gray-400">
            <span v-if="repo.language">{{ repo.language }}</span>
            <span>★ {{ repo.stargazers_count }}</span>
            <span>{{ repo.forks_count }} forks</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
