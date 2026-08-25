<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  username?: string
  lastQuery?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  username: 'there',
  lastQuery: null,
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
})
</script>

 <template>
  <section class="py-6 lg:py-8">
    <p class="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/30 mb-4">Workspace — {{ new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }}</p>
    <h1 class="text-hero text-white max-w-3xl">
      {{ greeting }},<br />
      <span class="text-white/60">{{ username }}</span>
    </h1>
    <p class="mt-6 text-subhead text-white/50 max-w-xl leading-relaxed">
      Track candidates, compare developers, and ship your hiring workspace — all in one quiet place.
    </p>
    <div v-if="lastQuery" class="mt-8 flex flex-col items-start gap-3">
      <router-link
        :to="`/search?q=${encodeURIComponent(lastQuery)}`"
        class="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-medium text-white border border-white/15 hover:bg-white/10 hover:border-white/20 transition-colors cursor-pointer"
      >
        Continue — "{{ lastQuery }}"
      </router-link>
    </div>
  </section>
</template>
