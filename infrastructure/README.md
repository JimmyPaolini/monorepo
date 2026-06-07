# Infrastructure

**Kubernetes deployment tools and cloud infrastructure configuration for the monorepo.**

> For detailed architecture, deployment patterns, Helm chart configuration, and troubleshooting, see [AGENTS.md](AGENTS.md).

## Contents

| Directory                                  | Purpose                                                        |
| ------------------------------------------ | -------------------------------------------------------------- |
| [helm/kubernetes-job](helm/kubernetes-job) | Reusable Helm chart for batch job deployments with PVC storage |
| [terraform/](terraform)                    | Linode LKE (Kubernetes) cluster provisioning                   |

## Quick Start

### Deploy Application with Helm

```bash
# Build, push, and deploy
docker buildx build \
  --platform linux/amd64 \
  -f <path-to-Dockerfile> \
  -t ghcr.io/<owner>/<image>:<tag> .
docker push ghcr.io/<owner>/<image>:<tag>
helm upgrade --install <release-name> infrastructure/helm/kubernetes-job/ \
  --values infrastructure/helm/kubernetes-job/values/base.yaml

# Monitor completion
kubectl get jobs -w

# Clean up
helm uninstall <release-name>
```

Replace placeholders as follows:

- `<path-to-Dockerfile>`: Dockerfile path for the app you are deploying
- `<owner>/<image>`: GHCR namespace and image name (for example, `jimmypaolini/caelundas`)
- `<tag>`: Image tag (for example, `latest` or a commit SHA)
- `<release-name>`: Unique Helm release name for this job run

### Provision Kubernetes Cluster

```bash
cd infrastructure/terraform
terraform init
terraform plan -var="linode_token=$LINODE_API_TOKEN"
terraform apply -var="linode_token=$LINODE_API_TOKEN"
```

## Deployment Pipeline

```text
Code → Docker Build → Push to GHCR → Helm Upgrade → K8s Job → Retrieve Output
```

1. **Build**: `docker buildx build ... --platform linux/amd64` (from workspace root)
2. **Push**: `docker push <image>` (to GHCR)
3. **Secret**: `kubectl create secret ...` (optional, for runtime environment variables)
4. **Deploy**: `helm upgrade --install <release-name> infrastructure/helm/kubernetes-job/...` (creates Job)
5. **Monitor**: `kubectl get jobs -w`
6. **Retrieve**: `kubectl cp` from the completed job/pod if needed
7. **Clean**: `helm uninstall <release-name>`

## Documentation

- **[AGENTS.md](AGENTS.md)**: Complete infrastructure architecture, Helm chart config, Terraform setup, troubleshooting
- **[caelundas AGENTS.md](../applications/caelundas/AGENTS.md)**: Application deployment example
- **[Main AGENTS.md](../AGENTS.md)**: Monorepo architecture and Nx workflows
