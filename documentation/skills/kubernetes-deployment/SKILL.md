---
name: kubernetes-deployment
description: Deploy applications to Kubernetes using Helm charts, manage PVCs, and work with K8s jobs. Use this skill when deploying caelundas or managing Kubernetes resources.
license: MIT
---

# Kubernetes Deployment

This skill covers deploying applications to Kubernetes clusters, managing Persistent Volume Claims (PVCs), and working with Kubernetes jobs in this monorepo.

## Overview

The monorepo uses Kubernetes for deploying the caelundas ephemeris calendar generator as a scheduled job. The deployment workflow involves:

1. Building Docker images for linux/amd64
2. Pushing to GitHub Container Registry (GHCR)
3. Deploying to K8s using Helm charts
4. Managing PVCs for input/output data persistence

For comprehensive deployment patterns and infrastructure details, see [infrastructure/AGENTS.md](../../../infrastructure/AGENTS.md).

See [Deployment Models](../../architecture/deployment-models.md) for Job vs. Deployment decisions and PVC lifecycle guidance.

## Key Concepts

### Helm Charts

The monorepo includes a reusable Helm chart at [infrastructure/helm/kubernetes-job](../../../infrastructure/helm/kubernetes-job) for deploying batch jobs. Key features:

- **Auto-generated names**: Each deployment creates uniquely named resources
- **PVC management**: Mounts input and output volumes
- **Image pull secrets**: Supports private registries (GHCR)
- **Resource limits**: Configurable CPU and memory constraints

Jobs are preferred for batch workloads like caelundas. Deployments are for long-running services.

### Deployment Workflow

```bash
# Build Docker image for K8s platform
docker buildx build --platform linux/amd64 -f <dockerfile> -t <image> .

# Deploy to K8s cluster (generates unique job name)
helm upgrade --install <release-name> infrastructure/helm/kubernetes-job/ --values infrastructure/helm/kubernetes-job/values/base.yaml

# Retrieve output files after job completion
kubectl cp <pod>:/path/to/output <local-dir>

# Clean up completed jobs
helm uninstall <release-name>
```

### PVC Strategy

Applications use two PVCs:

- **Input PVC**: Configuration files, environment-specific data (read-only)
- **Output PVC**: Generated artifacts, logs, results (read-write)

Use `kubectl cp` to synchronize output files back to local filesystem after job completion.

## Project-Specific Patterns

### caelundas Deployment

See [applications/caelundas/AGENTS.md](../../../applications/caelundas/AGENTS.md) for detailed caelundas deployment workflows, including:

- Docker build configuration for monorepo workspace
- Environment variable management in K8s
- Output file retrieval from completed jobs
- Debugging failed K8s jobs

Key targets:

- `docker buildx build --platform linux/amd64 -f <dockerfile> -t <image> .` - Builds for linux/amd64
- `helm upgrade --install <release-name> infrastructure/helm/kubernetes-job/ --values infrastructure/helm/kubernetes-job/values/base.yaml` - Deploys with auto-generated name
- `kubectl cp <pod>:/path/to/output <local-dir>` - Retrieves output from PVC
- `helm uninstall <release-name>` - Removes completed jobs

## Infrastructure Configuration

### Helm Values

Configure deployments via `values.yaml`:

```yaml
image:
  repository: ghcr.io/jimmypaolini/caelundas
  tag: latest
  pullPolicy: Always

resources:
  limits:
    memory: 2Gi
    cpu: 1000m

volumes:
  input:
    name: caelundas-input
    mountPath: /app/input
  output:
    name: caelundas-output
    mountPath: /app/output
```

### Kubernetes Context

Deployments use the K8s context from `~/Personal/lexico-prod-kubeconfig.yaml`. Ensure the context is set before running deployment commands:

```bash
export KUBECONFIG=~/Personal/lexico-prod-kubeconfig.yaml
kubectl config current-context
```

## Common Tasks

### Deploy New Version

```bash
# Build and push image
docker buildx build --platform linux/amd64 -f <dockerfile> -t <image> .

# Deploy to cluster
helm upgrade --install <release-name> infrastructure/helm/kubernetes-job/ --values infrastructure/helm/kubernetes-job/values/base.yaml
```

### Check Job Status

```bash
# List all jobs
kubectl get jobs -n default

# Get job details
kubectl describe job <job-name>

# View logs
kubectl logs job/<job-name>
```

### Retrieve Results

```bash
# Copy files from output PVC
kubectl cp <pod>:/path/to/output <local-dir>

# Or manually
kubectl cp <pod-name>:/app/output ./output
```

### Troubleshooting

**Job fails to start:**

- Check image pull secrets: `kubectl get secret ghcr-credentials`
- Verify image exists in registry: `docker pull ghcr.io/jimmypaolini/caelundas:latest`
- Check PVC bindings: `kubectl get pvc`

**PVC mount failures:**

- Ensure PVCs exist: `kubectl get pvc`
- Check access modes (ReadWriteOnce vs ReadWriteMany)
- Verify storage class supports dynamic provisioning

**Resource constraints:**

- Check node capacity: `kubectl describe nodes`
- Adjust resource limits in values.yaml
- Consider node selectors for specific workloads

## Rollback Procedures

### Helm Rollback

If a deployment causes issues, rollback to a previous revision:

```bash
# List release history
helm history <release-name>

# Rollback to previous revision
helm rollback <release-name> <revision-number>

# Rollback to the most recent successful revision
helm rollback <release-name> 0
```

### Kubernetes Job Rollback

Since caelundas runs as a K8s job (not a long-running deployment), rollback means:

1. **Delete the failed job**: `helm uninstall <release-name>`
2. **Revert the Docker image**: Tag the previous working image as `latest`
3. **Redeploy**: `helm upgrade --install <release-name> infrastructure/helm/kubernetes-job/ --values infrastructure/helm/kubernetes-job/values/base.yaml`

```bash
# Check which image version was running
kubectl get jobs -o jsonpath='{.items[*].spec.template.spec.containers[*].image}'

# Retag previous image as latest
docker tag ghcr.io/jimmypaolini/caelundas:<previous-sha> ghcr.io/jimmypaolini/caelundas:latest
docker push ghcr.io/jimmypaolini/caelundas:latest

# Redeploy
helm upgrade --install <release-name> infrastructure/helm/kubernetes-job/ --values infrastructure/helm/kubernetes-job/values/base.yaml
```

## Related Documentation

- [infrastructure/AGENTS.md](../../../infrastructure/AGENTS.md) - Infrastructure architecture
- [applications/caelundas/AGENTS.md](../../../applications/caelundas/AGENTS.md) - Caelundas deployment workflow
- [infrastructure/helm/kubernetes-job/Chart.yaml](../../../infrastructure/helm/kubernetes-job/Chart.yaml) - Helm chart metadata

## Best Practices

1. **Always specify platform** when building Docker images: `--platform linux/amd64`
2. **Use auto-generated names** for jobs to avoid conflicts
3. **Set resource limits** to prevent OOM kills
4. **Clean up completed jobs** to avoid cluster bloat
5. **Use image pull secrets** for private registries
6. **Monitor PVC usage** to prevent disk pressure
7. **Tag images with commit SHA** for traceability
