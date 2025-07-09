import type { LanguageModelV2Middleware, LanguageModelV2StreamPart } from '@ai-sdk/provider'
import type { TransformStreamDefaultController } from 'stream/web'

/**
 * Middleware to remove legacy XML-like tags (<tool_call>, <think>, etc.) from
 * provider output *before* it reaches the reasoning extractor.
 */
export const stripTagsMiddleware: LanguageModelV2Middleware = {
  wrapStream: async ({ doStream }) => {
    const { stream, ...rest } = await doStream()

    // Tracks whether we're currently inside a <tool_call>...</tool_call> block
    let insideToolCall = false
    let toolCallBuffer = ''

    const transform = new TransformStream<LanguageModelV2StreamPart, LanguageModelV2StreamPart>({
      transform(
        chunk: LanguageModelV2StreamPart,
        controller: TransformStreamDefaultController<LanguageModelV2StreamPart>,
      ) {
        // Some providers still emit simple { type: "text", text: string } parts.
        const chunkText = (chunk as any).text as string | undefined

        if (chunk.type === 'text' && typeof chunkText === 'string') {
          let cleaned = chunkText

          // Detect the start of a <tool_call> block (case-insensitive)
          const toolCallStartMatch = cleaned.match(/<tool_call\s*>/i)
          if (toolCallStartMatch && toolCallStartMatch.index !== undefined) {
            insideToolCall = true
            toolCallBuffer = ''
            // Remove everything from <tool_call> onwards in this chunk
            cleaned = cleaned.substring(0, toolCallStartMatch.index)
          }

          // If inside a tool_call, buffer until we reach </tool_call>
          if (insideToolCall) {
            toolCallBuffer += chunkText

            const endMatch = toolCallBuffer.match(/<\/tool_call\s*>/i)
            if (endMatch && endMatch.index !== undefined) {
              insideToolCall = false
              const endIndex = endMatch.index + endMatch[0].length
              cleaned = toolCallBuffer.substring(endIndex)
              toolCallBuffer = ''
            } else {
              // Still inside the block; skip emitting this chunk
              return
            }
          }

          // Strip other legacy tags
          cleaned = cleaned.replace(/<\/think\s*>/gi, '')
          cleaned = cleaned.replace(/<\/?final_response\s*>/gi, '')

          // Ignore empty chunks
          if (cleaned.trim().length === 0) {
            return
          }

          chunk.text = cleaned
        }

        controller.enqueue(chunk)
      },
    })

    return { stream: stream.pipeThrough(transform), ...rest }
  },

  wrapGenerate: async ({ doGenerate }) => {
    // Pass through - we only care about streaming
    return doGenerate()
  },
}
