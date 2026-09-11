import { useState } from "react";

type Tab = "raw" | "chat";

type ChatEntry = { role: "user" | "assistant"; text: string };

const initialBody = `{
  "max_tokens": 300,
  "messages": [{ "role": "user", "content": "Say hello in one line." }]
}`;

async function postChat(body: string): Promise<{ status: number; text: string }> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  return { status: res.status, text: await res.text() };
}

function prettify(status: number, text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return `HTTP ${status}\n${text}`;
  }
}

// Pulls the assistant's text out of an Anthropic Message response.
function extractAssistantText(text: string): string {
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed.content)) {
      return parsed.content
        .filter((block: { type: string }) => block.type === "text")
        .map((block: { text: string }) => block.text)
        .join("\n");
    }
    if (parsed.error) return `Error: ${parsed.error}`;
  } catch {
    // fall through
  }
  return text;
}

// Strips "messages" from a raw request body so the chat tab can show
// the remaining options (max_tokens, system, ...) on their own.
function stripMessages(body: string): string {
  try {
    const { messages: _messages, ...rest } = JSON.parse(body);
    return JSON.stringify(rest, null, 2);
  } catch {
    return body;
  }
}

export default function App() {
  const [tab, setTab] = useState<Tab>("raw");
  const [body, setBody] = useState(initialBody);
  const [response, setResponse] = useState("");

  const [options, setOptions] = useState(() => stripMessages(initialBody));
  const [message, setMessage] = useState("");
  const [transcript, setTranscript] = useState<ChatEntry[]>([]);
  const [sending, setSending] = useState(false);

  async function sendRaw() {
    setResponse("...");
    try {
      const { status, text } = await postChat(body);
      setResponse(prettify(status, text));
    } catch (err) {
      setResponse(String(err));
    }
  }

  async function sendChat() {
    const content = message.trim();
    if (!content || sending) return;

    let requestBody: string;
    try {
      const rest = JSON.parse(options);
      requestBody = JSON.stringify({
        ...rest,
        messages: [{ role: "user", content }],
      });
    } catch (err) {
      setResponse(`Request options are not valid JSON: ${String(err)}`);
      return;
    }

    setSending(true);
    setMessage("");
    setTranscript((t) => [...t, { role: "user", text: content }]);
    setResponse("...");
    try {
      const { status, text } = await postChat(requestBody);
      setResponse(prettify(status, text));
      setTranscript((t) => [
        ...t,
        { role: "assistant", text: extractAssistantText(text) },
      ]);
    } catch (err) {
      setResponse(String(err));
      setTranscript((t) => [...t, { role: "assistant", text: String(err) }]);
    } finally {
      setSending(false);
    }
  }

  function switchTab(next: Tab) {
    if (next === "chat" && tab === "raw") {
      // Carry any option edits from the raw body over to the chat tab
      setOptions(stripMessages(body));
    }
    setTab(next);
  }

  const tabButton = (value: Tab, label: string) => (
    <button
      onClick={() => switchTab(value)}
      style={{
        padding: "0.5rem 1rem",
        fontSize: 16,
        border: "1px solid #ccc",
        borderBottom: tab === value ? "2px solid #333" : "1px solid #ccc",
        background: tab === value ? "#fff" : "#eee",
        fontWeight: tab === value ? "bold" : "normal",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "2rem auto",
        padding: "0 1rem",
        fontFamily: "sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <h1>Chat playground</h1>

      <div style={{ display: "flex", gap: "0.25rem" }}>
        {tabButton("raw", "Raw request")}
        {tabButton("chat", "Chat")}
      </div>

      {tab === "raw" && (
        <>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            style={{ fontFamily: "monospace", fontSize: 14, padding: "0.5rem" }}
          />
          <button onClick={sendRaw} style={{ padding: "0.5rem", fontSize: 16 }}>
            Send
          </button>
        </>
      )}

      {tab === "chat" && (
        <>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: 14, color: "#555" }}>
              Request options (everything except <code>messages</code>)
            </span>
            <textarea
              value={options}
              onChange={(e) => setOptions(e.target.value)}
              rows={4}
              style={{ fontFamily: "monospace", fontSize: 14, padding: "0.5rem" }}
            />
          </label>

          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: 6,
              padding: "0.75rem",
              minHeight: "8rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {transcript.length === 0 && (
              <span style={{ color: "#888" }}>
                No messages yet. Each message is sent on its own; the server is
                responsible for remembering the conversation.
              </span>
            )}
            {transcript.map((entry, i) => (
              <div
                key={i}
                style={{
                  alignSelf: entry.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  padding: "0.5rem 0.75rem",
                  borderRadius: 8,
                  background: entry.role === "user" ? "#dbeafe" : "#f4f4f4",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}
              >
                {entry.text}
              </div>
            ))}
            {sending && <span style={{ color: "#888" }}>...</span>}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendChat();
            }}
            style={{ display: "flex", gap: "0.5rem" }}
          >
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message and press Enter"
              disabled={sending}
              style={{ flex: 1, padding: "0.5rem", fontSize: 16 }}
            />
            <button
              type="submit"
              disabled={sending || !message.trim()}
              style={{ padding: "0.5rem 1rem", fontSize: 16 }}
            >
              Send
            </button>
            <button
              type="button"
              onClick={() => setTranscript([])}
              style={{ padding: "0.5rem 1rem", fontSize: 16 }}
            >
              Clear
            </button>
          </form>
        </>
      )}

      <details open={tab === "raw"}>
        <summary style={{ cursor: "pointer" }}>Raw response</summary>
        <pre
          style={{
            background: "#f4f4f4",
            padding: "1rem",
            minHeight: "4rem",
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
          }}
        >
          {response}
        </pre>
      </details>
    </main>
  );
}
