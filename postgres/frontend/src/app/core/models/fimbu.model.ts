export interface FimbuMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface FimbuHistoryResponse {
  messages: FimbuMessage[]
}

export interface FimbuChatResponse {
  reply: string
  timestamp: string
}

export interface FimbuChatRequest {
  message: string
}
