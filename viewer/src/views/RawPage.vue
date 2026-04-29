<template>
  <div class="h-screen flex flex-col">
    <header
      class="flex items-center justify-between px-8 shrink-0"
      style="height: 48px; background: var(--bg-dark); border-bottom: 1px solid rgba(255,255,255,0.06);"
    >
      <span style="font-family: 'Cormorant Garamond', serif; font-size: 12px; letter-spacing: 0.15em; color: var(--text-on-dark-secondary); font-weight: 600;">
        원본 보기
      </span>
      <router-link
        :to="`/r/${$route.params.token}`"
        class="no-underline"
        style="font-family: 'Cormorant Garamond', serif; font-size: 12px; letter-spacing: 0.15em; color: var(--accent-copper); font-weight: 600;"
      >
        뷰어로 돌아가기 →
      </router-link>
    </header>
    <iframe
      :src="`/api/viewer/${$route.params.token}/raw`"
      class="flex-1 w-full border-none"
    />
  </div>
</template>
