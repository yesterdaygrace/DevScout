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
    legend: { position: 'bottom' as const, labels: { padding: 16, font: { size: 12 }, color: '#94A3B8' } },
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
  <div v-if="loading" class="py-12">
    <div class="animate-pulse space-y-8">
      <div class="flex gap-6">
        <div class="w-28 h-28 rounded-full bg-white/10" />
        <div class="flex-1 space-y-3">
          <div class="h-8 w-1/3 bg-white/10 rounded" />
          <div class="h-4 w-1/2 bg-white/5 rounded" />
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="error" class="text-center py-16 rounded-[var(--radius-lg)] border border-red-500/20 bg-red-500/5 text-red-300 text-sm">
    {{ error }}
  </div>

  <div v-else-if="profile" class="space-y-12 lg:space-y-16">
    <!-- Hero — image-dominant, editorial -->
    <section class="flex flex-col lg:flex-row items-start gap-8 lg:gap-10">
      <img :src="profile.avatar_url" :alt="profile.login" class="w-28 h-28 lg:w-36 lg:h-36 rounded-full object-cover ring-1 ring-white/10 shrink-0" loading="lazy" />
      <div class="flex-1 min-w-0">
        <p class="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/30 mb-2">@{{ profile.login }}</p>
        <h1 class="text-section text-white leading-none">{{ profile.name || profile.login }}</h1>
        <p v-if="profile.bio" class="mt-4 text-white/50 text-base max-w-2xl leading-relaxed">{{ profile.bio }}</p>

        <div class="mt-4 flex flex-wrap gap-2 text-xs">
          <span v-if="profile.location" class="px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-white/60">{{ profile.location }}</span>
          <span v-if="profile.company" class="px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-white/60">{{ profile.company }}</span>
          <span class="px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-white/60">{{ profile.public_repos }} repos</span>
          <span class="px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-white/60">{{ profile.followers }} followers · {{ profile.following }} following</span>
          <span v-if="prCount" class="px-3 py-1 rounded-full bg-white text-black font-medium">{{ prCount }} PRs</span>
        </div>

        <div class="mt-3 flex flex-wrap gap-2 text-xs text-white/40">
          <a v-if="profile.blog" :href="profile.blog.startsWith('http') ? profile.blog : 'https://' + profile.blog" target="_blank" rel="noopener" class="hover:text-white underline underline-offset-4">{{ profile.blog }}</a>
          <a v-if="profile.email" :href="'mailto:' + profile.email" class="hover:text-white underline underline-offset-4">{{ profile.email }}</a>
          <a v-if="profile.twitter_username" :href="'https://twitter.com/' + profile.twitter_username" target="_blank" rel="noopener" class="hover:text-white">@{{ profile.twitter_username }}</a>
        </div>

        <div class="mt-6 flex flex-wrap gap-2">
          <button
            @click="shortlistStore.isShortlisted(profile.login) ? shortlistStore.remove(profile.login) : shortlistStore.add(profile.login)"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors cursor-pointer"
            :class="shortlistStore.isShortlisted(profile.login) ? 'bg-white text-black' : 'bg-white text-black hover:bg-white/90'"
          >
            <StarSolid v-if="shortlistStore.isShortlisted(profile.login)" class="w-4 h-4" />
            <StarOutline v-else class="w-4 h-4" />
            {{ shortlistStore.isShortlisted(profile.login) ? 'Shortlisted' : 'Shortlist' }}
          </button>
          <button
            @click="compareStore.add(profile.login)"
            :disabled="compareStore.isSelected(profile.login) || compareStore.usernames.length >= 3"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border border-white/15 text-white hover:bg-white/10 hover:border-white/20 disabled:opacity-30 cursor-pointer"
          >
            <DocumentPlusIcon class="w-4 h-4" />
            {{ compareStore.isSelected(profile.login) ? 'In compare' : 'Compare' }}
          </button>
          <div class="relative">
            <button
              @click="showCollectionPicker = !showCollectionPicker"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border border-white/15 text-white hover:bg-white/10 cursor-pointer"
            >
              <FolderPlusIcon class="w-4 h-4" />
              Add to collection
            </button>
            <div
              v-if="showCollectionPicker"
              class="absolute z-20 mt-2 w-56 bg-[#0F172A] border border-white/10 rounded-[var(--radius-lg)] shadow-2xl overflow-hidden"
            >
              <div class="p-1">
                <div v-if="collectionsStore.collections.length === 0" class="px-3 py-2 text-sm text-white/30">No collections yet</div>
                <button
                  v-for="col in collectionsStore.collections"
                  :key="col.id"
                  @click="addToCollection(col.id)"
                  class="w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-white/[0.06] rounded-[var(--radius-md)] transition-colors cursor-pointer"
                >
                  {{ col.name }}
                </button>
              </div>
            </div>
          </div>
          <a :href="profile.html_url" target="_blank" rel="noopener" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border border-white/15 text-white/60 hover:text-white hover:bg-white/10 cursor-pointer">GitHub →</a>
        </div>
      </div>
    </section>

    <section class="rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.04] p-6 lg:p-8">
      <h2 class="text-headline text-white mb-6">Skill breakdown</h2>
      <div v-if="skillsLoading" class="text-white/40 text-sm">Analyzing repositories…</div>
      <div v-else-if="skills.length === 0" class="text-white/30 text-sm">No language data yet.</div>
      <div v-else class="flex flex-col lg:flex-row items-center gap-8">
        <div class="w-64 h-64 shrink-0">
          <Doughnut :data="chartData" :options="chartOptions" />
        </div>
        <div class="flex-1 space-y-3 w-full">
          <div v-for="skill in skills.slice(0, 8)" :key="skill.language" class="flex items-center gap-3">
            <span class="text-sm font-medium w-28 truncate text-white/80">{{ skill.language }}</span>
            <div class="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div class="h-full rounded-full bg-white" :style="{ width: skill.percentage + '%' }" />
            </div>
            <span class="text-xs text-white/40 w-12 text-right tabular-nums">{{ skill.percentage }}%</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Repository Insights — restrained -->
    <section class="rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.04] p-6 lg:p-8">
      <h2 class="text-headline text-white mb-6 flex items-center gap-2">
        <CodeBracketIcon class="w-5 h-5 text-white/40" />
        Repository insights
      </h2>
      <div v-if="repos.length > 0" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div v-if="mostStarredRepo" class="p-4 rounded-[var(--radius-md)] bg-white border border-white">
          <p class="text-[11px] tracking-[0.12em] uppercase text-black/40 mb-2">Most starred</p>
          <a :href="mostStarredRepo.html_url" target="_blank" class="text-sm font-medium text-black hover:underline truncate block">{{ mostStarredRepo.name }}</a>
          <p class="text-xs text-black/50 mt-1">★ {{ mostStarredRepo.stargazers_count }}</p>
        </div>
        <div v-if="mostForkedRepo" class="p-4 rounded-[var(--radius-md)] bg-white/[0.04] border border-white/10">
          <p class="text-[11px] tracking-[0.12em] uppercase text-white/30 mb-2">Most forked</p>
          <a :href="mostForkedRepo.html_url" target="_blank" class="text-sm font-medium text-white hover:underline truncate block">{{ mostForkedRepo.name }}</a>
          <p class="text-xs text-white/40 mt-1">{{ mostForkedRepo.forks_count }} forks</p>
        </div>
        <div v-if="recentlyUpdatedRepo" class="p-4 rounded-[var(--radius-md)] bg-white/[0.04] border border-white/10">
          <p class="text-[11px] tracking-[0.12em] uppercase text-white/30 mb-2">Recently updated</p>
          <a :href="recentlyUpdatedRepo.html_url" target="_blank" class="text-sm font-medium text-white hover:underline truncate block">{{ recentlyUpdatedRepo.name }}</a>
          <p class="text-xs text-white/40 mt-1">{{ new Date(recentlyUpdatedRepo.updated_at).toLocaleDateString() }}</p>
        </div>
      </div>
      <div v-if="allTopics.length > 0" class="mt-6">
        <p class="text-[11px] tracking-[0.12em] uppercase text-white/30 mb-3">Topics</p>
        <div class="flex flex-wrap gap-1.5">
          <span v-for="topic in allTopics" :key="topic" class="px-3 py-1 bg-white text-black text-xs font-medium rounded-full">{{ topic }}</span>
        </div>
      </div>
      <div v-if="programmingLanguages.length > 0" class="mt-6">
        <p class="text-[11px] tracking-[0.12em] uppercase text-white/30 mb-3">Languages used</p>
        <div class="flex flex-wrap gap-1.5">
          <span v-for="lang in programmingLanguages" :key="lang" class="px-3 py-1 bg-white/10 border border-white/10 text-white/70 text-xs rounded-full">{{ lang }}</span>
        </div>
      </div>
    </section>

    <!-- Candidate Score -->
    <CandidateScoreCard v-if="profile && repos.length > 0" :profile="profile" :repos="repos" />

    <section class="rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.04] p-6 lg:p-8">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-headline text-white">Private note</h2>
        <button
          v-if="!showNoteEditor"
          @click="showNoteEditor = true"
          class="text-sm font-medium px-4 py-2 rounded-full border border-white/15 text-white hover:bg-white hover:text-black transition-colors cursor-pointer"
        >
          {{ notesStore.getNote(profile.login) ? 'Edit' : 'Add note' }}
        </button>
      </div>
      <div v-if="showNoteEditor">
        <MarkdownEditor
          v-model="noteContent"
          v-model:tags="noteTags"
          placeholder="Notes about this developer. Supports **bold**, *italic*, `code`, [links](url)..."
          :rows="6"
        />
        <div class="mt-4 flex gap-2">
          <button @click="saveNote" class="px-6 py-2.5 bg-white text-black rounded-full text-sm font-semibold hover:bg-white/90 cursor-pointer">Save</button>
          <button @click="showNoteEditor = false" class="px-6 py-2.5 border border-white/15 rounded-full text-sm text-white/70 hover:text-white hover:bg-white/10 cursor-pointer">Cancel</button>
        </div>
      </div>
      <div v-else-if="notesStore.getNote(profile.login)" class="rounded-[var(--radius-md)] bg-[#0B1120] border border-white/10 p-4">
        <div class="flex items-center gap-2 mb-3 flex-wrap">
          <span v-for="tag in noteTags" :key="tag" class="px-2.5 py-1 bg-white text-black text-xs font-medium rounded-full">{{ tag }}</span>
        </div>
        <div class="text-sm prose prose-sm prose-invert max-w-none text-white/80" v-html="renderedNote" />
      </div>
      <div v-else class="text-sm text-white/30 py-4">No notes yet — add context only you can see.</div>
    </section>

    <section v-if="repos.length > 0">
      <h2 class="text-headline text-white mb-6">Top repositories</h2>
      <div class="grid gap-3">
        <div
          v-for="(repo, idx) in repos.slice(0, 10)"
          :key="repo.id"
          class="rounded-[var(--radius-lg)] border transition-colors"
          :class="idx === 0 ? 'p-8 bg-white border-white' : 'p-5 bg-white/[0.04] border-white/10 hover:bg-white/[0.06] hover:border-white/15'"
        >
          <a :href="repo.html_url" target="_blank" class="font-medium hover:underline" :class="idx === 0 ? 'text-black text-lg' : 'text-white'">{{ repo.name }}</a>
          <p v-if="repo.description" class="text-sm mt-1 line-clamp-2" :class="idx === 0 ? 'text-black/60' : 'text-white/50'">{{ repo.description }}</p>
          <div class="flex items-center gap-4 mt-3 text-xs" :class="idx === 0 ? 'text-black/40' : 'text-white/30'">
            <span v-if="repo.language" class="px-2 py-1 rounded-full border" :class="idx === 0 ? 'bg-black text-white border-black' : 'bg-white/10 border-white/10 text-white/60'">{{ repo.language }}</span>
            <span>★ {{ repo.stargazers_count }}</span>
            <span>{{ repo.forks_count }} forks</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
