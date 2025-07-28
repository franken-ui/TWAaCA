# TWAaCA – Tailwind As a Custom Attribute

> **Disclaimer:** This is an **experimental** project for a very specific audience. It's not meant to replace Tailwind CSS.
> If you're already using a build pipeline, you're better off sticking with Tailwind.

But if you're working with plain HTML, CDN scripts, or projects where you don't want a build step (or because you simply just don't have a choice. 👋 Hello .NET and vanilla PHP users), this might be what you're looking for.

> This is not affiliated with Tailwind CSS or their brand.
> Very early-stage. Things might break. Things might change.
> This is a proof of concept that came out of my boredom, and I just want to see if it makes sense to anyone else.

---

## ✨ About

**TWAaCA (Tailwind As a Custom Attribute)** is a tiny JavaScript utility that brings the power of Tailwind-style utility-first design to your HTML using custom attributes.

It uses the official Tailwind Design API under the hood to generate scoped, responsive styles in the browser, without a build step.

* ✅ No build tools
* ✅ No large CSS files
* ✅ No PostCSS, no npm
* ✅ Just plain HTML and JavaScript

Write HTML like:

```html
<div data-tw-font-size="md:16 sm:12"></div>
```

And the styles will be generated dynamically using real Tailwind design tokens.

---

## 🧩 The Problem It Solves

Tailwind is great, but sometimes it's too much. Especially when:

1. You want Tailwind's design system without setting up a build pipeline or shipping 300 KB of unused styles.
2. You're working in environments where Vite, npm or file watchers are next to impossible or you just simply don't want to do it.
3. You need mobile-first responsive utilities but don't want to write 30 classes in every `class=""` attribute.

---

## ⚙️ What It Does

* Scans your HTML for `data-tw-*="value"` attributes
* Uses the Tailwind Design API to convert those into CSS
* Injects those styles directly into the document
* Supports variants and responsive prefixes like `sm:`, `md:`, `lg:`, `dark:`, `hover:`, etc

---

## ❓ Why Use This?

**Tailwind Play?**
It's great, but it's huge. Not ideal for production. Sure, it only gets downloaded once, but have you ever had users on slow connections or data-capped plans? TWAaCA generates only what’s needed, when it’s needed. Just like their Oxide, but this one runs entirely in the browser!

**Inline styles?**
You can't use media queries or pseudo-selectors in inline styles. And utility chaining gets messy.

**Giant `class=""` attributes?**
They're hard to read and even harder to maintain. With `data-tw-*`, your intent is clearer. **Say hello to `CTRL + F`.**

---

## 🤯 Are You Also Tired Of This?

> "Does `text-*` control the color, size, alignment, or decoration?
> "What does `font-*` even mean here? `tracking-*`, `leading-*`? What?!"

Yeah, same.

That's why TWAaCA uses attribute names that mirror actual CSS properties. No guessing, no decoding Tailwind abstractions.

```html
<p data-tw-font-weight="bold" data-tw-text-align="center" data-tw-font-size="sm:14 md:18"></p>
```

You write what you mean. It's simple and readable.

---

## 🔍 Example Usage

```html
<!-- Basic font size -->
<div data-tw-font-size="16"></div>

<!-- Responsive font weight -->
<span data-tw-font-weight="bold md:normal"></span>

<!-- Padding and margin (shorthand) -->
<div data-tw-pt="4" data-tw-px="2 md:6"></div>

<!-- Flex layout -->
<section data-tw-display="flex" data-tw-justify-content="center md:space-between"></section>

<!-- Text and color utilities -->
<p data-tw-color="gray-700 dark:white" data-tw-text-align="center"></p>
```

---

## ⚠️ Known Issues

### CLS (Cumulative Layout Shift)

This is expected. Since styles are generated at runtime, layout shifts may happen.

**Suggestions:**

* Cloak elements until styles are applied (will be implemented soon)
* Set default sizes to stabilize layout
* If you're building admin tools or internal apps, this might not be a big deal

---

## 📦 Installation

I haven't published this to any CDN yet. I'm being a little lazy right now, but I really want to get it out for feedback.

**If you want to test it:**

* Grab the `core.css` and `twaaca.js` files from the repo
* Include them in your HTML like this:

```html
<link rel="stylesheet" href="./core.css">
<script src="./twaaca.js"></script>
```

That's it. Start using `data-tw-*` attributes in your HTML and see what happens.

---

## 🛠️ Roadmap / WIP

There are lots of things to do!

---

## 📣 Feedback Welcome

This project is still experimental. Got ideas, bugs, or cool use cases? Feel free to open an issue or share your thoughts.
