# Infrastructure

Shared infrastructure assets for the monorepo.

This directory currently contains a reusable Helm chart for Kubernetes jobs and
Terraform configuration for cluster provisioning. The checked-in workspace does
not currently expose application-specific Docker or Helm Nx targets.

## Contents

| Path | Purpose |
| ---- | ------- |
| `helm/kubernetes-job/` | Reusable Helm chart for batch-job style workloads |
| `terraform/` | Terraform configuration for Kubernetes infrastructure |

## Common Commands

### Helm

```bash
helm upgrade --install <release-name> infrastructure/helm/kubernetes-job \
  --values infrastructure/helm/kubernetes-job/values/base.yaml
```

### Terraform

```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

## Notes

- Use direct `docker`, `kubectl`, `helm`, and `terraform` commands when working
  in this directory.
- The chart under `helm/kubernetes-job/` is intended for batch jobs rather than
  long-running deployments.

For architecture and workflow guidance, see [AGENTS.md](AGENTS.md).
