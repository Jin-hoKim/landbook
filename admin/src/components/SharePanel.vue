<script setup>
import { ref, computed } from 'vue'
import api from '../api'

const props = defineProps({
  reportId: { type: String, required: true },
  token: { type: String, required: true },
})

const emit = defineEmits(['shared'])

const activeTab = ref('sms')
const sending = ref(false)
const resultMsg = ref('')
const resultType = ref('') // 'success' | 'error'

// SMS
const smsRecipients = ref('')
// 이메일
const emailRecipients = ref('')
const attachPdf = ref(false)
// 링크
const linkCopied = ref(false)

const shareUrl = computed(() => `https://landbook.jworks.world/r/${props.token}`)

const tabs = [
  { id: 'sms', label: 'SMS' },
  { id: 'email', label: '이메일' },
  { id: 'kakao', label: '카카오' },
  { id: 'link', label: '웹 링크' },
]

function showResult(type, msg) {
  resultType.value = type
  resultMsg.value = msg
  setTimeout(() => { resultMsg.value = '' }, 5000)
}

function parseLines(text) {
  return text
    .split(/[\n,;]+/)
    .map(s => s.trim())
    .filter(Boolean)
}

async function sendSms() {
  const recipients = parseLines(smsRecipients.value)
  if (recipients.length === 0) {
    showResult('error', '수신번호를 입력해주세요.')
    return
  }
  sending.value = true
  try {
    const { data } = await api.post(`/reports/${props.reportId}/sms`, { recipients })
    const success = (data.results || []).filter(r => r.success !== false).length
    const fail = recipients.length - success
    showResult('success', `SMS 발송 완료: 성공 ${success}건${fail > 0 ? `, 실패 ${fail}건` : ''}`)
    smsRecipients.value = ''
    emit('shared')
  } catch (err) {
    showResult('error', `SMS 발송 실패: ${err.response?.data?.error || err.message}`)
  } finally {
    sending.value = false
  }
}

async function sendEmail() {
  const recipients = parseLines(emailRecipients.value)
  if (recipients.length === 0) {
    showResult('error', '수신 이메일을 입력해주세요.')
    return
  }
  sending.value = true
  try {
    const { data } = await api.post(`/reports/${props.reportId}/email`, {
      recipients,
      attachPdf: attachPdf.value,
    })
    const success = (data.results || []).filter(r => r.success).length
    const fail = recipients.length - success
    showResult('success', `이메일 발송 완료: 성공 ${success}건${fail > 0 ? `, 실패 ${fail}건` : ''}`)
    emailRecipients.value = ''
    emit('shared')
  } catch (err) {
    showResult('error', `이메일 발송 실패: ${err.response?.data?.error || err.message}`)
  } finally {
    sending.value = false
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    linkCopied.value = true
    setTimeout(() => { linkCopied.value = false }, 2000)
  } catch {
    // fallback
    const ta = document.createElement('textarea')
    ta.value = shareUrl.value
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    linkCopied.value = true
    setTimeout(() => { linkCopied.value = false }, 2000)
  }
}
</script>

<template>
  <div
    class="rounded-lg"
    style="background: var(--admin-surface); border: 1px solid var(--admin-border);"
  >
    <!-- 헤더 -->
    <div class="px-6 py-4 border-b" style="border-color: var(--admin-border);">
      <h3
        class="uppercase"
        style="font-size: 11px; letter-spacing: 0.2em; font-family: 'Cormorant Garamond', serif; color: var(--admin-text-subtle);"
      >
        Share
      </h3>
    </div>

    <!-- 탭 -->
    <div class="flex border-b" style="border-color: var(--admin-border);">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="px-5 py-3 text-xs font-medium transition-colors cursor-pointer"
        :style="{
          color: activeTab === tab.id ? 'var(--accent-copper)' : 'var(--admin-text-subtle)',
          borderBottom: activeTab === tab.id ? '2px solid var(--accent-copper)' : '2px solid transparent',
          marginBottom: '-1px',
        }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 결과 메시지 -->
    <div
      v-if="resultMsg"
      class="mx-6 mt-4 px-4 py-3 rounded-lg text-sm font-medium"
      :style="{
        background: resultType === 'success' ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.1)',
        color: resultType === 'success' ? '#34C759' : '#FF3B30',
        border: `1px solid ${resultType === 'success' ? 'rgba(52,199,89,0.2)' : 'rgba(255,59,48,0.2)'}`,
      }"
    >
      {{ resultMsg }}
    </div>

    <!-- SMS 탭 -->
    <div v-if="activeTab === 'sms'" class="px-6 py-5 space-y-4">
      <div>
        <label class="block text-xs mb-1.5" style="color: var(--admin-text-subtle);">
          수신번호 (줄바꿈으로 구분)
        </label>
        <textarea
          v-model="smsRecipients"
          rows="4"
          placeholder="01012345678&#10;01098765432"
          class="w-full px-3 py-2 rounded-md text-sm outline-none resize-none transition-colors"
          style="background: var(--admin-surface-muted); border: 1px solid var(--admin-border); color: var(--admin-text);"
          @focus="$event.target.style.borderColor = 'var(--accent-copper)'"
          @blur="$event.target.style.borderColor = 'var(--admin-border)'"
        />
      </div>
      <button
        class="px-5 py-2.5 rounded-md text-sm font-medium transition-opacity cursor-pointer"
        style="background: var(--accent-copper); color: white;"
        :disabled="sending"
        :style="{ opacity: sending ? 0.6 : 1 }"
        @click="sendSms"
      >
        {{ sending ? '발송 중...' : 'SMS 발송' }}
      </button>
    </div>

    <!-- 이메일 탭 -->
    <div v-if="activeTab === 'email'" class="px-6 py-5 space-y-4">
      <div>
        <label class="block text-xs mb-1.5" style="color: var(--admin-text-subtle);">
          수신 이메일 (줄바꿈으로 구분)
        </label>
        <textarea
          v-model="emailRecipients"
          rows="4"
          placeholder="user@example.com&#10;another@example.com"
          class="w-full px-3 py-2 rounded-md text-sm outline-none resize-none transition-colors"
          style="background: var(--admin-surface-muted); border: 1px solid var(--admin-border); color: var(--admin-text);"
          @focus="$event.target.style.borderColor = 'var(--accent-copper)'"
          @blur="$event.target.style.borderColor = 'var(--admin-border)'"
        />
      </div>
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          v-model="attachPdf"
          type="checkbox"
          class="w-4 h-4 rounded cursor-pointer"
          style="accent-color: var(--accent-copper);"
        />
        <span class="text-sm" style="color: var(--admin-text-muted);">PDF 파일 첨부</span>
      </label>
      <button
        class="px-5 py-2.5 rounded-md text-sm font-medium transition-opacity cursor-pointer"
        style="background: var(--accent-copper); color: white;"
        :disabled="sending"
        :style="{ opacity: sending ? 0.6 : 1 }"
        @click="sendEmail"
      >
        {{ sending ? '발송 중...' : '이메일 발송' }}
      </button>
    </div>

    <!-- 카카오 탭 -->
    <div v-if="activeTab === 'kakao'" class="px-6 py-5 space-y-4">
      <p class="text-sm" style="color: var(--admin-text-muted);">
        카카오톡 공유는 리포트 링크를 복사하여 카카오톡에 직접 붙여넣기 해주세요.
      </p>
      <div class="flex items-center gap-2">
        <input
          :value="shareUrl"
          readonly
          class="flex-1 px-3 py-2 rounded-md text-sm font-mono"
          style="background: var(--admin-surface-muted); border: 1px solid var(--admin-border); color: var(--admin-text-muted);"
        />
        <button
          class="flex-shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
          :style="{
            background: linkCopied ? 'rgba(52,199,89,0.1)' : 'var(--accent-copper-soft)',
            color: linkCopied ? '#34C759' : 'var(--accent-copper)',
            border: `1px solid ${linkCopied ? 'rgba(52,199,89,0.2)' : 'rgba(196,125,74,0.2)'}`,
          }"
          @click="copyLink"
        >
          {{ linkCopied ? '복사됨' : '복사' }}
        </button>
      </div>
    </div>

    <!-- 웹 링크 탭 -->
    <div v-if="activeTab === 'link'" class="px-6 py-5 space-y-4">
      <div>
        <label class="block text-xs mb-1.5" style="color: var(--admin-text-subtle);">리포트 URL</label>
        <div class="flex items-center gap-2">
          <input
            :value="shareUrl"
            readonly
            class="flex-1 px-3 py-2 rounded-md text-sm font-mono"
            style="background: var(--admin-surface-muted); border: 1px solid var(--admin-border); color: var(--admin-text-muted);"
          />
          <button
            class="flex-shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
            :style="{
              background: linkCopied ? 'rgba(52,199,89,0.1)' : 'var(--accent-copper-soft)',
              color: linkCopied ? '#34C759' : 'var(--accent-copper)',
              border: `1px solid ${linkCopied ? 'rgba(52,199,89,0.2)' : 'rgba(196,125,74,0.2)'}`,
            }"
            @click="copyLink"
          >
            {{ linkCopied ? '복사됨' : 'URL 복사' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
