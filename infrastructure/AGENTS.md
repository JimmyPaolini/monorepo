# Infrastructure: Kubernetes & Cloud Deployment

## Architecture Overview

The infrastructure directory contains reusable Helm charts and Terraform configurations for deploying monorepo applications to Kubernetes clusters. Current focus is on batch job deployments (caelundas) with PersistentVolumeClaim storage for output files.

### Technology Stack

- **Container Orchestration**: Kubernetes 1.34+
- **Package Management**: Helm 3 (templating and release management)
- **Infrastructure as Code**: Terraform (cluster provisioning)
- **Cloud Provider**: Linode LKE (Linode Kubernetes Engine)
- **Container Registry**: GitHub Container Registry (GHCR)

### Directory Structure

```text
infrastructure/
├── helm/
│   ├── kubernetes-job/      # Reusable Helm chart for batch jobs
│   │   ├── Chart.yaml       # Chart metadata
│   │   ├── templates/       # Kubernetes resource templates
│   │   │   ├── job.yaml     # Job specification
│   │   │   ├── pvc.yaml     # PersistentVolumeClaim
│   │   │   └── _helpers.tpl # Template helpers
│   │   └── values/          # Configuration files
│   │       ├── base.yaml    # Default values
│   │       └── caelundas-production.yaml  # Application-specific overrides
└── terraform/
    ├── main.tf              # Linode LKE cluster definition
    ├── variables.tf         # Input variables
    └── .terraform/          # Terraform state and plugins
```

## Helm Charts

### kubernetes-job Chart

**Purpose**: Reusable Helm chart for deploying applications as Kubernetes Jobs (one-time execution) with optional PersistentVolumeClaim for output storage.

**Use Cases**:

- Batch processing (e.g., caelundas astronomical calendar generation)
- Data migration scripts
- Report generation
- Database backups
- Any workload that runs to completion

**Why Jobs Not Deployments?**

- **Jobs**: Run once and terminate (exit code 0 = success, non-zero = failure)
  - Ideal for: Batch processes, cron-like tasks, data processing
  - Lifecycle: Create → Run → Complete → (optional) Auto-delete after TTL

- **Deployments**: Always running, restart on failure
  - Ideal for: Web servers, APIs, long-running daemons
  - Lifecycle: Create → Run indefinitely → Scale/Update

### Chart Configuration

**Chart Metadata** ([helm/kubernetes-job/Chart.yaml](helm/kubernetes-job/Chart.yaml))

```yaml
apiVersion: v2
name: kubernetes-job
description: A reusable Helm chart for deploying applications as Kubernetes Jobs
version: 0.1.0
appVersion: "1.0"
```

**Base Values** ([helm/kubernetes-job/values/base.yaml](helm/kubernetes-job/values/base.yaml))

```yaml
image:
  repository: my-application # Override with actual image
  pullPolicy: IfNotPresent # Always, IfNotPresent, Never
  tag: "" # Defaults to appVersion from Chart.yaml

job:
  backoffLimit: 3 # Retry attempts before marking failed
  completions: 1 # Number of successful runs required
  parallelism: 1 # Number of pods running concurrently
  ttlSecondsAfterFinished: 86400 # Auto-delete after 24 hours

persistence:
  enabled: true # Create PVC for output storage
  storageClassName: standard # Cluster storage class (dynamic provisioning)
  accessMode: ReadWriteOnce # RWO (single node), RWX (multi-node)
  size: 1Gi # Storage capacity
  mountPath: /app/output # Container mount path

env: [] # Environment variables (see below)
command: [] # Override container entrypoint
args: [] # Override container args
resources: {} # CPU/memory limits and requests
```

**Application-Specific Overrides** ([helm/kubernetes-job/values/caelundas-production.yaml](helm/kubernetes-job/values/caelundas-production.yaml))

```yaml
image:
  repository: ghcr.io/jimmypaolini/caelundas
  tag: "1.0.0"

job:
  backoffLimit: 1 # Caelundas shouldn't retry automatically
  ttlSecondsAfterFinished: 3600 # Delete after 1 hour (files retrieved by then)

persistence:
  size: 2Gi # Caelundas may generate large .ics files
  mountPath: /app/output

env:
  - name: START_DATE
    valueFrom:
      secretKeyRef:
        name: caelundas-env-secret
        key: START_DATE
  - name: END_DATE
    valueFrom:
      secretKeyRef:
        name: caelundas-env-secret
        key: END_DATE
  # ... more environment variables from secret
```

### Helm Templates

**Job Template** ([helm/kubernetes-job/templates/job.yaml](helm/kubernetes-job/templates/job.yaml))

Key features:

- Templated Job name with release name
- Labels for tracking (app, chart, release, git commit, timestamp)
- Environment variables from values or secrets
- PVC volume mounting (if `persistence.enabled`)
- Resource limits/requests
- Node selection, affinity, tolerations

**PVC Template** ([helm/kubernetes-job/templates/pvc.yaml](helm/kubernetes-job/templates/pvc.yaml))

Creates PersistentVolumeClaim when `persistence.enabled`:

- Dynamic provisioning via `storageClassName`
- Access mode: ReadWriteOnce (single node) or ReadWriteMany (multi-node)
- Size: Configurable via `persistence.size`
- Lifecycle: Manual deletion (not auto-deleted with Job)

**Helpers Template** ([helm/kubernetes-job/templates/\_helpers.tpl](helm/kubernetes-job/templates/_helpers.tpl))

Reusable template functions:

- `kubernetes-job.fullname`: Generate release-specific resource names
- `kubernetes-job.labels`: Standard Kubernetes labels
- `kubernetes-job.selectorLabels`: Pod selector labels

### Deploying with Helm

#### Install/Upgrade Release

```bash
helm upgrade --install <release-name> infrastructure/helm/kubernetes-job/ \
  --values infrastructure/helm/kubernetes-job/values/caelundas-production.yaml \
  --set image.tag=1.0.0 \
  --set metadata.gitCommit=$(git rev-parse HEAD) \
  --set metadata.timestamp=$(date +%s)
```

**Auto-Generated Release Names** (caelundas pattern)

```bash
# applications/caelundas/scripts/helm-upgrade.sh
RELEASE_NAME="caelundas-$(date +%Y%m%d-%H%M%S)"
helm upgrade --install "$RELEASE_NAME" infrastructure/helm/kubernetes-job/ \
  --values infrastructure/helm/kubernetes-job/values/caelundas-production.yaml
```

Benefits:

- No naming conflicts (each run gets unique name)
- Easy to track job history (`helm list`)
- Can run multiple jobs concurrently

#### List Releases

```bash
helm list --namespace default
# Shows: NAME, NAMESPACE, REVISION, UPDATED, STATUS, CHART, APP VERSION
```

#### Uninstall Release

```bash
helm uninstall <release-name>
# Note: Does NOT delete PVC by default (manual cleanup required)
```

#### Delete PVC

```bash
kubectl delete pvc <release-name>
# Or use applications/caelundas/scripts/helm-uninstall.sh (deletes both)
```

### Environment Variables Strategy

#### Security Best Practices

- ❌ **Never** hardcode secrets in values files (committed to git)
- ✅ **Always** use Kubernetes Secrets for sensitive data
- ✅ Reference secrets via `valueFrom.secretKeyRef` in values

#### Creating Secrets

```bash
# From literal values
kubectl create secret generic caelundas-env-secret \
  --from-literal=START_DATE=2026-01-01 \
  --from-literal=END_DATE=2026-12-31 \
  --from-literal=LATITUDE=40.7128 \
  --from-literal=LONGITUDE=-74.0060

# From env file
kubectl create secret generic caelundas-env-secret \
  --from-env-file=applications/caelundas/.env.production

# From YAML manifest
kubectl apply -f applications/caelundas/kubernetes/secret.yaml
```

#### Referencing Secrets in Values

```yaml
env:
  - name: DATABASE_PASSWORD
    valueFrom:
      secretKeyRef:
        name: my-secret # Secret name
        key: db-password # Key within secret
  - name: PUBLIC_VAR
    value: "not-sensitive" # Plain values OK for non-secrets
```

### PersistentVolumeClaim Patterns

#### Storage Classes

```bash
# List available storage classes
kubectl get storageclasses

# Common storage classes:
# - standard: Default, block storage
# - standard-rwo: ReadWriteOnce (single node)
# - nfs: ReadWriteMany (shared across nodes)
```

#### Access Modes

- **ReadWriteOnce (RWO)**: Single node can mount read-write (most common)
- **ReadOnlyMany (ROX)**: Multiple nodes can mount read-only
- **ReadWriteMany (RWX)**: Multiple nodes can mount read-write (requires NFS/CephFS)

#### Lifecycle Management

PVCs are NOT automatically deleted when Job completes or Helm release is uninstalled:

- **Why**: Data safety - prevent accidental deletion
- **Cleanup**: Manual deletion required (`kubectl delete pvc <name>`)
- **Automation**: Use scripts (e.g., `applications/caelundas/scripts/helm-uninstall.sh`)

#### Retrieving Files from PVC

```bash
# Copy files to local machine
kubectl cp <pod-name>:/app/output/calendar.ics ./output/calendar.ics

# Or use debug container to mount PVC
kubectl debug -it <pod-name> --image=busybox --copy-to=debug -- sh
cd /app/output
ls -lah
```

See [applications/caelundas/scripts/kubernetes-copy-files.sh](../../applications/caelundas/scripts/kubernetes-copy-files.sh) for automated retrieval.

## Terraform Configuration

### Linode LKE Cluster

**Purpose**: Provision and manage Kubernetes cluster on Linode cloud provider.

**Infrastructure** ([terraform/main.tf](terraform/main.tf))

```terraform
resource "linode_lke_cluster" "cluster" {
  label       = "lexico-prod"
  k8s_version = "1.34"
  region      = var.linode_region

  pool {
    type  = "g6-standard-1"  # 2 vCPU, 4GB RAM
    count = 1                # Number of nodes

    autoscaler {
      min = 1                # Minimum nodes
      max = 3                # Maximum nodes (auto-scales under load)
    }
  }
}
```

**Node Types** (Linode pricing tiers)

- `g6-nanode-1`: 1 vCPU, 1GB RAM ($5/mo)
- `g6-standard-1`: 2 vCPU, 4GB RAM ($12/mo) ← Currently used
- `g6-standard-2`: 4 vCPU, 8GB RAM ($24/mo)

**Variables** ([terraform/variables.tf](terraform/variables.tf))

```terraform
variable "linode_token" {
  description = "Linode API token"
  type        = string
  sensitive   = true
}

variable "linode_region" {
  description = "Linode datacenter region"
  type        = string
  default     = "us-east"  # Options: us-east, us-west, eu-west, ap-south
}
```

### Terraform Workflows

#### Initialization

```bash
cd infrastructure/terraform
terraform init
# Downloads Linode provider plugin, initializes state
```

#### Planning Changes

```bash
terraform plan -var="linode_token=$LINODE_API_TOKEN"
# Shows what will be created/updated/destroyed
```

#### Applying Changes

```bash
terraform apply -var="linode_token=$LINODE_API_TOKEN"
# Creates or updates cluster (prompts for confirmation)
```

#### Destroying Infrastructure

```bash
terraform destroy -var="linode_token=$LINODE_API_TOKEN"
# ⚠️ WARNING: Deletes entire cluster and all data
```

#### State Management

Terraform state tracks infrastructure:

- **Local state**: `terraform.tfstate` (single user, no locking)
- **Remote state**: Use Terraform Cloud or S3 backend (team collaboration)

**⚠️ Never commit `terraform.tfstate` to git** (contains sensitive data like IP addresses)

### Connecting to Cluster

#### Get Kubeconfig

```bash
# Via Linode CLI
linode-cli lke kubeconfig-view <cluster-id> --json | jq -r '.[0].kubeconfig' | base64 -d > ~/.kube/lexico-prod-kubeconfig.yaml

# Set KUBECONFIG environment variable
export KUBECONFIG=~/.kube/lexico-prod-kubeconfig.yaml

# Verify connection
kubectl get nodes
```

#### Using Linode Cloud Manager

1. Log in to https://cloud.linode.com
2. Navigate to Kubernetes → lexico-prod cluster
3. Click "Download kubeconfig"
4. Move to `~/.kube/config` or set `KUBECONFIG` env var

## Docker Image Workflows

### Building Images

**Multi-Stage Dockerfile** (example: caelundas)

```dockerfile
# Stage 1: Base image with dependencies
FROM node:20-alpine AS base
RUN corepack enable pnpm
WORKDIR /app

# Stage 2: Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Stage 3: Runtime
FROM base AS runtime
COPY --from=deps /app/node_modules ./node_modules
COPY ./src ./src
COPY ./package.json ./
CMD ["pnpm", "start"]
```

**Build for Kubernetes** (linux/amd64 platform)

```bash
docker buildx build --platform linux/amd64 \
  -f applications/caelundas/Dockerfile \
  -t ghcr.io/jimmypaolini/caelundas:1.0.0 \
  --load .
```

⚠️ **Platform Targeting**: Always build for `linux/amd64` when deploying to Kubernetes, even on Apple Silicon (which defaults to `linux/arm64`).

#### Push to GitHub Container Registry

```bash
# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Build and push
docker buildx build --platform linux/amd64 \
  -f applications/caelundas/Dockerfile \
  -t ghcr.io/jimmypaolini/caelundas:1.0.0 \
  --push .
```

**Image Pull Secrets** (for private registries)

```bash
# Create secret with registry credentials
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=USERNAME \
  --docker-password=$GITHUB_TOKEN \
  --docker-email=EMAIL

# Reference in Helm values
imagePullSecrets:
  - name: ghcr-secret
```

### Image Versioning Strategy

#### Semantic Versioning

- `1.0.0`: Major release (breaking changes)
- `1.1.0`: Minor release (new features, backward compatible)
- `1.1.1`: Patch release (bug fixes)

#### Git-Based Tags

- `ghcr.io/jimmypaolini/caelundas:1.0.0`: Immutable version tag
- `ghcr.io/jimmypaolini/caelundas:latest`: Mutable (not recommended for production)
- `ghcr.io/jimmypaolini/caelundas:sha-abc123`: Git commit SHA (traceability)

#### Image Best Practices

- Always use specific version tags in production (not `latest`)
- Tag images with git SHA for traceability (`--label org.opencontainers.image.revision=$(git rev-parse HEAD)`)
- Use release branches for versioned images (`release/1.0.0`)

## Deployment Pipeline

### High-Level Flow

```text
Code → Docker Build → Push to GHCR → Helm Upgrade → K8s Job → Retrieve Output
  ↓         ↓              ↓              ↓            ↓           ↓
Commit   linux/amd64   ghcr.io/...   kubectl apply  Runs once   Copy files
```

### Step-by-Step (caelundas example)

#### 1. Build Docker Image

```bash
nx run caelundas:docker-build
# Builds for linux/amd64, tags as 1.0.0 and latest, loads into Docker
```

#### 2. Push to Registry

```bash
nx run caelundas:docker-push
# Builds and pushes to ghcr.io/jimmypaolini/caelundas:1.0.0
```

**3. Create Kubernetes Secret** (one-time setup)

```bash
kubectl apply -f applications/caelundas/kubernetes/secret.yaml
# Contains START_DATE, END_DATE, LATITUDE, LONGITUDE, etc.
```

#### 4. Deploy with Helm

```bash
nx run caelundas:helm-upgrade
# Generates release name: caelundas-20260125-143022
# Installs Helm chart with caelundas-production.yaml values
```

#### 5. Monitor Job

```bash
kubectl get jobs -l app.kubernetes.io/name=caelundas
# Shows: NAME, COMPLETIONS, DURATION, AGE

kubectl logs -f <pod-name>
# Stream logs to watch progress
```

#### 6. Retrieve Output

```bash
nx run caelundas:kubernetes-copy-files -- --release-name=caelundas-20260125-143022
# Copies /app/output/* from PVC to local applications/caelundas/output/
```

#### 7. Clean Up

```bash
nx run caelundas:helm-uninstall -- --release-name=caelundas-20260125-143022
# Deletes Helm release and PVC
```

### Automation Opportunities

**GitHub Actions Workflow** (future enhancement)

```yaml
name: Deploy Caelundas

on:
  workflow_dispatch:
    inputs:
      start_date:
        description: "Start date (YYYY-MM-DD)"
        required: true
      end_date:
        description: "End date (YYYY-MM-DD)"
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and push image
        run: nx run caelundas:docker-push
      - name: Update secret
        run: |
          kubectl create secret generic caelundas-env-secret \
            --from-literal=START_DATE=${{ github.event.inputs.start_date }} \
            --from-literal=END_DATE=${{ github.event.inputs.end_date }} \
            --dry-run=client -o yaml | kubectl apply -f -
      - name: Deploy job
        run: nx run caelundas:helm-upgrade
      - name: Wait for completion
        run: kubectl wait --for=condition=complete job -l app.kubernetes.io/name=caelundas --timeout=600s
      - name: Retrieve output
        run: nx run caelundas:kubernetes-copy-files
      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: calendar-output
          path: applications/caelundas/output/
```

## Troubleshooting

### Helm Issues

#### Release Already Exists

```bash
# Error: cannot re-use a name that is still in use
# Solution: Use different release name or uninstall existing
helm uninstall <release-name>
```

#### Values Not Applied

```bash
# Check what values are being used
helm get values <release-name>

# Re-install with explicit values
helm upgrade --install <release-name> ./chart \
  --values values.yaml \
  --set key=value \
  --debug  # Shows rendered templates before applying
```

#### Template Rendering Errors

```bash
# Render templates without installing
helm template <release-name> ./chart --values values.yaml

# Debug template syntax
helm lint ./chart
```

### Kubernetes Issues

#### Job Not Starting

```bash
# Check job status
kubectl describe job <job-name>

# Common causes:
# - Image pull failure (check imagePullSecrets)
# - PVC pending (check storage class exists)
# - Resource limits too high (check node capacity)
```

#### Pod Pending State

```bash
kubectl describe pod <pod-name>

# Common causes:
# - Insufficient resources (CPU/memory)
# - PVC not bound (check PVC status)
# - Node affinity/selector not matching any nodes
```

#### PVC Not Binding

```bash
kubectl get pvc
# Shows: NAME, STATUS (Pending/Bound), VOLUME, CAPACITY

kubectl describe pvc <pvc-name>
# Shows events (e.g., "waiting for volume to be created")

# Common causes:
# - StorageClass doesn't exist
# - No available storage in cluster
# - Access mode not supported by storage class
```

#### Pod Crashing (CrashLoopBackOff)

```bash
kubectl logs <pod-name>
kubectl logs <pod-name> --previous  # Logs from previous crash

# Common causes:
# - Application error (check logs)
# - Missing environment variables
# - Command/args incorrect
```

### Docker Issues

#### Platform Mismatch

```bash
# Error: exec format error (wrong architecture)
# Solution: Rebuild for linux/amd64
docker buildx build --platform linux/amd64 -t <image> .
```

#### Image Pull Failure

```bash
# Error: ErrImagePull, ImagePullBackOff
# Solution: Verify image exists and imagePullSecrets configured

docker pull ghcr.io/jimmypaolini/caelundas:1.0.0  # Test locally

kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=USERNAME \
  --docker-password=$GITHUB_TOKEN
```

### Terraform Issues

#### State Lock Errors

```bash
# Error: state locked by another process
# Solution: Forcefully unlock (if no other terraform process running)
terraform force-unlock <lock-id>
```

#### Provider Authentication Errors

```bash
# Error: authentication failed
# Solution: Verify API token is valid
export TF_VAR_linode_token=$LINODE_API_TOKEN
terraform plan
```

#### Cluster Already Exists

```bash
# Error: cluster "lexico-prod" already exists
# Solution: Import existing cluster into state
terraform import linode_lke_cluster.cluster <cluster-id>
```

## Best Practices

### Security

- **Never commit secrets**: Use Kubernetes Secrets, environment variables, or secret managers
- **Image scanning**: Use tools like Trivy to scan for vulnerabilities
- **RBAC**: Use service accounts with minimal permissions (not default admin)
- **Network policies**: Restrict pod-to-pod communication
- **Resource limits**: Always set CPU/memory limits to prevent resource exhaustion

### Reliability

- **Health checks**: Add liveness/readiness probes for long-running apps
- **Graceful shutdown**: Handle SIGTERM signal for clean exits
- **Retry logic**: Set appropriate `backoffLimit` for transient failures
- **Monitoring**: Use Prometheus + Grafana for cluster monitoring
- **Alerting**: Set up alerts for job failures, resource exhaustion

### Cost Optimization

- **Autoscaling**: Use HPA (Horizontal Pod Autoscaler) for variable load
- **Node autoscaling**: Linode LKE autoscaler (min=1, max=3) scales nodes automatically
- **Spot instances**: Use spot/preemptible nodes for batch jobs (if provider supports)
- **TTL**: Set `ttlSecondsAfterFinished` to auto-delete completed jobs
- **Resource requests**: Set accurate requests to avoid over-provisioning

### Observability

- **Logging**: Use `kubectl logs` or centralized logging (Loki, ELK)
- **Metrics**: Collect CPU/memory/disk metrics with Prometheus
- **Tracing**: Add structured logging with request IDs
- **Dashboards**: Grafana dashboards for job success rate, duration, failures

## Related Documentation

- [Main AGENTS.md](../AGENTS.md): Monorepo architecture, Nx workflows
- [caelundas AGENTS.md](../applications/caelundas/AGENTS.md): Application-specific deployment patterns
- [Helm Documentation](https://helm.sh/docs/): Chart development, templating, best practices
- [Kubernetes Documentation](https://kubernetes.io/docs/): API reference, concepts, tutorials
- [Terraform Documentation](https://developer.hashicorp.com/terraform/docs): Configuration language, providers
- [Linode LKE Documentation](https://www.linode.com/docs/guides/deploy-and-manage-a-cluster-with-linode-kubernetes-engine-a-tutorial/): Cluster management
