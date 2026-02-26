# Kubernetes Deployment Best Practices

Comprehensive guide for deploying and managing applications on Kubernetes. Covers Pods, Deployments, Services, Ingress, ConfigMaps, Secrets, health checks, resource limits, scaling, and security contexts.

## Core Kubernetes Concepts

### Pods

The smallest deployable unit in Kubernetes. Represents a single instance of a running process in your cluster.

- Design Pods to run a single primary container (or tightly coupled sidecars).
- Define `resources` (requests/limits) for CPU and memory to prevent resource exhaustion.
- Implement `livenessProbe` and `readinessProbe` for health checks.
- **Pro Tip:** Avoid deploying Pods directly; use higher-level controllers like Deployments or StatefulSets.

### Deployments

Manages a set of identical Pods and ensures they are running. Handles rolling updates and rollbacks.

- Use Deployments for stateless applications.
- Define desired replicas (`replicas`).
- Specify `selector` and `template` for Pod matching.
- Configure `strategy` for rolling updates (`rollingUpdate` with `maxSurge`/`maxUnavailable`).

#### Example: Simple Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app-deployment
  labels:
    app: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: my-app-container
          image: my-repo/my-app:1.0.0
          ports:
            - containerPort: 8080
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 20
          readinessProbe:
            httpGet:
              path: /readyz
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
```

### Services

An abstract way to expose an application running on a set of Pods as a network service.

- Use Services to provide stable network identity to Pods.
- Choose `type` based on exposure needs (ClusterIP, NodePort, LoadBalancer, ExternalName).
- Ensure `selector` matches Pod labels for proper routing.
- **Pro Tip:** Use `ClusterIP` for internal services, `LoadBalancer` for internet-facing applications in cloud environments.

### Ingress

Manages external access to services in a cluster, typically HTTP/HTTPS routes from outside the cluster to services within.

- Use Ingress to consolidate routing rules and manage TLS termination.
- Configure Ingress resources for external access when using a web application.
- Specify host, path, and backend service.

#### Example: Ingress Configuration

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-ingress
spec:
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-app-service
                port:
                  number: 80
  tls:
    - hosts:
        - myapp.example.com
      secretName: my-app-tls-secret
```

## Configuration and Secrets Management

### ConfigMaps

Store non-sensitive configuration data as key-value pairs.

- Use ConfigMaps for application configuration, environment variables, or command-line arguments.
- Mount ConfigMaps as files in Pods or inject as environment variables.
- **Caution:** ConfigMaps are not encrypted at rest. Do NOT store sensitive data here.

### Secrets

Store sensitive data securely.

- Use Kubernetes Secrets for API keys, passwords, database credentials, TLS certificates.
- Store secrets encrypted at rest in etcd (if your cluster is configured for it).
- Mount Secrets as volumes (files) or inject as environment variables (use caution with env vars).
- **Pro Tip:** For production, integrate with external secret managers (e.g., HashiCorp Vault, AWS Secrets Manager, Azure Key Vault) using external Secrets operators (e.g., External Secrets Operator).

## Health Checks and Probes

### Liveness Probe

Determines if a container is still running. If it fails, Kubernetes restarts the container.

- Implement an HTTP, TCP, or command-based liveness probe to ensure the application is active.
- Configuration options: `initialDelaySeconds`, `periodSeconds`, `timeoutSeconds`, `failureThreshold`, `successThreshold`.

### Readiness Probe

Determines if a container is ready to serve traffic. If it fails, Kubernetes removes the Pod from Service load balancers.

- Implement an HTTP, TCP, or command-based readiness probe to ensure the application is fully initialized and dependent services are available.
- **Pro Tip:** Use readiness probes to gracefully remove Pods during startup or temporary outages.

## Resource Management

### Resource Requests and Limits

Define CPU and memory requests/limits for every container.

- **Requests:** Guaranteed minimum resources (for scheduling).
- **Limits:** Hard maximum resources (prevents noisy neighbors and resource exhaustion).
- Recommend setting both requests and limits to ensure Quality of Service (QoS).
- **QoS Classes:** Learn about `Guaranteed`, `Burstable`, and `BestEffort`.

### Horizontal Pod Autoscaler (HPA)

Automatically scales the number of Pod replicas based on observed CPU utilization or other custom metrics.

- Recommend HPA for stateless applications with fluctuating load.
- Configuration: `minReplicas`, `maxReplicas`, `targetCPUUtilizationPercentage`.

### Vertical Pod Autoscaler (VPA)

Automatically adjusts the CPU and memory requests/limits for containers based on usage history.

- Recommend VPA for optimizing resource usage for individual Pods over time.

## Security Best Practices

### Network Policies

Control communication between Pods and network endpoints.

- Recommend implementing granular network policies (deny by default, allow by exception) to restrict Pod-to-Pod and Pod-to-external communication.

### Role-Based Access Control (RBAC)

Control who can do what in your Kubernetes cluster.

- Define granular `Roles` and `ClusterRoles`, then bind them to `ServiceAccounts` or users/groups using `RoleBindings` and `ClusterRoleBindings`.
- **Least Privilege:** Always apply the principle of least privilege.

### Pod Security Context

Define security settings at the Pod or container level.

- Use `runAsNonRoot: true` to prevent containers from running as root.
- Set `allowPrivilegeEscalation: false`.
- Use `readOnlyRootFilesystem: true` where possible.
- Drop unneeded capabilities (`capabilities: drop: [ALL]`).

#### Example: Pod Security Context

```yaml
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 2000
  containers:
    - name: my-app
      image: my-repo/my-app:1.0.0
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL
```

### Image Security

Ensure container images are secure and free of vulnerabilities.

- Use trusted, minimal base images (distroless, alpine).
- Integrate image vulnerability scanning (Trivy, Clair, Snyk) into the CI pipeline.
- Implement image signing and verification.

### API Server Security

Secure access to the Kubernetes API server.

- Use strong authentication (client certificates, OIDC), enforce RBAC, and enable API auditing.

## Logging, Monitoring, and Observability

### Centralized Logging

Collect logs from all Pods and centralize them for analysis.

- Use standard output (`STDOUT`/`STDERR`) for application logs.
- Deploy a logging agent (e.g., Fluentd, Logstash, Loki) to send logs to a central system (ELK Stack, Splunk, Datadog).

### Metrics Collection

Collect and store key performance indicators (KPIs) from Pods, nodes, and cluster components.

- Use Prometheus with `kube-state-metrics` and `node-exporter`.
- Define custom metrics using application-specific exporters.
- Configure Grafana for visualization.

### Alerting

Set up alerts for anomalies and critical events.

- Configure Prometheus Alertmanager for rule-based alerting.
- Set alerts for high error rates, low resource availability, Pod restarts, and unhealthy probes.

### Distributed Tracing

Trace requests across multiple microservices within the cluster.

- Implement OpenTelemetry or Jaeger/Zipkin for end-to-end request tracing.

## Deployment Strategies

### Rolling Updates (Default)

Gradually replace Pods of the old version with new ones.

- This is the default for Deployments.
- Configure `maxSurge` and `maxUnavailable` for fine-grained control.
- **Benefit:** Minimal downtime during updates.

### Blue/Green Deployment

Run two identical environments (blue and green); switch traffic completely.

- Recommend for zero-downtime releases.
- Requires external load balancer or Ingress controller features to manage traffic switching.

### Canary Deployment

Gradually roll out a new version to a small subset of users before full rollout.

- Recommend for testing new features with real traffic.
- Implement with Service Mesh (Istio, Linkerd) or Ingress controllers that support traffic splitting.

### Rollback Strategy

Be able to revert to a previous stable version quickly and safely.

- Use `kubectl rollout undo` for Deployments.
- Ensure previous image versions are available.

## Kubernetes Manifest Review Checklist

- [ ] Is `apiVersion` and `kind` correct for the resource?
- [ ] Is `metadata.name` descriptive and follows naming conventions?
- [ ] Are `labels` and `selectors` consistently used?
- [ ] Are `replicas` set appropriately for the workload?
- [ ] Are `resources` (requests/limits) defined for all containers?
- [ ] Are `livenessProbe` and `readinessProbe` correctly configured?
- [ ] Are sensitive configurations handled via Secrets (not ConfigMaps)?
- [ ] Is `readOnlyRootFilesystem: true` set where possible?
- [ ] Is `runAsNonRoot: true` and a non-root `runAsUser` defined?
- [ ] Are unnecessary `capabilities` dropped?
- [ ] Are `NetworkPolicies` considered for communication restrictions?
- [ ] Is RBAC configured with least privilege for ServiceAccounts?
- [ ] Are `ImagePullPolicy` and image tags (`:latest` avoided) correctly set?
- [ ] Is logging sent to `STDOUT`/`STDERR`?
- [ ] Are appropriate `nodeSelector` or `tolerations` used for scheduling?
- [ ] Is the `strategy` for rolling updates configured?
- [ ] Are `Deployment` events and Pod statuses monitored?

## Troubleshooting Common Issues

### Pods Not Starting (Pending, CrashLoopBackOff)

- Check `kubectl describe pod <pod_name>` for events and error messages.
- Review container logs (`kubectl logs <pod_name> -c <container_name>`).
- Verify resource requests/limits are not too low.
- Check for image pull errors (typo in image name, repository access).
- Ensure required ConfigMaps/Secrets are mounted and accessible.

### Pods Not Ready (Service Unavailable)

- Check `readinessProbe` configuration.
- Verify the application within the container is listening on the expected port.
- Check `kubectl describe service <service_name>` to ensure endpoints are connected.

### Service Not Accessible

- Verify Service `selector` matches Pod labels.
- Check Service `type` (ClusterIP for internal, LoadBalancer for external).
- For Ingress, check Ingress controller logs and Ingress resource rules.
- Review `NetworkPolicies` that might be blocking traffic.

### Resource Exhaustion (OOMKilled)

- Increase `memory.limits` for containers.
- Optimize application memory usage.
- Use `Vertical Pod Autoscaler` to recommend optimal limits.

### Performance Issues

- Monitor CPU/memory usage with `kubectl top pod` or Prometheus.
- Check application logs for slow queries or operations.
- Analyze distributed traces for bottlenecks.
- Review database performance.

## Summary

Deploying applications on Kubernetes requires a deep understanding of its core concepts and best practices. By following these guidelines for Pods, Deployments, Services, Ingress, configuration, security, and observability, you can build highly resilient, scalable, and secure cloud-native applications. Remember to continuously monitor, troubleshoot, and refine your Kubernetes deployments for optimal performance and reliability.
