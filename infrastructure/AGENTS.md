# Infrastructure: Kubernetes & Cloud Deployment

## Quick Start

**Purpose**: Helm charts and Terraform for deploying monorepo apps to Kubernetes

### Helm (Batch Jobs)

```bash
helm upgrade --install <release-name> infrastructure/helm/kubernetes-job/ \
  --values infrastructure/helm/kubernetes-job/values/caelundas-production.yaml
```

### Terraform

```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

## Architecture Overview

### Directory Structure

```text
infrastructure/
├── helm/
│   └── kubernetes-job/      # Reusable chart for K8s Jobs
└── terraform/               # Cluster provisioning
```

### kubernetes-job Chart

**Purpose**: Deploy batch jobs with optional PVC storage.

**Use cases**:

- Batch processing (caelundas)
- Data migrations
- Report generation

See [Deployment Models](../documentation/architecture/deployment-models.md) for Jobs vs. Deployments.

## Helm Chart References

- Chart metadata: [helm/kubernetes-job/Chart.yaml](helm/kubernetes-job/Chart.yaml)
- Base values: [helm/kubernetes-job/values/base.yaml](helm/kubernetes-job/values/base.yaml)
- Caelundas values: [helm/kubernetes-job/values/caelundas-production.yaml](helm/kubernetes-job/values/caelundas-production.yaml)
- Templates: [helm/kubernetes-job/templates/](helm/kubernetes-job/templates/)

## Kubernetes Deployment

Use Nx wrappers when available (e.g., `nx run caelundas:helm-upgrade`).

See [kubernetes-deployment skill](../documentation/skills/kubernetes-deployment/SKILL.md) for Helm patterns and PVC management.

## Troubleshooting

See [Common Gotchas](../documentation/troubleshooting/gotchas.md) for:

- Job pending errors
- PVC lifecycle issues
- Image pull failures

## Key Files

- [helm/kubernetes-job/templates/job.yaml](helm/kubernetes-job/templates/job.yaml): Job template
- [helm/kubernetes-job/templates/pvc.yaml](helm/kubernetes-job/templates/pvc.yaml): PVC template
- [helm/kubernetes-job/templates/\_helpers.tpl](helm/kubernetes-job/templates/_helpers.tpl): Helpers
- [terraform/main.tf](terraform/main.tf): Cluster definition
