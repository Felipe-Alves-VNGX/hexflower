---
description: Update git repository and push changes
---

1. Run `git status --porcelain`. If there are no changes, stop.
2. Check the current branch using `git branch --show-current`. Abort if pushing to a protected branch is not allowed.
3. Review changes with `git diff`.
4. Stage relevant changes using `git add .` (or `git add -u` if appropriate).
5. Ensure there are staged changes; do not create empty commits.
6. Commit with a clear, descriptive message explaining what changed and why.
7. Verify the remote with `git remote -v`.
8. Push using `git push origin HEAD`.
9. Confirm the repository is clean after push.
