import { useState } from "react";

type ChatEntry = { role: string; text: string };

const initialBody = `{
  "max_tokens": 300,
  "messages": [
    {
      "role": "user",
      "content": ""
    }
  ]
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

// A message's content is either a plain string or a list of blocks.
function contentToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const texts = content
      .filter((block) => block?.type === "text")
      .map((block) => block.text as string);
    if (texts.length > 0) return texts.join("\n");
    // A tool_use reply has no text block until the server runs the tool.
    const kinds = content.map((block) => block?.type).join(", ");
    return `(no text block, content: ${kinds || "empty"})`;
  }
  return String(content ?? "");
}

function toEntries(messages: unknown): ChatEntry[] {
  if (!Array.isArray(messages)) return [];
  return messages.map((m) => ({
    role: String(m?.role ?? "assistant"),
    text: contentToText(m?.content),
  }));
}

// Builds the conversation from the wire, never from what we typed before.
// The server does not remember anything yet, so this is the body we just sent
// plus the one reply. Once the server returns a "messages" list of its own,
// that list wins and the panel grows with it.
function conversationFrom(sentBody: string, reply: string): ChatEntry[] {
  let sent: unknown = [];
  try {
    sent = JSON.parse(sentBody).messages;
  } catch {
    // fall through
  }

  // No reply yet: show only what we are sending.
  if (!reply) return toEntries(sent);

  let parsed: any = null;
  try {
    parsed = JSON.parse(reply);
  } catch {
    return [...toEntries(sent), { role: "assistant", text: reply }];
  }

  if (parsed?.error) {
    return [...toEntries(sent), { role: "assistant", text: `Error: ${parsed.error}` }];
  }
  if (Array.isArray(parsed?.messages)) return toEntries(parsed.messages);

  return [
    ...toEntries(sent),
    { role: "assistant", text: contentToText(parsed?.content) },
  ];
}

// Puts the chat message into the body's "messages" field and leaves every
// other field alone, so anything you add by hand survives.
function withMessage(
  body: string,
  content: string,
): { text: string; error: string | null } {
  try {
    const { messages: _messages, ...rest } = JSON.parse(body);
    const text = JSON.stringify(
      { ...rest, messages: [{ role: "user", content }] },
      null,
      2,
    );
    return { text, error: null };
  } catch (err) {
    return { text: body, error: `Request body is not valid JSON: ${String(err)}` };
  }
}

const panel = {
  border: "1px solid #ddd",
  borderRadius: 6,
  padding: "0.75rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  minHeight: 0,
} as const;

const panelTitle = {
  fontSize: 13,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#666",
} as const;

const hint = { fontSize: 13, color: "#888", margin: 0 } as const;

const mono = {
  fontFamily: "monospace",
  fontSize: 13,
  padding: "0.5rem",
  margin: 0,
} as const;

export default function App() {
  const [body, setBody] = useState(initialBody);
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<ChatEntry[]>([]);
  const [response, setResponse] = useState("");
  const [sending, setSending] = useState(false);

  const bodyError = withMessage(body, message).error;

  // Typing in the chat box rewrites "messages" so the body always shows what
  // the next send will post. A body you are still editing is left alone.
  function changeMessage(next: string) {
    setMessage(next);
    const { text, error } = withMessage(body, next);
    if (!error) setBody(text);
  }

  // Posts a body exactly as given and rebuilds the conversation from the wire.
  // "pending" is what the panel shows while we wait. The reply replaces it, so
  // a server that returns no history still collapses back to a single turn.
  async function submit(bodyText: string, pending: ChatEntry[]) {
    setSending(true);
    setConversation(pending);
    setResponse("...");
    try {
      const { status, text: reply } = await postChat(bodyText);
      setResponse(prettify(status, reply));
      setConversation(conversationFrom(bodyText, reply));
    } catch (err) {
      setResponse(String(err));
      setConversation(conversationFrom(bodyText, String(err)));
    } finally {
      setSending(false);
    }
  }

  // The chat box: your text becomes the only message in the body.
  async function sendChat() {
    const content = message.trim();
    if (!content || sending) return;

    const { text, error } = withMessage(body, content);
    if (error) {
      setResponse(error);
      return;
    }

    setBody(text);
    setMessage("");
    // Keep the turns we were last given and add the one we are sending.
    await submit(text, [...conversation, { role: "user", text: content }]);
  }

  // The editor: send the body exactly as written, messages and all.
  // The body is a whole conversation here, so it replaces the panel.
  async function sendBody() {
    if (sending || bodyError) return;
    await submit(body, conversationFrom(body, ""));
  }

  return (
    <main
      style={{
        height: "100vh",
        boxSizing: "border-box",
        maxWidth: 1280,
        margin: "0 auto",
        padding: "1rem",
        fontFamily: "sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      <h1 style={{ fontSize: 20, margin: 0 }}>Chat playground</h1>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "1rem",
        }}
      >
        {/* Left: what a user of the app sees. */}
        <section style={{ ...panel, gap: "0.75rem" }}>
          <span style={panelTitle}>Conversation</span>

          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {conversation.length === 0 && (
              <p style={hint}>
                Chat history is empty.
              </p>
            )}
            {conversation.map((entry, i) => (
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
              onChange={(e) => changeMessage(e.target.value)}
              placeholder="Type a message and press Enter"
              disabled={sending}
              style={{ flex: 1, minWidth: 0, padding: "0.5rem", fontSize: 15 }}
            />
            <button
              type="submit"
              disabled={sending || !message.trim()}
              style={{ padding: "0.5rem 0.9rem", fontSize: 15 }}
            >
              Send
            </button>
            <button
              type="button"
              onClick={() => setConversation([])}
              style={{ padding: "0.5rem 0.9rem", fontSize: 15 }}
            >
              Clear
            </button>
          </form>
        </section>

        {/* Right: what actually goes over the wire. */}
        <div
          style={{
            display: "grid",
            gridTemplateRows: "1fr 1fr",
            gap: "1rem",
            minHeight: 0,
          }}
        >
          <section style={panel}>
            <span style={panelTitle}>Request body &rarr; /api/chat</span>
            <p style={hint}>
              The raw body we send to our server.
            </p>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              spellCheck={false}
              style={{
                ...mono,
                flex: 1,
                minHeight: 0,
                resize: "none",
                boxSizing: "border-box",
                border: bodyError ? "1px solid #c00" : "1px solid #ccc",
                borderRadius: 4,
              }}
            />
            {bodyError && (
              <span style={{ color: "#c00", fontSize: 13 }}>{bodyError}</span>
            )}
            <button
              type="button"
              onClick={sendBody}
              disabled={sending || Boolean(bodyError)}
              style={{ padding: "0.5rem 0.9rem", fontSize: 15 }}
            >
              Send as message
            </button>
          </section>

          <section style={panel}>
            <span style={panelTitle}>Raw response &larr; /api/chat</span>
            <pre
              style={{
                ...mono,
                flex: 1,
                minHeight: 0,
                overflow: "auto",
                background: "#f4f4f4",
                borderRadius: 4,
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
              }}
            >
              {response || "Nothing sent yet."}
            </pre>
          </section>
        </div>
      </div>
    </main>
  );
}
