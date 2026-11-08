// Chat. Geschützte Datei: Netzwerkzugriff wie suggest.js.
// Am PC (breites Fenster) steht der Chat fest neben dem Spiel und ist immer verbunden.
// Am Handy öffnet [ CHAT ] ihn als Vollbild; nur dann besteht die Verbindung.
// Lesen kann jeder. Schreiben braucht ein Ticket für heute, das es nach dem Captcha vom Worker gibt.
// Alle Texte kommen als Text ins DOM (textContent), nie als HTML.
import { SUGGEST_URL } from './config.js';
import { berlinDay, createCaptcha } from './suggest.js';

const TICKET_KEY = 'overnight.chatTicket';
const MAX_SHOWN = 100;
const WIDE = '(min-width: 1000px)';
const $ = (id) => document.getElementById(id);

function readTicket() {
  try {
    const ticket = JSON.parse(localStorage.getItem(TICKET_KEY));
    return ticket?.day === berlinDay() ? ticket : null;
  } catch {
    return null;
  }
}

function storeTicket(ticket) {
  try {
    localStorage.setItem(TICKET_KEY, JSON.stringify(ticket));
  } catch {
    // Ohne Speicher muss man nach dem Neuladen noch einmal beitreten.
  }
}

const clock = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export function setupChat({ archived }) {
  const opener = $('open-chat');
  if (archived || !SUGGEST_URL) {
    opener.hidden = true;
    $('chat-pane').hidden = true;
    document.body.classList.add('no-chat');
    return;
  }
  const pane = $('chat-pane');
  const wide = window.matchMedia(WIDE);
  const list = $('chat-list');
  const status = $('chat-status');
  const input = $('chat-input');
  const captcha = createCaptcha($('chat-captcha'));
  let ticket = readTicket();
  let ws = null;
  let myName = null;
  let retry = null;

  const say = (text) => { status.textContent = text; };

  function showMode() {
    const canWrite = Boolean(ticket && myName);
    $('chat-compose').hidden = !canWrite;
    $('chat-join').hidden = canWrite;
    $('chat-name').textContent = canWrite ? `You are ${myName} today.` : 'Reading only. Join to write.';
    if (!canWrite) captcha.load();
  }

  function line(message) {
    const li = document.createElement('li');
    li.dataset.id = String(message.id);
    const time = document.createElement('span');
    time.className = 'chat-time';
    time.textContent = clock(message.ts);
    const name = document.createElement('span');
    name.className = message.name === myName ? 'chat-name chat-me' : 'chat-name';
    name.textContent = message.name;
    const text = document.createElement('span');
    text.className = 'chat-text';
    text.textContent = message.text;
    li.append(time, name, text);
    if (message.name !== myName) {
      const report = document.createElement('button');
      report.className = 'chat-report';
      report.textContent = '!';
      report.setAttribute('aria-label', `Report this message from ${message.name}`);
      report.addEventListener('click', () => {
        if (!ticket) return say('Join the chat to report messages.');
        ws?.send(JSON.stringify({ type: 'report', id: message.id }));
        report.disabled = true;
        return undefined;
      });
      // Vorne einfügen, damit er rechts in der ersten Zeile schwebt.
      li.prepend(report);
    }
    return li;
  }

  function add(message) {
    list.append(line(message));
    while (list.children.length > MAX_SHOWN) list.firstElementChild.remove();
    list.scrollTop = list.scrollHeight;
  }

  function connect() {
    clearTimeout(retry);
    ws?.close();
    const url = new URL('chat', SUGGEST_URL);
    url.protocol = 'wss:';
    if (ticket) url.searchParams.set('ticket', ticket.ticket);
    say('Connecting…');
    const socket = new WebSocket(url);
    ws = socket;
    socket.addEventListener('message', (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      if (data.type === 'hello') {
        // Ohne gültiges Ticket meldet der Server keinen Namen: dann nur lesen.
        myName = data.name;
        if (!myName) ticket = null;
        list.replaceChildren();
        for (const message of data.history ?? []) add(message);
        if (!list.children.length) say('Nobody has said anything yet. Be the first.');
        else say('');
        showMode();
      } else if (data.type === 'msg') {
        add(data.message);
        // Sprechblase über der Figur auf der Karte (main.js). Nur neue Nachrichten, nicht der Verlauf.
        document.dispatchEvent(new CustomEvent('overnight:chat', {
          detail: { id: data.message.id, name: data.message.name, text: data.message.text, mine: data.message.name === myName },
        }));
        if (status.textContent.startsWith('Nobody')) say('');
      } else if (data.type === 'hide') {
        document.dispatchEvent(new CustomEvent('overnight:chat-hide', { detail: { id: Number(data.id) } }));
        list.querySelector(`[data-id="${Number(data.id)}"]`)?.remove();
      } else if (data.type === 'error') {
        say(String(data.text ?? 'That did not work.'));
      } else if (data.type === 'reported') {
        say('Reported. Thank you. Three reports hide a message.');
      }
    });
    socket.addEventListener('close', () => {
      if (ws !== socket || !visible()) return;
      say('Connection lost. Trying again…');
      retry = setTimeout(connect, 3000);
    });
  }

  // Sichtbar heißt: breites Fenster, oder am Handy geöffnet.
  const visible = () => wide.matches || document.body.classList.contains('chat-open');
  const disconnect = () => {
    clearTimeout(retry);
    const socket = ws;
    ws = null;
    socket?.close();
  };
  const sync = () => {
    if (visible() && !ws) connect();
    if (!visible() && ws) disconnect();
  };
  opener.addEventListener('click', () => {
    if (wide.matches) {
      input.focus();
      return;
    }
    document.body.classList.add('chat-open');
    sync();
  });
  $('chat-close').addEventListener('click', () => {
    document.body.classList.remove('chat-open');
    sync();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.body.classList.contains('chat-open')) {
      document.body.classList.remove('chat-open');
      sync();
    }
  });
  wide.addEventListener('change', sync);
  sync();

  $('chat-join-button').addEventListener('click', async () => {
    if (captcha.missing) return say('Please finish the check above first.');
    say('Joining…');
    try {
      const response = await fetch(new URL('chat/ticket', SUGGEST_URL), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: captcha.token }),
      });
      if (!response.ok) throw new Error(String(response.status));
      const data = await response.json();
      ticket = { day: berlinDay(), ticket: data.ticket };
      storeTicket(ticket);
      connect();
    } catch {
      say("That didn't work. Try again later.");
    } finally {
      captcha.reset();
    }
    return undefined;
  });

  const send = () => {
    const text = input.value.trim();
    if (!text || !ws) return;
    ws.send(JSON.stringify({ type: 'say', text }));
    input.value = '';
  };
  $('chat-send').addEventListener('click', send);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      send();
    }
  });
}
