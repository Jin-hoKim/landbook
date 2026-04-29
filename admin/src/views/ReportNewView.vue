<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import AdminShell from '../components/AdminShell.vue'
import api from '../api'

const router = useRouter()

// 위자드 단계
const step = ref(1)

// Step 1: 업로드 상태
const isDragging = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const selectedFile = ref(null)
const uploadError = ref('')

// Step 2: 메타 정보
const reportId = ref('')
const form = reactive({
  title: '',
  description: '',
  address: '',
})
const pages = ref([])
const saving = ref(false)

// Step 3: 완료
const shareUrl = ref('')
const copied = ref(false)

// 파일 입력 참조
const fileInput = ref(null)

function handleDragOver(e) {
  e.preventDefault()
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

function handleDrop(e) {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer.files[0]
  if (file) selectFile(file)
}

function handleFileInput(e) {
  const file = e.target.files[0]
  if (file) selectFile(file)
}

function selectFile(file) {
  if (!file.name.endsWith('.zip')) {
    uploadError.value = 'ZIP 파일만 업로드할 수 있습니다.'
    return
  }
  uploadError.value = ''
  selectedFile.value = file
  uploadFile(file)
}

async function uploadFile(file) {
  uploading.value = true
  uploadProgress.value = 0

  const formData = new FormData()
  formData.append('zip', file)

  try {
    const { data } = await api.post('/reports', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total) {
          uploadProgress.value = Math.round((e.loaded / e.total) * 100)
        }
      },
    })

    reportId.value = data._id || data.id
    form.title = data.title || ''
    form.description = data.description || ''
    form.address = data.address || ''
    pages.value = data.pages || []

    step.value = 2
  } catch (err) {
    uploadError.value = err.response?.data?.message || '업로드에 실패했습니다.'
  } finally {
    uploading.value = false
  }
}

async function submitMeta() {
  saving.value = true
  try {
    const { data } = await api.put(`/reports/${reportId.value}`, {
      title: form.title,
      description: form.description,
      address: form.address,
      isActive: true,
    })

    shareUrl.value = data.shareUrl || `${window.location.origin}/reports/${reportId.value}`
    step.value = 3
  } catch {
    // 실패 시 무시
  } finally {
    saving.value = false
  }
}

function copyUrl() {
  navigator.clipboard.writeText(shareUrl.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

function goToDetail() {
  router.push(`/reports/${reportId.value}`)
}

function goToList() {
  router.push('/reports')
}
</script>

<template>
  <AdminShell active="report-new" section="REPORTS" title="리포트 등록">
    <!-- 단계 인디케이터 -->
    <div class="flex items-center gap-4 mb-8">
      <div
        v-for="s in 3"
        :key="s"
        class="flex items-center gap-2"
      >
        <div
          class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
          :style="{
            background: step >= s ? 'var(--accent-copper)' : 'var(--admin-border)',
            color: step >= s ? '#fff' : 'var(--admin-text-subtle)',
          }"
        >
          {{ s }}
        </div>
        <span
          class="text-xs font-medium"
          :style="{ color: step >= s ? 'var(--admin-text)' : 'var(--admin-text-subtle)' }"
        >
          {{ s === 1 ? 'ZIP 업로드' : s === 2 ? '메타 정보' : '완료' }}
        </span>
        <div
          v-if="s < 3"
          class="w-8 h-px"
          :style="{ background: step > s ? 'var(--accent-copper)' : 'var(--admin-border-strong)' }"
        />
      </div>
    </div>

    <!-- Step 1: ZIP 업로드 -->
    <div v-if="step === 1">
      <div
        class="rounded-lg p-12 text-center cursor-pointer transition-colors"
        :style="{
          border: `2px dashed ${isDragging ? 'var(--accent-copper)' : 'var(--admin-border-strong)'}`,
          background: isDragging ? 'var(--accent-copper-soft)' : 'var(--admin-surface)',
        }"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
        @click="fileInput?.click()"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".zip"
          class="hidden"
          @change="handleFileInput"
        />

        <div v-if="!uploading && !selectedFile">
          <svg
            class="mx-auto mb-4"
            width="48" height="48" viewBox="0 0 48 48" fill="none"
            stroke="var(--accent-copper)" stroke-width="1.5"
          >
            <rect x="8" y="6" width="32" height="36" rx="3" />
            <line x1="24" y1="18" x2="24" y2="32" />
            <polyline points="18,24 24,18 30,24" />
          </svg>
          <p class="text-sm font-medium" style="color: var(--admin-text);">
            ZIP 파일을 끌어다 놓거나 클릭하세요
          </p>
          <p class="text-xs mt-2" style="color: var(--admin-text-subtle);">
            리포트 HTML/이미지가 포함된 ZIP 파일
          </p>
        </div>

        <!-- 업로드 진행바 -->
        <div v-if="uploading" class="max-w-sm mx-auto">
          <p class="text-sm font-medium mb-3" style="color: var(--admin-text);">
            {{ selectedFile?.name }}
          </p>
          <div
            class="w-full h-2 rounded-full overflow-hidden"
            style="background: var(--admin-border);"
          >
            <div
              class="h-full rounded-full transition-all"
              :style="{
                width: uploadProgress + '%',
                background: 'var(--accent-copper)',
              }"
            />
          </div>
          <p class="text-xs mt-2" style="color: var(--admin-text-subtle);">
            {{ uploadProgress }}% 업로드 중...
          </p>
        </div>
      </div>

      <p
        v-if="uploadError"
        class="mt-3 text-xs"
        style="color: #FF3B30;"
      >
        {{ uploadError }}
      </p>
    </div>

    <!-- Step 2: 메타 정보 입력 -->
    <div v-else-if="step === 2">
      <div
        class="rounded-lg p-6"
        style="background: var(--admin-surface); border: 1px solid var(--admin-border);"
      >
        <div class="space-y-5">
          <!-- 제목 -->
          <div>
            <label
              class="block mb-1.5 uppercase"
              style="
                font-size: 11px;
                letter-spacing: 0.1em;
                color: var(--admin-text-subtle);
                font-weight: 500;
              "
            >
              제목
            </label>
            <input
              v-model="form.title"
              type="text"
              placeholder="리포트 제목을 입력하세요"
              class="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
              style="
                background: var(--admin-surface-muted);
                border: 1px solid var(--admin-border);
                color: var(--admin-text);
              "
              @focus="$event.target.style.borderColor = 'var(--accent-copper)'"
              @blur="$event.target.style.borderColor = 'var(--admin-border)'"
            />
          </div>

          <!-- 설명 -->
          <div>
            <label
              class="block mb-1.5 uppercase"
              style="
                font-size: 11px;
                letter-spacing: 0.1em;
                color: var(--admin-text-subtle);
                font-weight: 500;
              "
            >
              설명
            </label>
            <textarea
              v-model="form.description"
              rows="3"
              placeholder="리포트 설명을 입력하세요"
              class="w-full px-4 py-2.5 rounded-lg text-sm outline-none resize-none"
              style="
                background: var(--admin-surface-muted);
                border: 1px solid var(--admin-border);
                color: var(--admin-text);
              "
              @focus="$event.target.style.borderColor = 'var(--accent-copper)'"
              @blur="$event.target.style.borderColor = 'var(--admin-border)'"
            />
          </div>

          <!-- 주소 -->
          <div>
            <label
              class="block mb-1.5 uppercase"
              style="
                font-size: 11px;
                letter-spacing: 0.1em;
                color: var(--admin-text-subtle);
                font-weight: 500;
              "
            >
              주소
            </label>
            <input
              v-model="form.address"
              type="text"
              placeholder="건물 주소를 입력하세요"
              class="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
              style="
                background: var(--admin-surface-muted);
                border: 1px solid var(--admin-border);
                color: var(--admin-text);
              "
              @focus="$event.target.style.borderColor = 'var(--accent-copper)'"
              @blur="$event.target.style.borderColor = 'var(--admin-border)'"
            />
          </div>
        </div>

        <!-- 페이지 미리보기 -->
        <div v-if="pages.length > 0" class="mt-6">
          <h4
            class="mb-3 uppercase"
            style="
              font-size: 11px;
              letter-spacing: 0.1em;
              color: var(--admin-text-subtle);
              font-weight: 500;
            "
          >
            페이지 미리보기 ({{ pages.length }}장)
          </h4>
          <div class="grid grid-cols-6 gap-3">
            <div
              v-for="(page, idx) in pages"
              :key="idx"
              class="rounded-lg overflow-hidden aspect-[3/4]"
              style="background: var(--admin-surface-muted); border: 1px solid var(--admin-border);"
            >
              <img
                v-if="page.thumbnail"
                :src="page.thumbnail"
                :alt="`Page ${idx + 1}`"
                class="w-full h-full object-cover"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center text-xs"
                style="color: var(--admin-text-subtle);"
              >
                {{ idx + 1 }}
              </div>
            </div>
          </div>
        </div>

        <!-- 등록 버튼 -->
        <div class="mt-8 flex justify-end">
          <button
            class="px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 cursor-pointer disabled:opacity-50"
            style="background: var(--accent-copper);"
            :disabled="saving || !form.title"
            @click="submitMeta"
          >
            {{ saving ? '등록 중...' : '등록하기' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Step 3: 완료 -->
    <div v-else-if="step === 3">
      <div
        class="rounded-lg p-12 text-center"
        style="background: var(--admin-surface); border: 1px solid var(--admin-border);"
      >
        <!-- 성공 아이콘 -->
        <svg
          class="mx-auto mb-5"
          width="56" height="56" viewBox="0 0 56 56" fill="none"
        >
          <circle cx="28" cy="28" r="27" stroke="var(--accent-copper)" stroke-width="1.5" />
          <polyline points="18,28 25,35 38,22" stroke="var(--accent-copper)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
        </svg>

        <h3 class="text-lg font-semibold mb-2" style="color: var(--admin-text);">
          리포트가 등록되었습니다
        </h3>
        <p class="text-sm mb-6" style="color: var(--admin-text-muted);">
          공유 링크를 통해 리포트를 확인할 수 있습니다.
        </p>

        <!-- 공유 링크 -->
        <div class="max-w-md mx-auto flex items-center gap-2 mb-8">
          <input
            :value="shareUrl"
            readonly
            class="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none"
            style="
              background: var(--admin-surface-muted);
              border: 1px solid var(--admin-border);
              color: var(--admin-text);
            "
          />
          <button
            class="px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 cursor-pointer"
            :style="{
              background: copied ? 'rgba(52,199,89,0.12)' : 'var(--accent-copper-soft)',
              color: copied ? '#34C759' : 'var(--accent-copper)',
            }"
            @click="copyUrl"
          >
            {{ copied ? '복사됨' : '복사' }}
          </button>
        </div>

        <!-- 이동 버튼 -->
        <div class="flex items-center justify-center gap-3">
          <button
            class="px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 cursor-pointer"
            style="background: var(--accent-copper);"
            @click="goToDetail"
          >
            리포트 상세로 이동
          </button>
          <button
            class="px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 cursor-pointer"
            style="
              background: var(--admin-surface-muted);
              border: 1px solid var(--admin-border);
              color: var(--admin-text);
            "
            @click="goToList"
          >
            목록으로
          </button>
        </div>
      </div>
    </div>
  </AdminShell>
</template>
