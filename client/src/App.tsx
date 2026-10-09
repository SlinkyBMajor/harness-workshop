import { useState } from "react";

type ChatEntry = { role: string; text: string };

const initialBody = `{
  "max_completion_tokens": 1000,
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

// A message's content is a plain string, a list of parts, or null.
function contentToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((part) => part?.type === "text")
      .map((part) => part.text as string)
      .join("\n");
  }
  return "";
}

// A reply that asks for tools has no text until the server runs them.
function messageToText(message: any): string {
  const text = contentToText(message?.content);
  if (text) return text;
  if (Array.isArray(message?.tool_calls) && message.tool_calls.length > 0) {
    const names = message.tool_calls
      .map((call: any) => call?.function?.name ?? call?.type)
      .join(", ");
    return `(no text, tool_calls: ${names})`;
  }
  return "(no text)";
}

function toEntries(messages: unknown): ChatEntry[] {
  if (!Array.isArray(messages)) return [];
  return messages.map((m) => ({
    role: String(m?.role ?? "assistant"),
    text: messageToText(m),
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
    { role: "assistant", text: messageToText(parsed?.choices?.[0]?.message) },
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
    <main className="app">
      <header className="app-head">
        <p className="eyebrow">Build a harness - Basics</p>
        <h1>Chat playground</h1>
      </header>

      <div className="columns">
        {/* Left: what a user of the app sees. */}
        <section className="panel">
          <span className="panel-title">Conversation</span>

          <div className="messages">
            {conversation.length === 0 && (
              <p className="hint">Chat history is empty.</p>
            )}
            {conversation.map((entry, i) => (
              <div key={i} className={`message ${entry.role}`}>
                <span className="who">{entry.role}</span>
                {entry.text}
              </div>
            ))}
            {sending && <span className="pending">...</span>}
          </div>

          <form
            className="chat-form"
            onSubmit={(e) => {
              e.preventDefault();
              sendChat();
            }}
          >
            <input
              value={message}
              onChange={(e) => changeMessage(e.target.value)}
              placeholder="Type a message and press Enter"
              disabled={sending}
            />
            <button
              type="submit"
              className="btn"
              disabled={sending || !message.trim()}
            >
              Send
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => setConversation([])}
            >
              Clear
            </button>
          </form>
        </section>

        {/* Right: what actually goes over the wire. */}
        <div className="stack">
          <section className="panel">
            <span className="panel-title">
              Request body <span className="route">&rarr; /api/chat</span>
            </span>
            <p className="hint">The raw body we send to our server.</p>
            <textarea
              className={bodyError ? "code-input invalid" : "code-input"}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              spellCheck={false}
            />
            {bodyError && <span className="error">{bodyError}</span>}
            <button
              type="button"
              className="btn ghost"
              onClick={sendBody}
              disabled={sending || Boolean(bodyError)}
            >
              Send as message
            </button>
          </section>

          <section className="panel">
            <span className="panel-title">
              Raw response <span className="route">&larr; /api/chat</span>
            </span>
            <pre className={response ? "code-output" : "code-output empty"}>
              {response || "Nothing sent yet."}
            </pre>
          </section>
        </div>
      </div>
    </main>
  );
}
