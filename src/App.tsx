import { createOpenAI } from '@ai-sdk/openai'
import { useChat } from '@ai-sdk/react'
import { fetch as rawTauriFetch } from '@tauri-apps/plugin-http'
import { streamText } from 'ai'

const tauriFetch = async (url: RequestInfo | URL, options: RequestInit) => {
  console.log('tauriFetch', url, options)
  return rawTauriFetch(url, options)
}

const debugFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  console.log('fetch', input, init)

  const options = init as RequestInit & { body: string }
  const body = JSON.parse(options.body)

  try {
    // Make a direct request to Ollama using Tauri's fetch
    const response = await tauriFetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.2',
        messages: body.messages,
        stream: true,
      }),
    })

    console.log('Response status:', response.status)
    console.log('Response body:', response.body)

    // Return the raw response stream
    return new Response(response.body, {
      headers: response.headers,
      status: response.status,
    })
  } catch (error) {
    console.log('Error details:', error)
    console.error('Error calling Ollama:', error)
    throw error
  }
}

const openai = createOpenAI({
  baseURL: 'http://localhost:11434/v1',
  fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
    console.log('tauri fetch', input, init)
    return tauriFetch(input, init)
  },
  // compatibility: 'compatible',
  apiKey: 'ollama',
})

const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  console.log('fetch', input, init)

  const options = init as RequestInit & { body: string }
  const body = JSON.parse(options.body)

  try {
    console.log('aaaa')

    // Use streamText with openai model
    const result = streamText({
      model: openai('llama3.2'),
      messages: body.messages,
      // prompt: 'Hello, how are you?',
    })

    console.log('bbbb', result)

    // Return the data stream response
    const response = result.toDataStreamResponse()
    console.log('response', response)
    return response
  } catch (error) {
    console.log('cccc')
    console.error('Error calling Ollama:', error)
    throw error
  }
}

// const fetchCompletion = async (input: RequestInfo | URL, init?: RequestInit) => {
//   console.log('fetchCompletion', input, init)

//   const options = init as RequestInit & { body: string }
//   const body = JSON.parse(options.body)

//   try {
//     console.log('aaaa')

//     // Use generateText with openai model
//     const result = generateText({
//       model: openai('llama3.2'),
//       prompt: body.prompt || 'Hello, how are you?',
//     })

//     return result.console.log('bbbb', result)

//     // Convert the result to a Response object
//     return new Response(JSON.stringify(result), {
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     })
//   } catch (error) {
//     console.log('cccc')
//     console.error('Error calling Ollama:', error)
//     throw error
//   }
// }

export default function App() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    // api: 'http://localhost:11434/api/chat',
    fetch,
    // streamProtocol: 'text',
  })

  // const { completion, input, handleInputChange, handleSubmit } = useCompletion({
  //   // api: 'http://localhost:11434/api/chat',
  //   // streamProtocol: 'text',
  //   fetch: fetchCompletion,
  // })

  console.log('messages', messages)

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((message, i) => (
          <div key={message.id} className={`message ${message.role}`}>
            {message.content}
          </div>
        ))}
        {/* {JSON.stringify(completion)} */}
      </div>

      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} placeholder="Say something..." />
        <button type="submit">Send</button>
      </form>
    </div>
  )
}
