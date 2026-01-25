# Infrastructure

**Kubernetes deployment tools and cloud infrastructure configuration for the monorepo.**

This directory contains reusable Helm charts for deploying applications to Kubernetes clusters and Terraform configurations for provisioning cloud infrastructure.

## Contents

- **[helm/kubernetes-job](helm/kubernetes-job)**: Reusable Helm chart for batch job deployments with PersistentVolumeClaim storage
- **[terraform/](terraform)**: Linode LKE (Kubernetes) cluster provisioning

## Quick Start

### Deploy Application with Helm

```bash
# 1. Build and push Docker image
cd applications/caelundas
nx run caelundas:docker-build
nx run caelundas:docker-push

# 2. Create Kubernetes secret (one-time)
kubectl apply -f kubernetes/secret.yaml

# 3. Deploy with Helm
nx run caelundas:helm-upgrade
# Outputs release name: caelundas-20260125-143022

# 4. Monitor job completion
kubectl get jobs -l app.kubernetes.io/name=caelundas -w

# 5. Retrieve output files
nx run caelundas:kubernetes-copy-files -- --release-name=caelundas-20260125-143022

# 6. Clean up
nx run caelundas:helm-uninstall -- --release-name=caelundas-20260125-143022
```

### Provision Kubernetes Cluster

```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Plan changes
terraform plan -var="linode_token=$LINODE_API_TOKEN"

# Apply configuration
terraform apply -var="linode_token=$LINODE_API_TOKEN"

# Get kubeconfig
linode-cli lke kubeconfig-view <cluster-id> --json | \
  jq -r '.[0].kubeconfig' | base64 -d > ~/.kube/lexico-prod-kubeconfig.yaml

export KUBECONFIG=~/.kube/lexico-prod-kubeconfig.yaml
kubectl get nodes
```

## Helm Chart: kubernetes-job

### Purpose

Reusable Helm chart for deploying applications as Kubernetes Jobs (one-time execution) with optional PersistentVolumeClaim for output storage.

**Use Cases**:

- Batch processing (e.g., astronomical calendar generation)
- Data migration scripts
- Report generation
- Database backups

### Helm Chart Configuration

**Base Values** ([helm/kubernetes-job/values/base.yaml](helm/kubernetes-job/values/base.yaml))

```yaml
image:
  repository: my-application
  tag: "1.0.0"

job:
  backoffLimit: 3                # Retry attempts
  completions: 1                 # Successful runs required
  ttlSecondsAfterFinished: 86400 # Auto-delete after 24 hours

persistence:
  enabled: true
  size: 1Gi
  mountPath: /app/output

environment variables via Kubernetes Secrets
env:
  - name: MY_VAR
    valueFrom:
      secretKeyRef:
        name: my-secret
        key: my-key
```

#### Application-Specific Overrides

```yaml
# helm/kubernetes-job/values/caelundas-production.yaml
image:
  repository: ghcr.io/jimmypaolini/caelundas
  tag: "1.0.0"

persistence:
  size: 2Gi

env:
  - name: START_DATE
    valueFrom:
      secretKeyRef:
        name: caelundas-env-secret
        key: START_DATE
```

### Deploy with Helm

```bash
helm upgrade --install <release-name> infrastructure/helm/kubernetes-job/ \
  --values infrastructure/helm/kubernetes-job/values/caelundas-production.yaml \
  --set image.tag=1.0.0
```

### Retrieve Output Files

```bash
# List files in PVC
kubectl exec -it <pod-name> -- ls -lah /app/output

# Copy files to local machine
kubectl cp <pod-name>:/app/output/calendar.ics ./output/calendar.ics
```

See application-specific scripts (e.g., [applications/caelundas/scripts/kubernetes-copy-files.sh](../applications/caelundas/scripts/kubernetes-copy-files.sh)) for automated retrieval.

## Terraform: Linode LKE Cluster

### Cluster Configuration

**Cluster Specification** ([terraform/main.tf](terraform/main.tf))

```terraform
resource "linode_lke_cluster" "cluster" {
  label       = "lexico-prod"
  k8s_version = "1.34"
  region      = var.linode_region

  pool {
    type  = "g6-standard-1"  # 2 vCPU, 4GB RAM
    count = 1

    autoscaler {
      min = 1
      max = 3
    }
  }
}
```

### Workflows

```bash
# Initialize
terraform init

# Preview changes
terraform plan -var="linode_token=$LINODE_API_TOKEN"

# Apply changes
terraform apply -var="linode_token=$LINODE_API_TOKEN"

# Destroy infrastructure (⚠️ deletes cluster)
terraform destroy -var="linode_token=$LINODE_API_TOKEN"
```

### Connecting to Cluster

```bash
# Download kubeconfig
linode-cli lke kubeconfig-view <cluster-id> --json | \
  jq -r '.[0].kubeconfig' | base64 -d > ~/.kube/lexico-prod-kubeconfig.yaml

# Use kubeconfig
export KUBECONFIG=~/.kube/lexico-prod-kubeconfig.yaml
kubectl get nodes
```

## Docker Image Workflows

### Build for Kubernetes

Always build for `linux/amd64` platform (Kubernetes cluster architecture):

```bash
docker buildx build --platform linux/amd64 \
  -f applications/caelundas/Dockerfile \
  -t ghcr.io/jimmypaolini/caelundas:1.0.0 \
  --load .
```

### Push to GitHub Container Registry

```bash
# Login
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Build and push
docker buildx build --platform linux/amd64 \
  -f applications/caelundas/Dockerfile \
  -t ghcr.io/jimmypaolini/caelundas:1.0.0 \
  --push .
```

### Image Pull Secrets (for private registries)

```bash
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=USERNAME \
  --docker-password=$GITHUB_TOKEN

# Reference in Helm values
imagePullSecrets:
  - name: ghcr-secret
```

## Deployment Pipeline

```text
Code → Docker Build → Push to GHCR → Helm Upgrade → K8s Job → Retrieve Output
```

1. **Build**: `nx run <app>:docker-build` (linux/amd64 platform)
2. **Push**: `nx run <app>:docker-push` (to GHCR)
3. **Secret**: `kubectl apply -f <app>/kubernetes/secret.yaml` (one-time)
4. **Deploy**: `nx run <app>:helm-upgrade` (creates Job)
5. **Monitor**: `kubectl get jobs -w`
6. **Retrieve**: `nx run <app>:kubernetes-copy-files`
7. **Clean**: `nx run <app>:helm-uninstall`

## Troubleshooting

### Job Not Starting

```bash
kubectl describe job <job-name>

# Common causes:
# - Image pull failure (check imagePullSecrets)
# - PVC pending (check storage class)
# - Resource limits too high
```

### PVC Not Binding

```bash
kubectl get pvc
kubectl describe pvc <pvc-name>

# Common causes:
# - StorageClass doesn't exist
# - No available storage
# - Access mode not supported
```

### Pod Crashing

```bash
kubectl logs <pod-name>
kubectl logs <pod-name> --previous

# Common causes:
# - Application error
# - Missing environment variables
# - Wrong platform (use linux/amd64)
```

### Image Pull Failure

```bash
# Verify image exists
docker pull ghcr.io/jimmypaolini/caelundas:1.0.0

# Check imagePullSecrets configured
kubectl get secret ghcr-secret
```

## Best Practices

### Security

- Never commit secrets to git
- Use Kubernetes Secrets for sensitive data
- Set resource limits to prevent exhaustion
- Use RBAC for least-privilege access

### Reliability

- Set appropriate `backoffLimit` for retries
- Use `ttlSecondsAfterFinished` for auto-cleanup
- Monitor job completion with alerts
- Test deployments in staging first

### Cost Optimization

- Use node autoscaling (min=1, max=3)
- Delete completed jobs and PVCs promptly
- Set accurate resource requests
- Use spot instances for batch jobs (if supported)

## Documentation

For detailed architecture, deployment patterns, and troubleshooting:

- **[AGENTS.md](AGENTS.md)**: Complete infrastructure documentation
- **[Main AGENTS.md](../AGENTS.md)**: Monorepo architecture and Nx workflows
- **[caelundas AGENTS.md](../applications/caelundas/AGENTS.md)**: Application deployment example

External resources:

- [Helm Documentation](https://helm.sh/docs/): Chart development
- [Kubernetes Documentation](https://kubernetes.io/docs/): API reference
- [Terraform Documentation](https://developer.hashicorp.com/terraform/docs): Configuration language
- [Linode LKE](https://www.linode.com/docs/guides/deploy-and-manage-a-cluster-with-linode-kubernetes-engine-a-tutorial/): Cluster management

## License

See [LICENSE](../LICENSE) for licensing information.
