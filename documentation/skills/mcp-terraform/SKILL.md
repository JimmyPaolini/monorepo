---
name: mcp-terraform
description: Use the Terraform MCP server for infrastructure as code operations - plan, apply, state management. Use this skill when working with Terraform configurations or deploying infrastructure.
license: MIT
---

# Terraform MCP Server

This skill covers using the Terraform MCP server to manage infrastructure as code, including planning changes, applying configurations, managing state, and querying resources.

## When to Use

Use Terraform MCP tools when:

- Planning infrastructure changes
- Applying Terraform configurations
- Querying Terraform state
- Managing workspaces
- Validating configuration files
- Troubleshooting infrastructure deployments
- Generating infrastructure documentation
- Importing existing resources

## Available MCP Tools

The Terraform MCP server provides these tools (prefix: `mcp_terraform_`):

### Configuration Management

**`mcp_terraform_init`** - Initialize Terraform working directory

**Parameters:**

- `directory` (required): Path to Terraform configuration directory
- `upgrade` (optional): Upgrade providers (default: false)
- `backend_config` (optional): Backend configuration overrides

**Example usage:**

```typescript
// Basic init
mcp_terraform_init({
  directory: "infrastructure/terraform",
});

// With provider upgrade
mcp_terraform_init({
  directory: "infrastructure/terraform",
  upgrade: true,
});

// With backend config
mcp_terraform_init({
  directory: "infrastructure/terraform",
  backend_config: {
    bucket: "my-terraform-state",
    key: "prod/terraform.tfstate",
  },
});
```

**`mcp_terraform_validate`** - Validate Terraform configuration

**Parameters:**

- `directory` (required): Path to Terraform configuration directory

**Example usage:**

```typescript
const validation = mcp_terraform_validate({
  directory: "infrastructure/terraform",
});

if (!validation.valid) {
  console.error("Validation errors:", validation.errors);
}
```

**`mcp_terraform_fmt`** - Format Terraform files

**Parameters:**

- `directory` (required): Path to Terraform configuration directory
- `check` (optional): Check if files are formatted (default: false)
- `recursive` (optional): Format subdirectories (default: false)

**Example usage:**

```typescript
// Format files
mcp_terraform_fmt({
  directory: "infrastructure/terraform",
  recursive: true,
});

// Check formatting
const result = mcp_terraform_fmt({
  directory: "infrastructure/terraform",
  check: true,
});
```

### Planning & Applying

**`mcp_terraform_plan`** - Generate execution plan

**Parameters:**

- `directory` (required): Path to Terraform configuration directory
- `var_file` (optional): Path to variables file
- `vars` (optional): Variable overrides
- `target` (optional): Resource to target
- `out` (optional): Save plan to file

**Example usage:**

```typescript
// Basic plan
const plan = mcp_terraform_plan({
  directory: "infrastructure/terraform",
});

// With variables
const plan = mcp_terraform_plan({
  directory: "infrastructure/terraform",
  var_file: "production.tfvars",
  vars: {
    environment: "prod",
    region: "us-east-1",
  },
});

// Target specific resource
const plan = mcp_terraform_plan({
  directory: "infrastructure/terraform",
  target: "kubernetes_deployment.caelundas",
});
```

**`mcp_terraform_apply`** - Apply Terraform changes

**Parameters:**

- `directory` (required): Path to Terraform configuration directory
- `var_file` (optional): Path to variables file
- `vars` (optional): Variable overrides
- `target` (optional): Resource to target
- `auto_approve` (optional): Skip confirmation (default: false)

**Example usage:**

```typescript
// Apply with confirmation
mcp_terraform_apply({
  directory: "infrastructure/terraform",
});

// Auto approve (use cautiously)
mcp_terraform_apply({
  directory: "infrastructure/terraform",
  auto_approve: true,
});

// Apply specific resource
mcp_terraform_apply({
  directory: "infrastructure/terraform",
  target: "kubernetes_deployment.caelundas",
  auto_approve: true,
});
```

**`mcp_terraform_destroy`** - Destroy Terraform-managed infrastructure

**Parameters:**

- `directory` (required): Path to Terraform configuration directory
- `target` (optional): Resource to destroy
- `auto_approve` (optional): Skip confirmation (default: false)

**Example usage:**

```typescript
// Destroy specific resource
mcp_terraform_destroy({
  directory: "infrastructure/terraform",
  target: "kubernetes_job.caelundas_job",
  auto_approve: true,
});

// Destroy all resources (dangerous!)
mcp_terraform_destroy({
  directory: "infrastructure/terraform",
  auto_approve: false, // Force confirmation
});
```

### State Management

**`mcp_terraform_state_list`** - List resources in state

**Parameters:**

- `directory` (required): Path to Terraform configuration directory

**Example usage:**

```typescript
const resources = mcp_terraform_state_list({
  directory: "infrastructure/terraform",
});
// Returns: Array of resource addresses
```

**`mcp_terraform_state_show`** - Show resource details

**Parameters:**

- `directory` (required): Path to Terraform configuration directory
- `address` (required): Resource address

**Example usage:**

```typescript
const resource = mcp_terraform_state_show({
  directory: "infrastructure/terraform",
  address: "kubernetes_deployment.caelundas",
});
```

**`mcp_terraform_state_rm`** - Remove resource from state

**Parameters:**

- `directory` (required): Path to Terraform configuration directory
- `address` (required): Resource address

**Example usage:**

```typescript
mcp_terraform_state_rm({
  directory: "infrastructure/terraform",
  address: "kubernetes_job.old_job",
});
```

**`mcp_terraform_state_mv`** - Move resource in state

**Parameters:**

- `directory` (required): Path to Terraform configuration directory
- `source` (required): Source address
- `destination` (required): Destination address

**Example usage:**

```typescript
mcp_terraform_state_mv({
  directory: "infrastructure/terraform",
  source: "kubernetes_deployment.old_name",
  destination: "kubernetes_deployment.new_name",
});
```

**`mcp_terraform_state_pull`** - Download remote state

**Parameters:**

- `directory` (required): Path to Terraform configuration directory

**Example usage:**

```typescript
const state = mcp_terraform_state_pull({
  directory: "infrastructure/terraform",
});
// Returns: State JSON
```

### Resource Operations

**`mcp_terraform_import`** - Import existing resource

**Parameters:**

- `directory` (required): Path to Terraform configuration directory
- `address` (required): Resource address
- `id` (required): Provider-specific resource ID

**Example usage:**

```typescript
// Import Kubernetes deployment
mcp_terraform_import({
  directory: "infrastructure/terraform",
  address: "kubernetes_deployment.caelundas",
  id: "default/caelundas",
});

// Import GCP resource
mcp_terraform_import({
  directory: "infrastructure/terraform",
  address: "google_compute_instance.vm",
  id: "projects/my-project/zones/us-central1-a/instances/my-vm",
});
```

**`mcp_terraform_taint`** - Mark resource for recreation

**Parameters:**

- `directory` (required): Path to Terraform configuration directory
- `address` (required): Resource address

**Example usage:**

```typescript
mcp_terraform_taint({
  directory: "infrastructure/terraform",
  address: "kubernetes_deployment.caelundas",
});
// Next apply will recreate this resource
```

**`mcp_terraform_untaint`** - Remove taint from resource

**Parameters:**

- `directory` (required): Path to Terraform configuration directory
- `address` (required): Resource address

**Example usage:**

```typescript
mcp_terraform_untaint({
  directory: "infrastructure/terraform",
  address: "kubernetes_deployment.caelundas",
});
```

### Output Operations

**`mcp_terraform_output`** - Get output values

**Parameters:**

- `directory` (required): Path to Terraform configuration directory
- `name` (optional): Specific output name

**Example usage:**

```typescript
// Get all outputs
const outputs = mcp_terraform_output({
  directory: "infrastructure/terraform",
});

// Get specific output
const endpoint = mcp_terraform_output({
  directory: "infrastructure/terraform",
  name: "cluster_endpoint",
});
```

### Workspace Operations

**`mcp_terraform_workspace_list`** - List workspaces

**Parameters:**

- `directory` (required): Path to Terraform configuration directory

**Example usage:**

```typescript
const workspaces = mcp_terraform_workspace_list({
  directory: "infrastructure/terraform",
});
```

**`mcp_terraform_workspace_select`** - Switch workspace

**Parameters:**

- `directory` (required): Path to Terraform configuration directory
- `name` (required): Workspace name

**Example usage:**

```typescript
mcp_terraform_workspace_select({
  directory: "infrastructure/terraform",
  name: "production",
});
```

**`mcp_terraform_workspace_new`** - Create workspace

**Parameters:**

- `directory` (required): Path to Terraform configuration directory
- `name` (required): Workspace name

**Example usage:**

```typescript
mcp_terraform_workspace_new({
  directory: "infrastructure/terraform",
  name: "staging",
});
```

## Workflow Patterns

### Deploying Infrastructure

1. **Initialize Terraform:**

   ```typescript
   mcp_terraform_init({
     directory: "infrastructure/terraform",
     upgrade: true,
   });
   ```

2. **Validate configuration:**

   ```typescript
   const validation = mcp_terraform_validate({
     directory: "infrastructure/terraform",
   });

   if (!validation.valid) {
     throw new Error("Configuration invalid");
   }
   ```

3. **Plan changes:**

   ```typescript
   const plan = mcp_terraform_plan({
     directory: "infrastructure/terraform",
     var_file: "production.tfvars",
   });

   console.log("Resources to create:", plan.resource_changes.create);
   console.log("Resources to update:", plan.resource_changes.update);
   console.log("Resources to destroy:", plan.resource_changes.delete);
   ```

4. **Review and apply:**

   ```typescript
   if (userConfirms(plan)) {
     mcp_terraform_apply({
       directory: "infrastructure/terraform",
       var_file: "production.tfvars",
       auto_approve: true,
     });
   }
   ```

### Managing State

1. **List resources:**

   ```typescript
   const resources = mcp_terraform_state_list({
     directory: "infrastructure/terraform",
   });
   ```

2. **Inspect resource:**

   ```typescript
   const details = mcp_terraform_state_show({
     directory: "infrastructure/terraform",
     address: "kubernetes_deployment.caelundas",
   });
   ```

3. **Remove orphaned resource:**

   ```typescript
   mcp_terraform_state_rm({
     directory: "infrastructure/terraform",
     address: "kubernetes_job.old_job",
   });
   ```

### Multi-Environment Deployment

1. **Create workspaces:**

   ```typescript
   for (const env of ["dev", "staging", "prod"]) {
     try {
       mcp_terraform_workspace_new({
         directory: "infrastructure/terraform",
         name: env,
       });
     } catch (error) {
       // Workspace already exists
     }
   }
   ```

2. **Deploy to each environment:**

   ```typescript
   for (const env of ["dev", "staging", "prod"]) {
     mcp_terraform_workspace_select({
       directory: "infrastructure/terraform",
       name: env,
     });

     const plan = mcp_terraform_plan({
       directory: "infrastructure/terraform",
       var_file: `${env}.tfvars`,
     });

     mcp_terraform_apply({
       directory: "infrastructure/terraform",
       var_file: `${env}.tfvars`,
       auto_approve: true,
     });
   }
   ```

## Project-Specific Usage

### caelundas Infrastructure

**Deploy Kubernetes resources:**

```typescript
// Initialize
mcp_terraform_init({
  directory: "infrastructure/terraform",
});

// Plan deployment
const plan = mcp_terraform_plan({
  directory: "infrastructure/terraform",
  vars: {
    caelundas_image: "ghcr.io/jimmypaolini/caelundas:latest",
    caelundas_replicas: 1,
  },
});

// Apply
mcp_terraform_apply({
  directory: "infrastructure/terraform",
  vars: {
    caelundas_image: "ghcr.io/jimmypaolini/caelundas:latest",
    caelundas_replicas: 1,
  },
  auto_approve: true,
});

// Get cluster endpoint
const endpoint = mcp_terraform_output({
  directory: "infrastructure/terraform",
  name: "cluster_endpoint",
});
```

**Update deployment:**

```typescript
// Change image tag
mcp_terraform_apply({
  directory: "infrastructure/terraform",
  target: "kubernetes_deployment.caelundas",
  vars: {
    caelundas_image: "ghcr.io/jimmypaolini/caelundas:v1.2.3",
  },
  auto_approve: true,
});
```

### Infrastructure Documentation

**Generate docs from state:**

```typescript
const resources = mcp_terraform_state_list({
  directory: "infrastructure/terraform",
});

const docs = [];

for (const address of resources) {
  const resource = mcp_terraform_state_show({
    directory: "infrastructure/terraform",
    address,
  });

  docs.push({
    type: resource.type,
    name: resource.name,
    attributes: resource.attributes,
  });
}

// Generate markdown documentation
const markdown = generateInfrastructureDocs(docs);
await fs.writeFile("infrastructure/INFRASTRUCTURE.md", markdown);
```

## Common Use Cases

### Import Existing Resources

```typescript
// List resources to import
const existingResources = [
  { address: "kubernetes_namespace.default", id: "default" },
  { address: "kubernetes_deployment.caelundas", id: "default/caelundas" },
];

// Import each resource
for (const resource of existingResources) {
  mcp_terraform_import({
    directory: "infrastructure/terraform",
    address: resource.address,
    id: resource.id,
  });
}
```

### Disaster Recovery

```typescript
// Pull current state
const state = mcp_terraform_state_pull({
  directory: "infrastructure/terraform",
});

// Save backup
await fs.writeFile(
  `backups/terraform-state-${Date.now()}.json`,
  JSON.stringify(state, null, 2),
);

// If disaster occurs, restore from backup and re-apply
```

### Drift Detection

```typescript
// Run plan to detect drift
const plan = mcp_terraform_plan({
  directory: "infrastructure/terraform",
});

// Check for unexpected changes
if (plan.resource_changes.update.length > 0) {
  console.warn("Infrastructure drift detected!");

  for (const change of plan.resource_changes.update) {
    console.log(`Resource: ${change.address}`);
    console.log("Changes:", change.change);
  }
}
```

### Rolling Updates

```typescript
// Update deployment gradually
const replicas = [1, 2, 3];

for (const count of replicas) {
  mcp_terraform_apply({
    directory: "infrastructure/terraform",
    target: "kubernetes_deployment.caelundas",
    vars: { replicas: count },
    auto_approve: true,
  });

  // Wait for stability
  await sleep(30000);

  // Check health
  const healthy = await checkDeploymentHealth();
  if (!healthy) {
    console.error("Deployment unhealthy, rolling back");
    break;
  }
}
```

## Troubleshooting

**State locked:**

```typescript
// Force unlock (use cautiously)
mcp_terraform_force_unlock({
  directory: "infrastructure/terraform",
  lock_id: "lock-id-from-error",
});
```

**Provider initialization failed:**

- Check provider version constraints
- Verify authentication credentials
- Run `terraform init -upgrade`

**Resource already exists:**

- Import existing resource
- Or remove from state if managing separately

**Plan shows unexpected changes:**

- Check for manual modifications in provider
- Review variable values
- Verify state is up to date

## Best Practices

1. **Always run plan before apply**
2. **Use remote state** for team collaboration
3. **Version control configurations** in git
4. **Use workspaces** for environments
5. **Tag resources** for organization
6. **Enable state locking** to prevent conflicts
7. **Back up state files** regularly
8. **Use modules** for reusability
9. **Validate before commit** with CI/CD
10. **Document outputs** and variables

## Security Considerations

- **Protect state files** - contain sensitive data
- **Use encrypted remote backend** (S3 + KMS, GCS)
- **Restrict provider credentials** to minimum necessary
- **Use service accounts** instead of personal credentials
- **Rotate credentials** regularly
- **Audit infrastructure changes** with Terraform Cloud/Enterprise
- **Never commit credentials** to version control

## Related Documentation

- [infrastructure/AGENTS.md](../../infrastructure/AGENTS.md) - Infrastructure architecture
- [infrastructure/README.md](../../infrastructure/README.md) - Infrastructure overview
- [kubernetes-deployment skill](../kubernetes-deployment/SKILL.md) - K8s patterns
- [Terraform Documentation](https://www.terraform.io/docs) - Official Terraform docs

## See Also

- **kubernetes-deployment skill** - For K8s-specific patterns
- **docker-workflows skill** - For container workflows
- **github-actions skill** - For CI/CD integration
