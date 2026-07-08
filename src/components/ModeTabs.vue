<script setup>
defineProps({
  modelValue: { type: String, required: true },
  modes: {
    type: Array,
    default: () => [
      { key: "full", label: "Full video" },
      { key: "video", label: "Video only" },
      { key: "audio", label: "Audio only" },
    ],
  },
});

defineEmits(["update:modelValue"]);
</script>

<template>
  <div
    class="mode-tabs"
    role="group"
    aria-label="Format type"
  >
    <button
      v-for="m in modes"
      :key="m.key"
      type="button"
      class="mode-tab"
      :class="{ 'is-active': modelValue === m.key }"
      :aria-pressed="modelValue === m.key"
      @click="$emit('update:modelValue', m.key)"
    >
      {{ m.label }}
    </button>
  </div>
</template>

<style scoped>
.mode-tabs {
  display: flex;
  background: var(--bs-secondary-bg);
  border-radius: var(--bs-border-radius);
  padding: 3px;
  gap: 2px;
  margin-bottom: 0.75rem;
}

.mode-tab {
  flex: 1;
  padding: 0.35rem 0.75rem;
  border: none;
  border-radius: calc(var(--bs-border-radius) - 2px);
  background: transparent;
  color: var(--vh-muted);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.15s cubic-bezier(0.25, 1, 0.5, 1),
    color 0.15s cubic-bezier(0.25, 1, 0.5, 1),
    box-shadow 0.15s cubic-bezier(0.25, 1, 0.5, 1),
    transform 120ms cubic-bezier(0.23, 1, 0.32, 1);
}

.mode-tab:hover:not(.is-active) {
  color: var(--vh-ink);
}

.mode-tab:focus-visible {
  outline: 2px solid var(--vh-primary);
  outline-offset: -2px;
}

.mode-tab:active {
  transform: scale(0.97);
}

.mode-tab.is-active {
  background: var(--bs-body-bg);
  color: var(--vh-ink);
  box-shadow:
    0 1px 3px oklch(0.18 0.014 25 / 0.12),
    0 0 0 1px oklch(0.18 0.014 25 / 0.05);
}

@media (prefers-reduced-motion: reduce) {
  .mode-tab {
    transition: none;
  }
}
</style>
