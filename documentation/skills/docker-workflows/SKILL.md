---
name: docker-workflows
description: Build and deploy Docker images in the monorepo - platform targeting, GHCR integration, and container optimization. Use this skill when working with Docker.
license: MIT
---

# Docker Workflows

Use this skill when you need to build or inspect container images for this
workspace.

## Current Repository State

- The workspace documentation standard prefers direct Docker CLI commands.
- The checked-in projects do **not** currently expose dedicated Nx Docker
  targets such as `docker-build` or `docker-push`.
- Infrastructure assets that may consume images live under `infrastructure/`.

## Preferred Commands

```bash
docker build --platform linux/amd64 -t ghcr.io/jimmypaolini/<image>:<tag> .
docker push ghcr.io/jimmypaolini/<image>:<tag>
docker history ghcr.io/jimmypaolini/<image>:<tag>
docker run --rm -it ghcr.io/jimmypaolini/<image>:<tag> sh
```

## Best Practices

- Always set `--platform linux/amd64` for images intended for the deployed
  infrastructure.
- Keep build context small with a `.dockerignore` file.
- Prefer immutable tags such as commit SHAs over `latest` when debugging.
- Inspect resulting layers with `docker history` when optimizing image size.

## Related Documentation

- [applications/caelundas/AGENTS.md](../../../applications/caelundas/AGENTS.md)
- [infrastructure/AGENTS.md](../../../infrastructure/AGENTS.md)
- [kubernetes-deployment](../kubernetes-deployment/SKILL.md)
