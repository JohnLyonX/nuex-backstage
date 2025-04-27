<template>
  <div class="chat-container">
    <div ref="chatBox" class="chat-box">
      <div
        v-for="(msg, index) in messages"
        :key="index"
        :class="['message', msg.isUser ? 'user-message' : 'gpt-message']"
      >
        <div class="message-content">
          <div v-if="msg.isUser" class="user-content">
            {{ msg.content }}
          </div>
          <div v-else class="gpt-content" v-html="msg.content"></div>
        </div>
      </div>
    </div>
    <div class="input-area">
      <div class="input-wrapper">
        <input
          v-model="userInput"
          @keydown.enter.prevent="handleEnter"
          :readonly="isAIResponding"
          placeholder="与管家对话..."
          class="message-input"
        />
        <button
          @click="sendMessage"
          class="send-btn"
          :disabled="isAIResponding"
          :style="{ opacity: isAIResponding ? 0.5 : 1 }"
        >
          <svg class="send-icon" viewBox="0 0 24 24">
            <path fill="#ffffff" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { nextTick } from 'vue'; // Vue 2 with Composition plugin or use this.$nextTick

export default {
  name: 'AiChatComponent',
  data() {
    return {
      messages: [],
      userInput: '',
      isAIResponding: false
    };
  },
  mounted() {
    // nothing specific on mount for now
  },
  methods: {
    async scrollToBottom() {
      await this.$nextTick();
      const box = this.$refs.chatBox;
      if (box) {
        box.scrollTop = box.scrollHeight;
      }
    },

    async handleStream(reader, id) {
      const decoder = new TextDecoder();
      let messageBuffer = '';
      let lastUpdateTime = 0;
      let updateScheduled = false;
      let shouldOptimize = false;

      const doUpdate = () => {
        const idx = this.messages.findIndex(m => m.id === id);
        if (idx !== -1) {
          this.$set(this.messages, idx, {
            ...this.messages[idx],
            content: messageBuffer
          });
        } else {
          this.messages.push({ content: messageBuffer, isUser: false, id });
        }
      };

      const updateMessage = () => {
        if (!shouldOptimize && messageBuffer.trim().startsWith('<div')) {
          shouldOptimize = true;
        }
        if (shouldOptimize) {
          const now = performance.now();
          if (now - lastUpdateTime < 50 && !updateScheduled) {
            updateScheduled = true;
            requestAnimationFrame(() => {
              updateScheduled = false;
              doUpdate();
            });
            return;
          }
          lastUpdateTime = now;
        }
        doUpdate();
      };

      const readStream = async () => {
        const { value, done } = await reader.read();
        if (done) {
          doUpdate();
          await this.scrollToBottom();
          return;
        }
        messageBuffer += decoder.decode(value, { stream: true });
        updateMessage();
        await this.scrollToBottom();
        return await readStream();
      };

      await readStream();
    },

    async sendMessage() {
      const message = this.userInput.trim();
      if (!message || this.isAIResponding) return;

      this.messages.push({ content: message, isUser: true, id: Date.now() });
      this.userInput = '';
      await this.scrollToBottom();

      try {
        this.isAIResponding = true;
        const id = Date.now();
        const userId = new Date().getHours();
        const response = await fetch(
          `http://localhost:8081/api/butlerAgent4Teacher?userId=${encodeURIComponent(userId)}&message=${encodeURIComponent(message)}`,
          { method: 'GET', mode: 'cors', credentials: 'include', headers: { 'Content-Type': 'application/json' } }
        );

        if (response.ok && response.body) {
          const reader = response.body.getReader();
          await this.handleStream(reader, id);
        }
      } catch (error) {
        console.error('请求失败:', error);
        this.messages.push({ content: '消息发送失败，请稍后再试', isUser: false, id: Date.now() });
        await this.scrollToBottom();
      } finally {
        this.isAIResponding = false;
      }
    },

    handleEnter(e) {
      if (!e.isComposing && !e.repeat && !this.isAIResponding) {
        this.sendMessage();
      }
    }
  }
};
</script>

<style scoped>
/* 从AiChatComponent迁移的样式 */
.chat-container {
  display: flex;
  flex-direction: column;
  background: #f5f6fa;
  border-radius: 16px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  margin-top: 1rem;
  height: 500px; /* 固定高度避免影响父布局 */
}

.chat-box {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
  background: linear-gradient(145deg, #ffffff 0%, #f8f9fe 100%);
}

.message {
  max-width: 72%;
  padding: 0;
  margin: 4px 0;
  position: relative;
  transition: transform 0.2s ease;
}

.message:hover {
  transform: translateX(4px);
}

.gpt-message {
  align-self: flex-start;
  animation: slideInLeft 0.3s ease;
}

.user-message {
  align-self: flex-end;
  animation: slideInRight 0.3s ease;
}

.message-content {
  padding: 14px 20px;
  border-radius: 20px;
  line-height: 1.6;
  font-size: 15px;
  word-break: break-word;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.gpt-message .message-content {
  background: white;
  color: #1a1a1a;
  border: 1px solid #eceef2;
  border-radius: 20px 20px 20px 6px;
}

.user-message .message-content {
  background: linear-gradient(135deg, #3e7afe, #3568e4);
  color: white;
  border-radius: 20px 20px 6px 20px;
}

.input-area {
  padding: 16px 24px;
  background: white;
  border-top: 1px solid #f0f2f5;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.03);
}

.input-wrapper {
  display: flex;
  gap: 12px;
  max-width: 800px;
  margin: 0 auto;
}

.message-input {
  flex: 1;
  padding: 12px 20px;
  border: 1px solid #e0e3eb;
  border-radius: 16px;
  font-size: 15px;
  transition: all 0.25s ease;
}

.message-input:focus {
  border-color: #3e7afe;
  box-shadow: 0 0 0 3px rgba(62, 122, 254, 0.15);
  outline: none;
}

.send-btn {
  width: 46px;
  height: 46px;
  border: none;
  border-radius: 12px;
  background: #3e7afe;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-btn:hover {
  background: #3568e4;
  transform: translateY(-1px);
}

.send-btn:active {
  transform: translateY(1px);
}

.send-icon {
  width: 20px;
  height: 20px;
}

/* 消息入场动画 */
@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 滚动条美化 */
.chat-box::-webkit-scrollbar {
  width: 8px;
}

.chat-box::-webkit-scrollbar-track {
  background: rgba(200, 200, 200, 0.1);
  border-radius: 4px;
}

.chat-box::-webkit-scrollbar-thumb {
  background: #c1c6d0;
  border-radius: 4px;
}

.chat-box::-webkit-scrollbar-thumb:hover {
  background: #a8acb5;
}
</style>
