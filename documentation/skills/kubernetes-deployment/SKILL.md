---
name: kubernetes-deployment
description: Deploy applications to Kubernetes using Helm charts, manage PVCs, and work with K8s jobs. Use this skill when deploying caelundas or managing Kubernetes resources.
license: MIT
---

# Kubernetes Deployment

Use this skill when working with the shared Kubernetes and Terraform assets in
this monorepo.

## Current Repository State

- The repository ships reusable infrastructure under `infrastructure/`.
- `infrastructure/helm/kubernetes-job/` contains the shared Helm chart for
  batch-style workloads.
- `infrastructure/terraform/` contains Terraform configuration.
- No checked-in application currently exposes dedicated Kubernetes Nx targets
  such as `docker-build`, `helm-upgrade`, or `kubernetes-copy-files`.

## Preferred Commands

Use the native tools directly:

```bash
docker build --platform linux/amd64 -t <image-name> .
kubectl get jobs
helm upgrade --install <release-name> infrastructure/helm/kubernetes-job \
  --values infrastructure/helm/kubernetes-job/values/base.yaml
cd infrastructure/terraform && terraform plan
```

## Helm Chart Notes

The shared chart at `infrastructure/helm/kubernetes-job/` is designed for
one-shot jobs rather than long-running services. Review these files first:

- `infrastructure/helm/kubernetes-job/Chart.yaml`
- `infrastructure/helm/kubernetes-job/templates/`
- `infrastructure/helm/kubernetes-job/values/`

## Troubleshooting Checklist

- Confirm the Kubernetes context before applying changes.
- Verify PVCs, Secrets, and image references with `kubectl describe`.
- Prefer commit-SHA image tags over mutable tags when debugging deployments.
- If you need project-level Nx deployment targets, document and implement them
  before referencing them in other docs.

## Related Documentation

- [infrastructure/AGENTS.md](../../../infrastructure/AGENTS.md)
- [infrastructure/README.md](../../../infrastructure/README.md)
- [Deployment Models](../../architecture/deployment-models.md)
