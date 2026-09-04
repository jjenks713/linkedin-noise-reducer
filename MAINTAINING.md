# Maintaining LinkedIn Noise Reducer

LinkedIn periodically updates its frontend, which can break the text labels and DOM structure the extension relies on. This guide explains how to check if something has changed and how to fix it.

---

## How the extension detects posts

The extension uses two detection methods in `content.js`:

**1. Exact label matching (Promoted, Suggested, People You May Know)**
It walks all text nodes on the page and looks for exact label strings:
```js
if (t === 'Promoted') ...
if (/^(suggested|recommended for you|jobs recommended for you)$/i.test(t)) ...
if (/^people you may know$/i.test(t)) ...
```

**2. Content pattern matching (Job Updates & Anniversaries)**
It searches post containers for keywords in the first 400 characters:
```js
/work anniversary|is celebrating|has a new job|started a new position|new role at|promoted to|joined .+ as|job updates|['']s job update/i
```

---

## How to check if LinkedIn changed something

### Step 1 — Load the extension and open LinkedIn
Go to `https://www.linkedin.com/feed/` with the extension active.

### Step 2 — Open DevTools Console (F12)
Temporarily add this line at the top of `content.js` inside the IIFE:
```js
console.log('[LNR] Script executing on', window.location.href);
```
Filter the console by `[LNR]` to confirm the script is running.

### Step 3 — Check if labels are still being found
Add this debug log inside `processRoot` right after the TreeWalker loop starts:
```js
if (/promoted|suggested|recommended|people you may know/i.test(t)) {
  console.log('[LNR] Found label:', JSON.stringify(t), 'container:', findPostContainer(node));
}
```
Reload the extension and check the console:
- If you see the label logged with a **container element** → detection is working
- If you see the label logged with **`null`** → `findPostContainer` needs updating
- If you see **nothing** → the label text itself has changed

### Step 4 — Find the new label text
If a post type is no longer being hidden, right-click the post on LinkedIn → **Inspect**, then look for the label text (e.g. where it says "Promoted" or "Suggested"). Copy the exact text including any special characters.

### Step 5 — Find the new container
If `findPostContainer` returns `null`, look at the parent chain logged in the console. Find the highest-level element that wraps the entire post card. Update `findPostContainer` in `content.js` to match:
```js
if (el.id && el.id.includes('FeedType')) return el; // current as of 2026
```
Add a new condition if LinkedIn changed the ID pattern.

---

## How to update

### Updating a label string
In `content.js`, find the relevant check and add the new label to the regex. For example if "Promoted" became "Sponsored":
```js
// Before
if (t === 'Promoted') ...

// After
if (/^(Promoted|Sponsored)$/i.test(t)) ...
```

### Updating the container selector
In `findPostContainer`, add the new attribute or ID pattern LinkedIn is using:
```js
if (el.id && el.id.includes('NewPatternHere')) return el;
```

### Updating job/anniversary patterns
Add new keyword patterns to the regex in `processRoot`:
```js
/work anniversary|is celebrating|...|new pattern here/i
```

---

## After making changes

1. Reload the extension in `chrome://extensions`
2. Open a fresh LinkedIn tab and verify posts are being hidden
3. Check the console for `[LNR] Hiding:` messages confirming it works
4. Bump the version in `manifest.json` (e.g. `1.0.0` → `1.0.1`)
5. Commit, push, and resubmit the zip to the Chrome Web Store
