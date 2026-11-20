# Publishing to GitHub

Nothing here is run for you. Publish only when you are ready.

```bash
git init
git add .
git commit -m "NEXORA: universal business report studio"
git branch -M main
```

Create an empty public repository named `nexora-hyper-elements` on GitHub (no README, no license), then:

```bash
git remote add origin https://github.com/<your-username>/nexora-hyper-elements.git
git push -u origin main
```

Before pushing:

1. Run `npm install` so `package-lock.json` is created, and commit it.
2. Run `npm test`, `npm run build`, `npm run samples` and `npm run screenshots`, and commit the results.
3. Read `docs/api-notes.md` and tick the verification items.
4. Check `git status` shows no `.env` files or `node_modules`.
