<template>
  <RouterLink to="/" class="wordmark" aria-label="orquestador, inicio">
    orquestador<span class="wordmark__caret" aria-hidden="true" />
  </RouterLink>
</template>

<style scoped>
.wordmark {
  display: inline-flex;
  align-items: center;
  font-size: var(--text-lg);
  font-weight: 600;
  letter-spacing: var(--tracking-tight);
  text-decoration: none;
}

.wordmark__caret {
  width: 0.5em;
  height: 1.05em;
  margin-left: 3px;
  border-radius: 1.5px;
  background: currentColor;
}
</style>
