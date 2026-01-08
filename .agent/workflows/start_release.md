---
description: Automate the release process: create branch, push, trigger GitHub Action, and merge.
---

1. Verify repository status and ensure we are on clean main branch.
   // turbo
2. Run `git checkout main; git pull origin main` to ensure we are up to date.
3. Create and switch to a release branch (e.g., `chore/release-v<VERSION>`).
   - Use `git checkout -b chore/release-auto`
4. Create an empty commit to trigger the flow (if no changes) or commit pending changes.
   - `git commit --allow-empty -m "chore: trigger release workflow"`
     // turbo
5. Push the branch to origin.
   - `git push -u origin chore/release-auto`
6. Trigger the workflow `main.yml` using `gh`.
   - Ask user for version if not provided.
   - Command: `gh workflow run main.yml --ref chore/release-auto -f version=<VERSION>`
7. Monitor the workflow run.
   - `gh run list --workflow main.yml --limit 1`
   - Wait for "completed" / "success".
8. If successful, merge back to main.
   - `git checkout main`
   - `git merge chore/release-auto`
   - `git push origin main`
9. Cleanup branches.
   - `git branch -d chore/release-auto`
   - `git push origin --delete chore/release-auto`
