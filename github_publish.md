# GitHub Publication Guide

Follow these terminal commands to initialize your Git repository, commit the clean source code, link your GitHub repository, and push the code online.

---

## Step 1: Initialize Git Local Repository

Open your terminal, navigate to the root `eduops` project folder, and run:

```bash
# Initialize git in the root folder
git init

# Stage all files (respecting the .gitignore rules)
git add .

# Create the initial commit
git commit -m "feat: initial release of FutureEdge Admissions & Operations Suite"
```

---

## Step 2: Push to GitHub

1. Go to your **[GitHub Account](https://github.com/)** and create a new public repository named `futureedge-ops` (do not initialize it with a README or .gitignore, as we have already created them locally).
2. Copy the remote URL of your new repository (e.g., `git@github.com:yourusername/futureedge-ops.git` or `https://github.com/yourusername/futureedge-ops.git`).
3. Return to your terminal and run:

```bash
# Rename the default branch to main
git branch -M main

# Add the remote link pointing to your GitHub repository
git remote add origin <your-copied-github-repository-url>

# Push the local main branch to origin
git push -u origin main
```

---

## Step 3: Verifying Upload
After the command completes, refresh your GitHub repository page. You should see all folders (`backend`, `frontend`, `docs`) along with the `.gitignore` and professional `README.md` rendering on the homepage!
