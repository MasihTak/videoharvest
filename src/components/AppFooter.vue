<template>
  <footer
    class="app-footer d-flex flex-wrap align-items-center justify-content-between gap-2 border-top"
  >
    <div class="d-flex flex-wrap align-items-center gap-3 small">
      <span class="text-muted">
        VideoHarvest — open-source yt-dlp GUI
      </span>
      <a
        href="https://github.com/MasihTak"
        target="_blank"
        rel="noopener noreferrer"
        class="footer-link"
      >Made by MasihTak</a>
    </div>

    <div class="d-flex flex-wrap align-items-center gap-3 small">
      <a
        href="https://github.com/MasihTak/videoharvest/blob/main/LICENSE"
        target="_blank"
        rel="noopener noreferrer"
        class="footer-link"
      >MIT License</a>
      <a
        href="https://github.com/MasihTak/videoharvest/issues/new"
        target="_blank"
        rel="noopener noreferrer"
        class="footer-link"
      >Report an Issue</a>
      <a
        href="https://github.com/MasihTak/videoharvest"
        target="_blank"
        rel="noopener noreferrer"
        class="footer-link"
      ><i
        class="bi bi-star"
        aria-hidden="true"
      /> Star on GitHub</a>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  padding: 0.625rem 2rem;
  background-color: var(--bs-body-bg);
}

.footer-link {
  color: var(--vh-muted);
  text-decoration: none;
  transition: color 0.15s cubic-bezier(0.25, 1, 0.5, 1);
}

.footer-link:hover {
  color: var(--vh-ink);
}

.footer-link:focus-visible {
  outline: 2px solid var(--vh-primary);
  outline-offset: 2px;
}
</style>
